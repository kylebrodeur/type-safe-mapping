# API Reference

Complete type-level and runtime API documentation for `@kylebrodeur/type-safe-mapping`.

## Exports

```typescript
export { MappedServiceBase } from './MappedServiceBase';
export { MappedType, MappingDefinition, ReverseMapping } from './types';
```

## Type Utilities

### `MappingDefinition<TSource, TExternal>`

Type constraint for valid field mappings.

```typescript
type MappingDefinition<
  TSource extends Record<string, unknown>,
  TExternal extends keyof TSource = keyof TSource,
> = Record<TExternal, keyof TSource>;
```

**Parameters:**
- `TSource`: The source object type (must be a record)
- `TExternal`: Keys from TSource that should be mapped (defaults to all keys)

**Returns:** A record type mapping external field names to internal field names

**Example:**
```typescript
interface ApiUser {
  user_id: string;
  user_name: string;
}

// Valid mapping
const mapping: MappingDefinition<ApiUser> = {
  user_id: 'id',
  user_name: 'name',
};

// Invalid: 'email' not in ApiUser
const invalid: MappingDefinition<ApiUser> = {
  user_id: 'id',
  email: 'email', // TypeScript error
};
```

---

### `ReverseMapping<TSource, M, Key>`

Internal utility type for reverse lookup in field mappings. Used by `MappedType`.

```typescript
type ReverseMapping<
  TSource extends Record<string, unknown>,
  M extends MappingDefinition<TSource>,
  Key extends M[keyof M],
> = {
  [External in keyof M]: M[External] extends Key ? External : never;
}[keyof M];
```

**Parameters:**
- `TSource`: The source object type
- `M`: The mapping definition
- `Key`: The internal field name to find external field for

**Returns:** The external field name that maps to the given internal key

**Example:**
```typescript
type External = ReverseMapping<
  ApiUser, 
  typeof mapping, 
  'id'  // internal field
>;
// Result: 'user_id' (external field)
```

---

### `MappedType<TSource, M>`

Transforms a source type according to a field mapping definition. This is the primary type utility users interact with.

```typescript
type MappedType<
  TSource extends Record<string, unknown>,
  M extends MappingDefinition<TSource>,
> = {
  [MappedKey in M[keyof M]]: TSource[ReverseMapping<TSource, M, MappedKey> & keyof TSource];
};
```

**Parameters:**
- `TSource`: The source object type to transform
- `M`: The field mapping definition (must be created with `as const`)

**Returns:** A new object type with:
- Keys from the mapping definition's values (internal field names)
- Value types from the source type's corresponding fields

**Example:**
```typescript
interface ApiUser {
  user_id: string;
  user_name: string;
  created_at: Date;
}

const mapping = {
  user_id: 'id',
  user_name: 'name',
} as const;

type User = MappedType<ApiUser, typeof mapping>;
// Result: { id: string; name: string; }
// Note: created_at is excluded (not in mapping)
```

**Type Preservation:**
```typescript
interface ApiData {
  str_field: string;
  num_field: number;
  bool_field: boolean;
  optional_field?: string;
  union_field: 'A' | 'B';
  array_field: string[];
}

const mapping = {
  str_field: 'str',
  num_field: 'num',
  bool_field: 'bool',
  optional_field: 'opt',
  union_field: 'union',
  array_field: 'arr',
} as const;

type Mapped = MappedType<ApiData, typeof mapping>;
// Result:
// {
//   str: string;
//   num: number;
//   bool: boolean;
//   opt: string | undefined;
//   union: 'A' | 'B';
//   arr: string[];
// }
```

---

## Classes

### `MappedServiceBase<TSource, TMapping>`

Abstract base class for creating type-safe field mappers.

```typescript
export abstract class MappedServiceBase<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
>
```

**Type Parameters:**
- `TSource`: The source object type (e.g., API response interface)
- `TMapping`: The field mapping definition type (use `typeof yourMapping`)

**Abstract Properties:**

#### `fieldMapping`

```typescript
protected abstract fieldMapping: TMapping;
```

Must be implemented by subclasses. Contains the actual field mapping definition.

**Methods:**

#### `map(source: Partial<TSource>): MappedType<TSource, TMapping>`

Transform an external object to internal format.

**Parameters:**
- `source`: Partial source object (external format)

**Returns:** Mapped object (internal format)

**Behavior:**
- Iterates over field mapping entries
- For each external field, reads value from source
- Writes value to internal field in result
- Skips `undefined` values
- Only includes fields defined in mapping

