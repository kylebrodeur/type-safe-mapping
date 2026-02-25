#!/usr/bin/env node

/**
 * Validate a field mapping at runtime
 * Usage: node validate-mapping.ts <path-to-file>
 *
 * Checks:
 * - Field mapping has 'as const' assertion
 * - All mapped values are valid identifiers
 * - No duplicate internal field names
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const [filepath] = process.argv.slice(2);

if (!filepath) {
  console.error('Usage: node validate-mapping.ts <path-to-file>');
  console.error('Example: node validate-mapping.ts src/UserMapper.ts');
  process.exit(1);
}

const fullpath = resolve(process.cwd(), filepath);
const content = readFileSync(fullpath, 'utf-8');

// Check for 'as const' assertion
const hasAsConst = /as\s+const/.test(content);
if (!hasAsConst) {
  console.error('⚠️  Warning: No "as const" assertion found');
  console.error('   TypeScript type inference requires "as const" on field mappings');
}

// Extract field mappings (simple pattern matching)
const mappingPattern = /{\s*([^}]+)\s*}\s*as\s+const/g;
const mappings = [...content.matchAll(mappingPattern)];

if (mappings.length === 0) {
  console.error('✗ No field mappings found with "as const"');
  process.exit(1);
}

let hasErrors = false;

mappings.forEach((match, index) => {
  const mappingContent = match[1];
  const lines = mappingContent
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('//'));

  const internalFields = new Set();
  const fieldPairs: Array<{ external: string; internal: string }> = [];

  lines.forEach((line) => {
    const fieldMatch = line.match(/['"]?(\w+)['"]?\s*:\s*['"](\w+)['"]/);
    if (fieldMatch) {
      const [, external, internal] = fieldMatch;
      fieldPairs.push({ external, internal });
      
      // Check for duplicate internal fields
      if (internalFields.has(internal)) {
        console.error(`✗ Duplicate internal field: "${internal}"`);
        hasErrors = true;
      }
      internalFields.add(internal);
      
      // Check for valid identifiers
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(internal)) {
        console.error(`✗ Invalid internal field name: "${internal}"`);
        hasErrors = true;
      }
    }
  });

  if (fieldPairs.length > 0) {
    console.log(`\n✓ Found mapping ${index + 1} with ${fieldPairs.length} fields:`);
    fieldPairs.forEach(({ external, internal }) => {
      console.log(`  ${external} → ${internal}`);
    });
  }
});

if (!hasErrors && hasAsConst) {
  console.log('\n✓ All validations passed');
} else {
  console.log('\n✗ Validation failed');
  process.exit(1);
}
