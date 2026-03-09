#!/usr/bin/env node
/**
 * @kylebrodeur/type-safe-mapping CLI
 *
 * Usage:
 *   npx @kylebrodeur/type-safe-mapping init <source-file> <target-file> [options]
 *
 * Options:
 *   --stdout   Print generated code to stdout instead of writing to a file
 *   --out      Specify an output file path (default: <SourceName>Mapper.ts next to source file)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InterfaceField {
  name: string;
  type: string;
  optional: boolean;
}

interface ParsedInterface {
  name: string;
  fields: InterfaceField[];
}

// ---------------------------------------------------------------------------
// TypeScript interface parser (regex-based, zero dependencies)
// ---------------------------------------------------------------------------

/**
 * Extract all top-level TypeScript `interface` blocks from source text.
 * Handles nested braces and optional fields.
 */
function parseInterfaces(source: string): ParsedInterface[] {
  const interfaces: ParsedInterface[] = [];

  // Match `interface Foo {` or `export interface Foo {`
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[^{]+)?\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = interfaceRegex.exec(source)) !== null) {
    const name = match[1];
    const bodyStart = match.index + match[0].length;
    const body = extractBlock(source, bodyStart);

    if (body !== null) {
      const fields = parseFields(body);
      interfaces.push({ name, fields });
    }
  }

  return interfaces;
}

/**
 * Extract the content between matching `{...}`, starting right after the opening brace.
 */
function extractBlock(source: string, start: number): string | null {
  let depth = 1;
  let i = start;

  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }

  if (depth !== 0) return null;
  return source.slice(start, i - 1);
}

/**
 * Parse interface body into fields, skipping comments and index signatures.
 */
