# @workspace/type-safe-mapping

Zero-duplication field mapping for TypeScript with full type safety and inference.

## Why?

When mapping between API responses and domain models, you typically need to:

1. Define field mappings
2. Manually write the transformation logic
3. Manually define the resulting type

This leads to duplication and maintenance burden. This package eliminates that by using TypeScript's type system to infer the mapped type from your field mapping definition.

## Quick Start

### Installation

```bash
pnpm add @workspace/type-safe-mapping
```

### Basic Usage

```typescript
import { MappedServiceBase, MappedType } from '@workspace/type-safe-mapping';

// 1. Define your source type (e.g., API response)
interface ApiRow {
  custom_a: boolean;
  custom_b: string;
  optional_c?: number;
}

// 2. Define your field mapping with 'as const'
const fieldMapping = {
  custom_a: 'isEnterprise',
  custom_b: 'commerceType',
} as const;

// 3. (Optional) Infer the domain type
type Domain = MappedType<ApiRow, typeof fieldMapping>;
// Result: { isEnterprise: boolean; commerceType: string; }

// 4. Create your mapper service
class UserMapper extends MappedServiceBase<ApiRow, typeof fieldMapping> {
  protected fieldMapping = fieldMapping;
}

// 5. Use it!
const mapper = new UserMapper();

// Map external → internal
const domain = mapper.map({ custom_a: true, custom_b: 'B2B' });
// { isEnterprise: true, commerceType: 'B2B' }

// Map internal → external
const api = mapper.reverseMap({ isEnterprise: false, commerceType: 'B2C' });
// { custom_a: false, custom_b: 'B2C' }
```

## Key Features

- **Zero Duplication**: Define field mappings once, get TypeScript types automatically
- **Full Type Safety**: TypeScript infers mapped types from your field mappings
- **Bidirectional**: Map from external → internal and internal → external
- **Optional Fields**: Handles optional values correctly in both directions
- **Zero Dependencies**: No runtime dependencies

## API Reference

### `MappedServiceBase<TSource, TMapping>`

Abstract base class for creating type-safe field mappers.

**Type Parameters:**

- `TSource`: The source object type (e.g., API response)
- `TMapping`: The field mapping definition (use `typeof yourMapping`)

**Methods:**

- `map(source: Partial<TSource>): MappedType<TSource, TMapping>` - Transform external to internal
- `reverseMap(target: Partial<MappedType<TSource, TMapping>>): Partial<TSource>` - Transform internal to external

### `MappedType<TSource, M>`

Type utility that infers the resulting domain type from a source type and field mapping.

### `MappingDefinition<TSource, TExternal>`

Type constraint for valid field mappings: `Record<TExternal, keyof TSource>`

### `ReverseMapping<TSource, M, Key>`

Internal type utility for reverse lookup in field mappings.

## Important Notes

- **Always use `as const`** on your field mapping definitions to preserve literal types
- Only mapped fields are included in the result (unmapped fields are ignored)
- Optional fields in the source type are handled correctly
- The mapper extends `MappedServiceBase` and must define `protected fieldMapping`

## License

MIT