**Example:**
```typescript
const apiUser = {
  user_id: '123',
  user_name: 'John',
  extra_field: 'ignored',
};

const user = mapper.map(apiUser);
// Result: { id: '123', name: 'John' }
```

#### `reverseMap(target: Partial<MappedType<TSource, TMapping>>): Partial<TSource>`

Transform an internal object to external format.

**Parameters:**
- `target`: Partial mapped object (internal format)

**Returns:** Source object (external format), wrapped in `Partial<>`

**Behavior:**
- Iterates over field mapping entries
- For each internal field, reads value from target
- Writes value to external field in result
- Skips `undefined` values
- Only includes fields defined in mapping

**Example:**
```typescript
const user = {
  id: '123',
  name: 'John',
};

const apiUser = mapper.reverseMap(user);
// Result: { user_id: '123', user_name: 'John' }
```

---

## Type Inference Requirements

### Critical: Use `as const`

Field mappings **must** use `as const` assertion for type inference to work:

```typescript
// ✓ Correct: preserves literal types
const mapping = {
  external: 'internal',
} as const;

// ✗ Wrong: types widened to string
const mapping = {
  external: 'internal',
};
```

Without `as const`:
- Field names become `string` type
- Type inference fails
- `MappedType` cannot determine exact keys

### Why it matters

TypeScript needs literal types to perform mapped type transformations:

```typescript
// With 'as const'
type M = typeof mapping;
// { readonly external: "internal" }
//                       ^^^^^^^^^^^ literal type

// Without 'as const'
type M = typeof mapping;
// { external: string }
//             ^^^^^^ widened type
```

The literal type `"internal"` is required for `MappedType` to create the correct key.

---

## Runtime Behavior

### Value Handling

**Defined values:**
```typescript
mapper.map({ field: 'value' })
// Includes in result
```

**Undefined values:**
```typescript
mapper.map({ field: undefined })
// Excluded from result
```

**Null values:**
```typescript
mapper.map({ field: null })
// Included in result (null !== undefined)
```

**Missing fields:**
```typescript
mapper.map({}) // field not present
// Excluded from result
```

### Unmapped Fields

Fields not in the mapping definition are **completely ignored**:

```typescript
const mapping = { field_a: 'a' } as const;

mapper.map({ 
  field_a: 'value',
  field_b: 'ignored',  // not in mapping
  field_c: 'ignored',  // not in mapping
});
// Result: { a: 'value' }
```

This is intentional - it allows selective field transformation.

---

## Performance Characteristics

**Time Complexity:** O(n) where n = number of fields in mapping
- Single iteration over mapping entries
- No nested loops

**Space Complexity:** O(n) where n = number of fields in mapping
- Creates new result object
- No intermediate data structures

**Optimizations:**
- Uses `Object.entries()` with type assertion (avoids reflection)
- Early `undefined` check prevents unnecessary assignments
- No prototype chain walking

---

## TypeScript Configuration Requirements

Minimum TypeScript version: **5.0+**

Required compiler options:
```json
{
  "compilerOptions": {
    "strict": true,           // Required for type safety
    "target": "ES2022",       // Or higher
    "moduleResolution": "bundler" // Or "node16"/"nodenext"
  }
}
```

The package uses:
- Conditional types (`ReverseMapping`)
- Mapped types (`MappedType`)
- Generic constraints
- `const` assertions

---

## Error Messages

Common TypeScript errors and their meanings:

### "Type instantiation is excessively deep"

**Cause:** Mapping has too many fields or overly complex types

**Solution:** Break into smaller mappings or simplify types

### "Type 'X' does not satisfy constraint"

**Cause:** Source type is not a `Record<string, unknown>`

**Solution:** Ensure source type is an object type

### "Property 'X' does not exist"

**Cause:** Forgot `as const` on field mapping

**Solution:** Add `as const` assertion

### "Cannot find name"

**Cause:** Import missing or incorrect

**Solution:** Import from `@kylebrodeur/type-safe-mapping`

---

## Usage with Type Guards

Combine with runtime type guards for full type safety:

```typescript
function isValidUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}

class UserService extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;

  parse(data: unknown): User | null {
    if (!isValidUser(data)) return null;
    return this.map(data);
  }
}
```

---

## Integration with Validation Libraries

Works seamlessly with Zod, Yup, etc:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

class UserMapper extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;

  parseAndMap(apiUser: unknown) {
    const validated = UserSchema.parse(apiUser);
    return this.map(validated);
  }
}
```
