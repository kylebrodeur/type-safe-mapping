# Type Safe Mapping

[![npm version](https://img.shields.io/npm/v/@kylebrodeur/type-safe-mapping.svg)](https://www.npmjs.com/package/@kylebrodeur/type-safe-mapping)
[![npm downloads](https://img.shields.io/npm/dm/@kylebrodeur/type-safe-mapping.svg)](https://www.npmjs.com/package/@kylebrodeur/type-safe-mapping)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/kylebrodeur/type-safe-mapping/pulls)

> Zero-duplication field mapping for TypeScript with full type safety and inference.

Transform data between different shapes (API ↔ Domain) without writing repetitive boilerplate. Define your field mappings once, and let TypeScript infer the types automatically.

## Table of Contents

- [Why?](#why)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [Validation](#validation)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)
- [Important Notes](#important-notes)
- [Contributing](#contributing)
- [License](#license)

## Why?

When mapping between API responses and domain models, you typically need to:

1. Define field mappings
2. Manually write the transformation logic
3. Manually define the resulting type

This leads to duplication and maintenance burden. This package eliminates that by using TypeScript's type system to infer the mapped type from your field mapping definition.

## Quick Start

### Installation

```bash
npm install @kylebrodeur/type-safe-mapping
# or
yarn add @kylebrodeur/type-safe-mapping
# or
pnpm add @kylebrodeur/type-safe-mapping
```
kylebrodeur
### Basic Usage

```typescript
import { MappedServiceBase, MappedType } from '@kylebrodeur/type-safe-mapping';

// 1. Define your source type (e.g., API response)
interface ApiRow {
  custom_a: boolean;
  custom_b: string;
  optional_c?: number;
  [key: string]: unknown;
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
- **Deep Path Support**: Use dot notation for nested field mappings (e.g., `'user.profile.name'`)
- **Optional Fields**: Handles optional values correctly in both directions
- **Pass-Through Mode**: Preserve unmapped fields with `allowPassThrough` option
- **Zero Dependencies**: No runtime dependencies
- **Built-in Validation**: Lightweight runtime validation with no extra dependencies

## Validation

Pass `{ validate: true }` as a second argument to `map()` or `reverseMap()` to enable runtime
validation. Validation is **disabled by default** to maintain full backward compatibility.

### Field Presence

When `validate: true`, all fields defined in your mapping must be present in the source object.

```typescript
const mapper = new UserMapper();

// ✅ Passes — all mapped fields are present
mapper.map({ custom_a: true, custom_b: 'B2B' }, { validate: true });

// ❌ Throws: "Validation failed:\nMissing required field `custom_b` in source."
mapper.map({ custom_a: true }, { validate: true });
```

### Unknown Fields

By default, extra (unmapped) fields in the source are silently ignored. Set
`allowUnknownFields: false` to throw instead.

```typescript
// ✅ Extra fields allowed by default
mapper.map({ custom_a: true, custom_b: 'B2B', extra: 'ignored' }, { validate: true });

// ❌ Throws: "Validation failed:\nUnmapped field `extra` is not allowed."
mapper.map(
  { custom_a: true, custom_b: 'B2B', extra: 'unexpected' },
  { validate: true, allowUnknownFields: false },
);
```

### Custom Validators

Use `validateWith` to integrate any validation library (e.g. Zod, Yup) or your own logic.
`validateWith` runs whenever it is provided, regardless of the `validate` flag.

```typescript
import { z } from 'zod';

const schema = z.object({ custom_a: z.boolean(), custom_b: z.string() });

// Runs the Zod schema parse as part of the mapping call
mapper.map(data, {
  validateWith: (source) => schema.parse(source),
});
```

Throw an error inside `validateWith` to signal a validation failure:

```typescript
mapper.map(data, {
  validateWith: (source) => {
    if (typeof (source as ApiRow).custom_a !== 'boolean') {
      throw new Error('custom_a must be a boolean');
    }
  },
});
```

### Validation Options Summary

| Option | Type | Default | Description |
|---|---|---|---|
| `validate` | `boolean` | `false` | Enable built-in field-presence and unknown-field checks |
| `allowUnknownFields` | `boolean` | `true` | Allow unmapped source fields when `validate: true` |
| `validateWith` | `(data: unknown) => void` | — | Custom validator; runs whenever provided |
| `allowPassThrough` | `boolean` | `false` | Preserve unmapped fields in output (see [Advanced Features](#advanced-features)) |
| `stripUndefined` | `boolean` | `true` | Exclude `undefined` values from mapping (see [Advanced Features](#advanced-features)) |

## Advanced Features

### Deep Path (Nested Field) Support

Use dot notation in your field mappings to access nested properties:

```typescript
interface ApiResponse {
  user: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  metadata: {
    created: number;
  };
  [key: string]: unknown;
}

const mapping = {
  'user.profile.firstName': 'firstName',
  'user.profile.lastName': 'lastName',
  'metadata.created': 'createdAt',
} as const;

class NestedMapper extends MappedServiceBase<ApiResponse, typeof mapping> {
  protected fieldMapping = mapping;
}

const mapper = new NestedMapper();
const result = mapper.map({
  user: { profile: { firstName: 'Jane', lastName: 'Smith' } },
  metadata: { created: 1714435200 },
});
// { firstName: 'Jane', lastName: 'Smith', createdAt: 1714435200 }
```

### Pass-Through Fields

By default, only mapped fields are included in the output. Set `allowPassThrough: true` to preserve all unmapped fields:

```typescript
const result = mapper.map(
  { custom_a: true, custom_b: 'B2B', extraField: 'preserved' },
  { allowPassThrough: true },
);
// { isEnterprise: true, commerceType: 'B2B', extraField: 'preserved' }
```

This is useful when:
- You want to preserve metadata or timestamps from API responses
- You need to pass through fields that don't require transformation
- You're working with dynamic data structures

### Undefined Handling

By default, `undefined` values are excluded from the output (`stripUndefined: true`). To explicitly map `undefined` values:

```typescript
const result = mapper.map(
  { custom_a: undefined, custom_b: 'B2B' },
  { stripUndefined: false },
);
// { isEnterprise: undefined, commerceType: 'B2B' }
```

This allows you to intentionally clear fields or work with APIs that distinguish between absent and `undefined` values.

## API Reference

### `MappedServiceBase<TSource, TMapping>`

Abstract base class for creating type-safe field mappers.

**Type Parameters:**

- `TSource`: The source object type (e.g., API response)
- `TMapping`: The field mapping definition (use `typeof yourMapping`)

**Methods:**

- `map(source: Partial<TSource>, options?: MapOptions): MappedType<TSource, TMapping>` - Transform external to internal
- `reverseMap(target: Partial<MappedType<TSource, TMapping>>, options?: MapOptions): Partial<TSource>` - Transform internal to external

### `MapOptions`

Options object accepted by `map()` and `reverseMap()`.

```typescript
interface MapOptions {
  validate?: boolean;                      // Enable built-in validation (default: false)
  allowUnknownFields?: boolean;            // Allow unmapped fields when validate: true (default: true)
  validateWith?: (data: unknown) => void;  // Custom validator hook
  allowPassThrough?: boolean;              // Preserve unmapped fields in output (default: false)
  stripUndefined?: boolean;                // Exclude undefined values from mapping (default: true)
}
```

### `validateMapping(source, expectedKeys, options)`

Standalone validation utility used internally by `MappedServiceBase`. Can also be called
directly when you need finer control.

```typescript
import { validateMapping } from '@kylebrodeur/type-safe-mapping';

validateMapping(
  { custom_a: true, custom_b: 'B2B' }, // source object
  ['custom_a', 'custom_b'],             // expected keys
  { allowUnknownFields: false },        // options
);
```

### `MappedType<TSource, M>`

Type utility that infers the resulting domain type from a source type and field mapping.

### `MappingDefinition<TSource, TExternal>`

Type constraint for valid field mappings: `Record<TExternal, keyof TSource>`

### `ReverseMapping<TSource, M, Key>`

Internal type utility for reverse lookup in field mappings.

## Use Cases

### API Response Transformation

```typescript
// Transform snake_case API responses to camelCase domain models
interface ApiUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  [key: string]: unknown;
}

const userMapping = {
  user_id: 'id',
  first_name: 'firstName',
  last_name: 'lastName',
  email_address: 'email',
} as const;

class UserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
}

const mapper = new UserMapper();
const user = mapper.map({
  user_id: '123',
  first_name: 'John',
  last_name: 'Doe',
  email_address: 'john@example.com',
});
// Result: { id: '123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
```

### Database to Domain Model

```typescript
// Map database columns to domain models
interface DbProduct {
  product_sku: string;
  product_name: string;
  unit_price: number;
  is_active: boolean;
  [key: string]: unknown;
}

const productMapping = {
  product_sku: 'sku',
  product_name: 'name',
  unit_price: 'price',
  is_active: 'active',
} as const;

type Product = MappedType<DbProduct, typeof productMapping>;
// Result: { sku: string; name: string; price: number; active: boolean; }
```

### Third-Party Integration

```typescript
// Normalize data from external services
interface StripeCustomer {
  id: string;
  email: string;
  created: number;
  default_source: string;
  [key: string]: unknown;
}

const stripeMapping = {
  id: 'customerId',
  email: 'customerEmail',
  created: 'createdAt',
  default_source: 'paymentMethodId',
} as const;
```

## Important Notes

- **Always use `as const`** on your field mapping definitions to preserve literal types
- **Source types must include an index signature** `[key: string]: unknown` to satisfy TypeScript's constraints
  ```typescript
  interface ApiResponse {
    field_one: string;
    field_two: number;
    [key: string]: unknown;  // ← Required
  }
  ```
- Only mapped fields are included in the result (unmapped fields are ignored)
- Optional fields in the source type are handled correctly
- The mapper extends `MappedServiceBase` and must define `protected fieldMapping`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Kyle Brodeur](https://github.com/kylebrodeur)

---

**[⬆ back to top](#type-safe-mapping)**
