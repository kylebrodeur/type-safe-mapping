# AI Skill: Type-Safe Mapping

This package provides a utility for mapping one TypeScript object to another with 100% type
safety — zero runtime overhead, zero manual type definitions, zero duplication.

## When to Use

- When converting an **API response (DTO)** to a **Domain Model** (e.g., `snake_case` → `camelCase`)
- When mapping **database rows** to application objects
- When normalising data from **third-party integrations**
- When you need TypeScript to **break the build** if a new field is added but the mapper is not
  updated

## Quick Start for Agents

### Step 1 — Scaffold the mapper with the CLI

```bash
npx @kylebrodeur/type-safe-mapping init ./src/types/ApiUser.ts ./src/models/User.ts
```

This scans both TypeScript files, auto-matches fields where possible, and writes a ready-to-edit
`ApiUserMapper.ts` next to the source file.

Use `--stdout` to preview the generated code in the terminal without writing a file:

```bash
npx @kylebrodeur/type-safe-mapping init ./src/types/ApiUser.ts ./src/models/User.ts --stdout
```

Use `--out <path>` to write to a specific location:

```bash
npx @kylebrodeur/type-safe-mapping init ./src/types/ApiUser.ts ./src/models/User.ts --out ./src/mappers/UserMapper.ts
```

### Step 2 — Review and complete the generated file

The scaffolded file looks like this:

```typescript
import { MappedServiceBase, MappedType } from '@kylebrodeur/type-safe-mapping';
import type { ApiUser } from './ApiUser.js';

const fieldMapping = {
  // TODO: user_id: 'targetFieldName',   // fill these in
  first_name: 'firstName',               // auto-matched by camelCase
  last_name: 'lastName',                 // auto-matched by camelCase
} as const;

export type User = MappedType<ApiUser, typeof fieldMapping>;

export class ApiUserMapper extends MappedServiceBase<ApiUser, typeof fieldMapping> {
  protected fieldMapping = fieldMapping;
}
```

Fill in any `TODO` entries with the correct target field names.

### Step 3 — Validate type safety

```bash
npx tsc --noEmit
```

TypeScript will report an error if any mapped fields are missing or mismatched.

## Usage Pattern (Library API)

```typescript
import { MappedServiceBase, MappedType } from '@kylebrodeur/type-safe-mapping';

// 1. Source type — must include an index signature
interface ApiUser {
  user_id: string;
  first_name: string;
  last_name: string;
  [key: string]: unknown; // ← required
}

// 2. Field mapping with `as const` — external → internal
const userMapping = {
  user_id: 'id',
  first_name: 'firstName',
  last_name: 'lastName',
} as const;

// 3. Infer the domain type automatically
type User = MappedType<ApiUser, typeof userMapping>;
// { id: string; firstName: string; lastName: string; }

// 4. Create the mapper class
class UserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
}

// 5. Transform data
const mapper = new UserMapper();
const user = mapper.map({ user_id: '1', first_name: 'Alice', last_name: 'Smith' });
// → { id: '1', firstName: 'Alice', lastName: 'Smith' }

const apiRow = mapper.reverseMap({ id: '1', firstName: 'Alice', lastName: 'Smith' });
// → { user_id: '1', first_name: 'Alice', last_name: 'Smith' }
```

## Common Pitfalls

| Problem | Fix |
|---|---|
| TypeScript errors about index signature | Add `[key: string]: unknown` to your source interface |
| Type inference fails | Make sure you used `as const` on the field mapping object |
| Unmapped fields appear in output | Only fields in `fieldMapping` are included — this is intentional |
| CLI says "no interfaces found" | Check that the file contains a `interface Foo { ... }` declaration |

## CLI Reference

```
npx @kylebrodeur/type-safe-mapping init <source-file> [target-file] [options]

Arguments:
  source-file   TypeScript file with the source interface (e.g. API response)
  target-file   TypeScript file with the target/domain interface (optional)

Options:
  --stdout      Print generated code to stdout (great for AI agent inspection)
  --out <file>  Write to a specific output file path
```

## Exports

```typescript
export { MappedServiceBase } from './MappedServiceBase';
export type { MappedType, MappingDefinition, ReverseMapping } from './types';
```

| Export | Kind | Purpose |
|---|---|---|
| `MappedServiceBase` | Class | Base class to extend for your mappers |
| `MappedType<TSource, M>` | Type | Infers the domain type from a mapping |
| `MappingDefinition<TSource>` | Type | Constraint for valid field mapping objects |
| `ReverseMapping<TSource, M, Key>` | Type | Internal utility for reverse lookup |
