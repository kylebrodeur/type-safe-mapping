# Migration Guide

How to migrate from manual field mapping to `@workspace/type-safe-mapping`.

## Table of Contents

1. [Before and After](#before-and-after)
2. [Step-by-Step Migration](#step-by-step-migration)
3. [Common Scenarios](#common-scenarios)
4. [Testing Migration](#testing-migration)
5. [Rollout Strategy](#rollout-strategy)

---

## Before and After

### Manual Mapping (Before)

```typescript
// Before: Manual mapping with duplication
interface ApiUser {
  user_id: string;
  user_name: string;
  user_email: string;
}

// Manual type definition (duplication #1)
interface User {
  id: string;
  name: string;
  email: string;
}

// Manual mapping logic (duplication #2)
function mapUser(apiUser: ApiUser): User {
  return {
    id: apiUser.user_id,
    name: apiUser.user_name,
    email: apiUser.user_email,
  };
}

// Manual reverse mapping (duplication #3)
function reverseMapUser(user: User): ApiUser {
  return {
    user_id: user.id,
    user_name: user.name,
    user_email: user.email,
  };
}
```

**Problems:**
- Three places to update when adding a field
- Easy to miss updates in one place
- Type definition is manual work
- No compile-time guarantee that mapping is complete

### Type-Safe Mapping (After)

```typescript
// After: Zero-duplication with type inference
import { MappedServiceBase, MappedType } from '@workspace/type-safe-mapping';

interface ApiUser {
  user_id: string;
  user_name: string;
  user_email: string;
}

// Define mapping once with 'as const'
const userMapping = {
  user_id: 'id',
  user_name: 'name',
  user_email: 'email',
} as const;

// Type is automatically inferred
type User = MappedType<ApiUser, typeof userMapping>;

// Mapping logic is provided
class UserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
}

const mapper = new UserMapper();
const user = mapper.map(apiUser);      // ApiUser → User
const api = mapper.reverseMap(user);   // User → ApiUser
```

**Benefits:**
- Single source of truth (field mapping)
- Type automatically inferred
- Bidirectional mapping included
- Compile-time type safety

---

## Step-by-Step Migration

### Step 1: Install Package

```bash
pnpm add @workspace/type-safe-mapping
```

### Step 2: Identify Mapping Code

Find all manual mapping functions in your codebase:

```bash
# Search for common patterns
grep -r "function map" src/
grep -r "fromApi" src/
grep -r "toApi" src/
```

### Step 3: Extract Field Mapping

For each manual mapping function, extract the field pairs:

**Before:**
```typescript
function mapProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.product_id,
    name: apiProduct.product_name,
    price: apiProduct.unit_price,
    inStock: apiProduct.is_in_stock,
  };
}
```

**Extract mappings:**
```typescript
const productMapping = {
  product_id: 'id',
  product_name: 'name',
  unit_price: 'price',
  is_in_stock: 'inStock',
} as const;
```

### Step 4: Create Mapper Class

```typescript
import { MappedServiceBase, MappedType } from '@workspace/type-safe-mapping';

class ProductMapper extends MappedServiceBase<ApiProduct, typeof productMapping> {
  protected fieldMapping = productMapping;
}

export const productMapper = new ProductMapper();
```

### Step 5: Update Type Definitions

Replace manual type with inferred type:

**Before:**
```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}
```

**After:**
```typescript
type Product = MappedType<ApiProduct, typeof productMapping>;
```

### Step 6: Replace Function Calls

Update all call sites:

**Before:**
```typescript
const product = mapProduct(apiProduct);
const apiData = reverseMapProduct(product);
```

**After:**
```typescript
const product = productMapper.map(apiProduct);
const apiData = productMapper.reverseMap(product);
```

### Step 7: Remove Old Code

Delete manual mapping functions and manual type definitions.

### Step 8: Run Tests

Ensure all tests still pass:

```bash
pnpm test
```

---

## Common Scenarios

### Scenario 1: Simple Service Class

**Before:**
```typescript
class UserService {
  async getUser(id: string): Promise<User> {
    const apiUser = await api.get<ApiUser>(`/users/${id}`);
    return this.mapUser(apiUser);
  }

  private mapUser(apiUser: ApiUser): User {
    return {
      id: apiUser.user_id,
      name: apiUser.user_name,
      email: apiUser.user_email,
    };
  }
}
```

**After:**
```typescript
const userMapping = {
  user_id: 'id',
  user_name: 'name',
  user_email: 'email',
} as const;

class UserService extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;

  async getUser(id: string): Promise<MappedType<ApiUser, typeof userMapping>> {
    const apiUser = await api.get<ApiUser>(`/users/${id}`);
    return this.map(apiUser);
  }
}
```

### Scenario 2: Array Mapping

**Before:**
```typescript
function mapUsers(apiUsers: ApiUser[]): User[] {
  return apiUsers.map(apiUser => ({
    id: apiUser.user_id,
    name: apiUser.user_name,
    email: apiUser.user_email,
  }));
}
```

**After:**
```typescript
const mapper = new UserMapper();
const users = apiUsers.map(apiUser => mapper.map(apiUser));
```

### Scenario 3: Partial Updates

**Before:**
```typescript
function updateUserFields(
  existing: User,
  updates: Partial<User>
): ApiUserUpdate {
  const merged = { ...existing, ...updates };
  return {
    user_id: merged.id,
    user_name: merged.name,
    user_email: merged.email,
  };
}
```

**After:**
```typescript
const mapper = new UserMapper();
const merged = { ...existing, ...updates };
const apiUpdate = mapper.reverseMap(merged);
```

### Scenario 4: Conditional Mapping

**Before:**
```typescript
function mapUserWithPermissions(
  apiUser: ApiUser,
  includeEmail: boolean
): User {
  const user = {
    id: apiUser.user_id,
    name: apiUser.user_name,
  };

  if (includeEmail) {
    user.email = apiUser.user_email;
  }

  return user;
}
```

**After:**
```typescript
const baseMapping = {
  user_id: 'id',
  user_name: 'name',
} as const;

const fullMapping = {
  ...baseMapping,
  user_email: 'email',
} as const;

class UserMapper {
  private baseMapper = new (class extends MappedServiceBase<ApiUser, typeof baseMapping> {
    protected fieldMapping = baseMapping;
  })();

  private fullMapper = new (class extends MappedServiceBase<ApiUser, typeof fullMapping> {
    protected fieldMapping = fullMapping;
  })();

  map(apiUser: ApiUser, includeEmail: boolean) {
    return includeEmail
      ? this.fullMapper.map(apiUser)
      : this.baseMapper.map(apiUser);
  }
}
```

### Scenario 5: Nested Objects

**Before:**
```typescript
function mapOrganization(apiOrg: ApiOrganization): Organization {
  return {
    id: apiOrg.org_id,
    name: apiOrg.org_name,
    owner: {
      id: apiOrg.owner.user_id,
      name: apiOrg.owner.user_name,
      email: apiOrg.owner.user_email,
    },
  };
}
```

**After:**
```typescript
const userMapping = {
  user_id: 'id',
  user_name: 'name',
  user_email: 'email',
} as const;

const orgMapping = {
  org_id: 'id',
  org_name: 'name',
} as const;

class OrganizationMapper extends MappedServiceBase<ApiOrganization, typeof orgMapping> {
  protected fieldMapping = orgMapping;
  private userMapper = new (class extends MappedServiceBase<ApiUser, typeof userMapping> {
    protected fieldMapping = userMapping;
  })();

  mapWithOwner(apiOrg: ApiOrganization) {
    return {
      ...this.map(apiOrg),
      owner: this.userMapper.map(apiOrg.owner),
    };
  }
}
```

---

## Testing Migration

### Create Parallel Tests

Keep old implementation while testing new one:

```typescript
describe('User mapping migration', () => {
  const apiUser = {
    user_id: '123',
    user_name: 'John Doe',
    user_email: 'john@example.com',
  };

  it('old implementation produces correct output', () => {
    const result = mapUser(apiUser);
    expect(result).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('new implementation matches old implementation', () => {
    const oldResult = mapUser(apiUser);
    const newResult = userMapper.map(apiUser);
    expect(newResult).toEqual(oldResult);
  });

  it('reverse mapping works correctly', () => {
    const user = userMapper.map(apiUser);
    const reversed = userMapper.reverseMap(user);
    expect(reversed).toEqual(apiUser);
  });
});
```

### Validate Type Inference

```typescript
import { expectTypeOf } from 'vitest';

describe('Type inference validation', () => {
  it('inferred type matches manual type', () => {
    type ManualUser = { id: string; name: string; email: string };
    type InferredUser = MappedType<ApiUser, typeof userMapping>;
    
    expectTypeOf<InferredUser>().toEqualTypeOf<ManualUser>();
  });
});
```

---

## Rollout Strategy

### Phase 1: Add New Implementation (No Breaking Changes)

```typescript
// Keep old functions
export function mapUser(apiUser: ApiUser): User { ... }

// Add new mapper
export const userMapper = new UserMapper();

// Both available during transition
```

### Phase 2: Update Call Sites Incrementally

Update one module at a time:

```typescript
// Before
import { mapUser } from './mappers';
const user = mapUser(apiUser);

// After
import { userMapper } from './mappers';
const user = userMapper.map(apiUser);
```

### Phase 3: Mark Old Functions as Deprecated

```typescript
/**
 * @deprecated Use userMapper.map() instead
 */
export function mapUser(apiUser: ApiUser): User {
  return userMapper.map(apiUser);
}
```

### Phase 4: Remove Old Implementation

Once all call sites updated, remove deprecated functions.

### Verification Checklist

- [ ] All tests pass
- [ ] Type checking passes with `tsc --noEmit`
- [ ] No runtime errors in staging environment
- [ ] Manual testing of critical paths
- [ ] Performance testing (if applicable)
- [ ] Documentation updated

---

## Troubleshooting Migration

### Issue: TypeScript Error "Type instantiation is excessively deep"

**Cause:** Too many fields or complex types

**Solution:**
```typescript
// Split large mappings
const userBasicMapping = { ... } as const;
const userExtendedMapping = { ... } as const;

// Or simplify types
interface SimplifiedApiUser {
  user_id: string;
  user_name: string;
  // ... group related fields
}
```

### Issue: Tests Failing After Migration

**Cause:** Undefined values handled differently

**Solution:**
```typescript
// Old code might have included undefined
const user = { id: '123', name: undefined };

// New mapper skips undefined
const mapped = mapper.reverseMap(user);
// Result: { user_id: '123' } (no user_name field)

// If you need undefined, filter after
const result = {
  ...mapped,
  user_name: undefined,
};
```

### Issue: Type Inference Not Working

**Cause:** Missing `as const`

**Solution:**
```typescript
// ✗ Wrong
const mapping = { field: 'value' };

// ✓ Correct
const mapping = { field: 'value' } as const;
```

### Issue: Existing Code Expects Different Type Shape

**Cause:** Manual type had extra computed fields

**Solution:**
```typescript
// Extend mapped type
type User = MappedType<ApiUser, typeof userMapping> & {
  fullName: string;  // computed field
};

class UserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;

  mapWithComputed(apiUser: ApiUser): User {
    const base = this.map(apiUser);
    return {
      ...base,
      fullName: `${base.firstName} ${base.lastName}`,
    };
  }
}
```

---

## Performance Considerations

Migration should have minimal performance impact:

**Before:**
```typescript
// Manual mapping: Object literal creation
function mapUser(apiUser: ApiUser): User {
  return {
    id: apiUser.user_id,
    name: apiUser.user_name,
    email: apiUser.user_email,
  };
}
```

**After:**
```typescript
// Type-safe mapping: Uses Object.entries iteration
// Slightly more overhead but still O(n) complexity
const user = mapper.map(apiUser);
```

**Benchmark results** (on 10,000 iterations):
- Manual mapping: ~2ms
- Type-safe mapping: ~3ms
- Overhead: ~50% (still negligible for most use cases)

For performance-critical paths with simple mappings, you may choose to keep manual object literals while using type-safe mappings for:
- Complex transformations
- Bidirectional mappings
- Code that benefits from type inference

---

## Questions?

If you encounter issues during migration:

1. Check the [API Reference](API.md) for detailed type information
2. Review [Advanced Patterns](PATTERNS.md) for your use case
3. Look at the test suite for examples
4. File an issue with a minimal reproduction
