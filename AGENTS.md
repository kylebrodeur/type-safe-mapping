# AGENTS.md

## Project Overview

`@kylebrodeur/type-safe-mapping` is a zero-duplication TypeScript library for type-safe field mapping between different object schemas (e.g., API responses ↔ domain models). It uses TypeScript's type system to automatically infer mapped types from field mapping definitions, eliminating manual type definitions and ensuring type safety.

**Key Concept:** Define field mappings once with `as const`, extend `MappedServiceBase`, and get fully type-safe bidirectional transformations automatically.

## Setup Commands

```bash
# Install dependencies (from package root)
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint
```

## Dev Environment Tips

- This is a zero-dependency package - keep it that way
- TypeScript strict mode is enabled - all changes must type-check
- Use `as const` on field mappings to preserve literal types
- The `dist/` directory is git-ignored and generated on build
- Test files live in `tests/` directory

## Code Style

- TypeScript 5.9+ with strict mode enabled
- Single quotes for strings
- Semicolons required (enforced by Prettier)
- 2-space indentation
- Trailing commas in multiline structures
- 100-character line width
- Prefer type inference over explicit types where possible

## Build Commands

```bash
# Build TypeScript to dist/
pnpm build

# Run all tests
pnpm test

# Lint with ESLint
pnpm lint

# Run all checks (in workspace root)
pnpm -r build && pnpm -r lint && pnpm -r test
```

## Testing Instructions

- All tests use Vitest
- Tests include both runtime behavior and type-level assertions (using `expectTypeOf`)
- Test coverage should remain at 100% for core mapping logic
- Add new test cases for any edge cases discovered
- Run `pnpm test` before committing

## Usage Pattern

**Core pattern that AI agents should follow:**

1. Define source type (e.g., API response interface)
2. Define field mapping with `as const` assertion
3. Optionally infer domain type with `MappedType<TSource, typeof mapping>`
4. Create mapper class extending `MappedServiceBase`
5. Use `map()` for external→internal and `reverseMap()` for internal→external

## Common Pitfalls

⚠️ **Always use `as const`** on field mapping definitions - without it, TypeScript won't preserve literal types and type inference will fail

⚠️ **Source types must include an index signature** - add `[key: string]: unknown` to your interface definitions:
```typescript
interface ApiRow {
  custom_a: boolean;
  custom_b: string;
  [key: string]: unknown;  // ← Required for MappedServiceBase
}
```

⚠️ **Field mappings are one-way definitions** - map external field names to internal field names: `{ external_field: 'internalField' }`

⚠️ **Only mapped fields are transformed** - unmapped fields from the source are ignored in the output

## PR Instructions

- Run `pnpm lint && pnpm build && pnpm test` before committing
- Update tests for any new features or bug fixes
- Keep README.md in sync with API changes
- Use conventional commit format: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- All type inference should be validated with `expectTypeOf` tests
