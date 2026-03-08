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
- [Dynamic Mapping](#dynamic-mapping)
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
- **Dynamic Mapping**: Optionally pass through unmapped fields for partially-known schemas
- **Optional Fields**: Handles optional values correctly in both directions
- **Zero Dependencies**: No runtime dependencies

## Dynamic Mapping

When working with APIs or datasets where the schema is only partially known, you can use
`{ dynamicMapping: true }` to copy unmapped fields through as-is rather than dropping them.

```typescript
const fieldMapping = {
  custom_a: 'isEnterprise',
} as const;

class UserMapper extends MappedServiceBase<ApiRow, typeof fieldMapping> {
  protected fieldMapping = fieldMapping;
}

const mapper = new UserMapper();

const data = {
  custom_a: true,
  other_field: 'dynamic_value', // not in the mapping
};

// Without dynamicMapping (default) — unmapped fields are dropped
mapper.map(data);
// { isEnterprise: true }

// With dynamicMapping — unmapped fields are passed through
mapper.map(data, { dynamicMapping: true });
// { isEnterprise: true, other_field: 'dynamic_value' }
```

The same option is available on `reverseMap()`:

```typescript
mapper.reverseMap({ isEnterprise: true, extra_info: 42 }, { dynamicMapping: true });
// { custom_a: true, extra_info: 42 }
```

> **Note:** The `dynamicMapping` option is `false` by default. Enabling it is an explicit,
> opt-in behaviour and introduces no breaking changes to existing code.

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

| Property | Type | Default | Description |
|---|---|---|---|
| `dynamicMapping` | `boolean` | `false` | When `true`, fields not present in the mapping are copied through to the result unchanged. |

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