function parseFields(body: string): InterfaceField[] {
  const fields: InterfaceField[] = [];

  // Remove single-line comments
  const cleaned = body
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // Match `fieldName?: type;` or `fieldName: type;`
  // This handles simple types, generics, unions, and intersections
  const fieldRegex = /^\s*(readonly\s+)?(\w+)(\?)?:\s*([^;]+);?\s*$/gm;
  let m: RegExpExecArray | null;

  while ((m = fieldRegex.exec(cleaned)) !== null) {
    const fieldName = m[2];
    const optional = m[3] === '?';
    const type = m[4].trim();

    // Skip index signatures like [key: string]: unknown
    if (/^\[/.test(fieldName)) continue;

    fields.push({ name: fieldName, type, optional });
  }

  return fields;
}

// ---------------------------------------------------------------------------
// Field name matching heuristics
// ---------------------------------------------------------------------------

/** Convert snake_case or kebab-case to camelCase */
function toCamelCase(str: string): string {
  return str.replace(/[_-](\w)/g, (_, c: string) => c.toUpperCase());
}

/**
 * Attempt to pair source fields with target fields.
 * Strategy:
 *   1. Exact name match
 *   2. camelCase(sourceName) === targetName
 *   3. Leave unmatched
 */
function pairFields(
  sourceFields: InterfaceField[],
  targetFields: InterfaceField[],
): Array<{ source: string; target: string | null }> {
  const targetByName = new Map(targetFields.map((f) => [f.name, f]));
  const targetByCamel = new Map(targetFields.map((f) => [toCamelCase(f.name), f]));

  return sourceFields.map((sf) => {
    // 1. Exact match
    if (targetByName.has(sf.name)) {
      return { source: sf.name, target: sf.name };
    }
    // 2. camelCase match
    const camel = toCamelCase(sf.name);
    if (targetByCamel.has(camel)) {
      return { source: sf.name, target: targetByCamel.get(camel)!.name };
    }
    return { source: sf.name, target: null };
  });
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

function generateMapper(
  sourceFile: string,
  sourceIface: ParsedInterface,
  targetIface: ParsedInterface | null,
): string {
  const pairs = targetIface
    ? pairFields(sourceIface.fields, targetIface.fields)
    : sourceIface.fields.map((f) => ({ source: f.name, target: null as string | null }));

  const mappingLines = pairs.map(({ source, target }) => {
    if (target !== null && target !== source) {
      return `  ${source}: '${target}',`;
    }
    if (target === source) {
      return `  ${source}: '${source}', // same name in both interfaces`;
    }
    // No match found – leave a TODO comment
    return `  // TODO: ${source}: 'targetFieldName',`;
  });

  const sourceTypeName = sourceIface.name;
  const targetTypeName = targetIface?.name ?? `Mapped${sourceTypeName}`;
  const mapperClassName = `${sourceTypeName}Mapper`;

  const sourceImportPath = basename(sourceFile, extname(sourceFile));

  const imports = [
    `import { MappedServiceBase, MappedType } from '@kylebrodeur/type-safe-mapping';`,
    `import type { ${sourceTypeName} } from './${sourceImportPath}.js';`,
    targetIface
      ? `// The target interface (${targetTypeName}) is inferred from the mapping below.`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `${imports}

const fieldMapping = {
${mappingLines.join('\n')}
} as const;

export type ${targetTypeName} = MappedType<${sourceTypeName}, typeof fieldMapping>;

export class ${mapperClassName} extends MappedServiceBase<${sourceTypeName}, typeof fieldMapping> {
  protected fieldMapping = fieldMapping;
}
`;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function printUsage(): void {
  console.log(`
Usage:
  npx @kylebrodeur/type-safe-mapping init <source-file> <target-file> [options]

Arguments:
  source-file   Path to the TypeScript file containing the source interface (e.g., API response)
  target-file   Path to the TypeScript file containing the target/domain interface

Options:
  --stdout      Print the generated mapper code to stdout instead of writing a file
  --out <file>  Specify a custom output file path

Example:
  npx @kylebrodeur/type-safe-mapping init ./src/types/ApiUser.ts ./src/models/User.ts
  npx @kylebrodeur/type-safe-mapping init ./src/types/ApiUser.ts ./src/models/User.ts --stdout
`);
}

function main(argv: string[]): void {
  const args = argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  if (command !== 'init') {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }

  // Parse flags
  const stdoutFlag = args.includes('--stdout');
  const outIndex = args.indexOf('--out');
  const outFile = outIndex !== -1 ? args[outIndex + 1] : null;

  // Positional args after the command
  const positional = args.slice(1).filter((a) => !a.startsWith('--') && a !== outFile);

  if (positional.length < 1) {
    console.error('Error: <source-file> is required.');
    printUsage();
    process.exit(1);
  }

  const sourceFilePath = resolve(positional[0]);
  const targetFilePath = positional[1] ? resolve(positional[1]) : null;

  if (!existsSync(sourceFilePath)) {
    console.error(`Error: Source file not found: ${sourceFilePath}`);
    process.exit(1);
  }

  if (targetFilePath && !existsSync(targetFilePath)) {
    console.error(`Error: Target file not found: ${targetFilePath}`);
    process.exit(1);
  }

  // Read source file
  let sourceContent: string;
  try {
    sourceContent = readFileSync(sourceFilePath, 'utf-8');
  } catch {
    console.error(`Error: Could not read source file: ${sourceFilePath}`);
    process.exit(1);
  }

  // Read target file (optional)
  let targetContent: string | null = null;
  if (targetFilePath) {
    try {
      targetContent = readFileSync(targetFilePath, 'utf-8');
    } catch {
      console.error(`Error: Could not read target file: ${targetFilePath}`);
      process.exit(1);
    }
  }

  // Parse interfaces
  const sourceInterfaces = parseInterfaces(sourceContent);
  if (sourceInterfaces.length === 0) {
    console.error(`Error: No TypeScript interfaces found in ${sourceFilePath}`);
    process.exit(1);
  }

  const targetInterfaces = targetContent ? parseInterfaces(targetContent) : [];

  // Use the first interface from each file
  const sourceIface = sourceInterfaces[0];
  const targetIface = targetInterfaces.length > 0 ? targetInterfaces[0] : null;

  if (sourceInterfaces.length > 1) {
    console.warn(
      `Warning: Multiple interfaces found in source file. Using the first one: ${sourceIface.name}`,
    );
  }
  if (targetInterfaces.length > 1) {
    console.warn(
      `Warning: Multiple interfaces found in target file. Using the first one: ${targetInterfaces[0].name}`,
    );
  }

  // Generate mapper code
  const code = generateMapper(sourceFilePath, sourceIface, targetIface);

  if (stdoutFlag) {
    process.stdout.write(code);
    return;
  }

  // Determine output path
  const outputPath = outFile
    ? resolve(outFile)
    : resolve(dirname(sourceFilePath), `${sourceIface.name}Mapper.ts`);

  if (existsSync(outputPath)) {
    console.error(`Error: Output file already exists: ${outputPath}`);
    console.error('Use --out to specify a different path, or --stdout to preview.');
    process.exit(1);
  }

  try {
    writeFileSync(outputPath, code, 'utf-8');
    console.log(`✓ Generated mapper: ${outputPath}`);
    console.log('\nNext steps:');
    console.log(`  1. Review the generated field mapping in ${basename(outputPath)}`);
    console.log('  2. Fill in any TODO entries with the correct target field names');
    console.log('  3. Run tsc --noEmit to verify type safety');
  } catch {
    console.error(`Error: Could not write output file: ${outputPath}`);
    process.exit(1);
  }
}

main(process.argv);
