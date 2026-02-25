#!/usr/bin/env node

/**
 * Generate mapper boilerplate from a field mapping definition
 * Usage: node generate-mapper.ts <mapper-name> <source-type-name>
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const [mapperName, sourceTypeName] = process.argv.slice(2);

if (!mapperName || !sourceTypeName) {
  console.error('Usage: node generate-mapper.ts <mapper-name> <source-type-name>');
  console.error('Example: node generate-mapper.ts UserMapper ApiUser');
  process.exit(1);
}

const template = `import { MappedServiceBase, MappedType } from '@kylebrodeur/type-safe-mapping';

// TODO: Import your source type
// import { ${sourceTypeName} } from './types';

// TODO: Define your field mapping
const fieldMapping = {
  // external_field: 'internalField',
} as const;

export type Mapped${sourceTypeName} = MappedType<${sourceTypeName}, typeof fieldMapping>;

export class ${mapperName} extends MappedServiceBase<${sourceTypeName}, typeof fieldMapping> {
  protected fieldMapping = fieldMapping;

  // Add your custom methods here
  // Example:
  // async fetch(id: string): Promise<Mapped${sourceTypeName}> {
  //   const response = await api.get(\`/endpoint/\${id}\`);
  //   return this.map(response);
  // }
}
`;

const filename = `${mapperName}.ts`;
const filepath = resolve(process.cwd(), filename);

try {
  writeFileSync(filepath, template, { flag: 'wx' });
  console.log(`✓ Generated ${filename}`);
  console.log(`\nNext steps:`);
  console.log(`1. Import your source type (${sourceTypeName})`);
  console.log(`2. Define field mapping with 'as const'`);
  console.log(`3. Implement custom methods as needed`);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
    console.error(`Error: ${filename} already exists`);
    process.exit(1);
  }
  throw error;
}
