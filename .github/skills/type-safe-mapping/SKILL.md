---
name: type-safe-mapping
description: Create zero-duplication TypeScript field mappings with automatic type inference. Use when transforming between different object schemas (API responses to domain models, database rows to DTOs, external data to internal structures). Eliminates manual type definitions and ensures bidirectional type safety.
license: MIT
metadata:
  version: "0.1.0"
  category: typescript-utilities
  keywords: typescript, mapping, type-safety, field-mapping, data-transformation
---

# Type-Safe Mapping Skill

This skill helps you create type-safe, bidirectional field mappings in TypeScript without code duplication.

## When to Use This Skill

Use this skill when you need to:
- Transform API responses to domain models (and vice versa)
- Map database rows to DTOs
- Convert external data formats to internal structures
- Create bidirectional data transformations with full type safety
- Avoid duplicating field mapping definitions and type definitions

## Core Concept

Instead of manually writing:
1. Field mapping logic
2. Type definitions for mapped objects
3. Reverse mapping logic

You define field mappings **once** with `as const`, and TypeScript automatically infers all types.

## Step-by-Step Usage

### Step 1: Define Your Source Type

```typescript
// Example: API response from external service
interface ApiRow {
  custom_a: boolean;
  custom_b: string;
  optional_c?: number;
}
```

### Step 2: Define Field Mapping with `as const`

**CRITICAL:** Always use `as const` to preserve literal types.

```typescript
const fieldMapping = {
  custom_a: 'isEnterprise',    // external → internal
  custom_b: 'commerceType',
} as const;  // ← REQUIRED for type inference
```

### Step 3: (Optional) Infer the Mapped Type

```typescript
import { MappedType } from '@workspace/type-safe-mapping';

type Domain = MappedType<ApiRow, typeof fieldMapping>;
// Result: { isEnterprise: boolean; commerceType: string; }
```

### Step 4: Create Mapper Service

```typescript
import { MappedServiceBase } from '@workspace/type-safe-mapping';

class UserMapper extends MappedServiceBase<ApiRow, typeof fieldMapping> {
  protected fieldMapping = fieldMapping;
}
```

### Step 5: Use the Mapper

```typescript
const mapper = new UserMapper();

// External → Internal
const domain = mapper.map({ 
  custom_a: true, 
  custom_b: 'B2B' 
});
// Result: { isEnterprise: true, commerceType: 'B2B' }

// Internal → External
const api = mapper.reverseMap({ 
  isEnterprise: false, 
  commerceType: 'B2C' 
});
// Result: { custom_a: false, custom_b: 'B2C' }
```

## Common Patterns

### Pattern 1: Service with Typed Methods

```typescript
class UserService extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;

  async fetchUser(id: string): Promise<MappedType<ApiUser, typeof userMapping>> {
    const apiResponse = await api.get(`/users/${id}`);
    return this.map(apiResponse);
  }

  async updateUser(user: MappedType<ApiUser, typeof userMapping>): Promise<void> {
    const apiPayload = this.reverseMap(user);
    await api.put('/users', apiPayload);
  }
}
```

### Pattern 2: Multiple Mappings per Service

```typescript
const listMapping = {
  user_id: 'id',
  user_name: 'name',
} as const;

const detailMapping = {
  user_id: 'id',
  user_name: 'name',
  user_email: 'email',
  created_at: 'createdAt',
} as const;

class UserMapper extends MappedServiceBase<ApiUserDetail, typeof detailMapping> {
  protected fieldMapping = detailMapping;
  
  // Use for list views with fewer fields
  private listMapper = new (class extends MappedServiceBase<ApiUserList, typeof listMapping> {
    protected fieldMapping = listMapping;
  })();
}
```

### Pattern 3: Handling Optional Fields

```typescript
// Optional fields are preserved correctly
interface ApiResponse {
  required_field: string;
  optional_field?: number;
}

const mapping = {
  required_field: 'required',
} as const;

// Result type: { required: string }
// Optional fields not in mapping are safely ignored
```

## Important Rules

1. **Always use `as const`** on field mapping definitions
   - Without it, TypeScript won't infer literal types
   - Type inference will fail silently

2. **Field mappings are directional**
   - Format: `{ externalField: 'internalField' }`
   - External field names are keys
   - Internal field names are values

3. **Only mapped fields are included**
   - Unmapped fields from source are ignored
   - This is by design for selective transformations

4. **Both methods return partial types**
   - `map()` returns `MappedType<TSource, TMapping>`
   - `reverseMap()` returns `Partial<TSource>`
   - Handle required fields in your service layer

## Type Safety Validation

Always validate type inference with tests:

```typescript
import { expectTypeOf } from 'vitest';
import { MappedType } from '@workspace/type-safe-mapping';

// Ensure mapped type is correct
type Result = MappedType<ApiRow, typeof fieldMapping>;
expectTypeOf<Result>().toEqualTypeOf<{
  isEnterprise: boolean;
  commerceType: string;
}>();
```

## Scripts

See the `scripts/` directory for helper utilities:
- `generate-mapper.ts` - Generate mapper boilerplate from a mapping definition
- `validate-mapping.ts` - Validate a field mapping at runtime

## Reference

See `references/` for detailed documentation:
- `API.md` - Complete API reference
- `PATTERNS.md` - Advanced usage patterns
- `MIGRATION.md` - Migration guide from manual mappings

## Troubleshooting

**Problem:** Type inference not working
- **Solution:** Ensure `as const` is on the field mapping definition

**Problem:** TypeScript error "Type instantiation is excessively deep"
- **Solution:** Break large mappings into smaller chunks

**Problem:** Mapped type includes unexpected fields
- **Solution:** Check that field mapping keys match source type exactly

**Problem:** Optional fields causing type errors
- **Solution:** Remember that unmapped optional fields are ignored; map them explicitly if needed
