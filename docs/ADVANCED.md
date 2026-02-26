# Advanced Usage Patterns

This guide covers advanced patterns and use cases for `@kylebrodeur/type-safe-mapping`.

## Pattern 1: Extending with Custom Methods

Add custom transformation logic by extending the base mapper:

```typescript
class EnhancedUserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  
  // Add custom method for batch mapping
  mapMany(sources: ApiUser[]): User[] {
    return sources.map(source => this.map(source));
  }
  
  // Add validation after mapping
  mapWithValidation(source: Partial<ApiUser>): User {
    const mapped = this.map(source);
    
    if (!mapped.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    return mapped;
  }
}
```

## Pattern 2: Partial Updates

Handle partial object updates efficiently:

```typescript
class UserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  
  // Merge with existing data
  updateExisting(existing: User, updates: Partial<ApiUser>): User {
    const mappedUpdates = this.map(updates);
    return { ...existing, ...mappedUpdates };
  }
}

// Usage
const existingUser: User = { id: '123', name: 'John', email: 'john@example.com' };
const updates = { user_name: 'John Doe' };
const updated = mapper.updateExisting(existingUser, updates);
// Result: { id: '123', name: 'John Doe', email: 'john@example.com' }
```

## Pattern 3: Multiple Mappings for Different Contexts

Create different mappers for different API versions or contexts:

```typescript
// API v1 mapping
const v1Mapping = {
  user_id: 'id',
  user_name: 'name',
} as const;

// API v2 mapping (different field names)
const v2Mapping = {
  id: 'id',
  full_name: 'name',
} as const;

class UserMapperV1 extends MappedServiceBase<ApiUserV1, typeof v1Mapping> {
  protected fieldMapping = v1Mapping;
}

class UserMapperV2 extends MappedServiceBase<ApiUserV2, typeof v2Mapping> {
  protected fieldMapping = v2Mapping;
}

// Use the appropriate mapper based on API version
const mapper = apiVersion === 'v1' ? new UserMapperV1() : new UserMapperV2();
```

## Pattern 4: Composition with Validation Libraries

Integrate with Zod for runtime validation:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

type ValidatedUser = z.infer<typeof UserSchema>;

class ValidatedUserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  
  map(source: Partial<ApiUser>): ValidatedUser {
    const mapped = super.map(source);
    return UserSchema.parse(mapped); // Throws if validation fails
  }
  
  safemap(source: Partial<ApiUser>): { success: true; data: ValidatedUser } | { success: false; error: z.ZodError } {
    try {
      const mapped = super.map(source);
      const validated = UserSchema.parse(mapped);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error };
      }
      throw error;
    }
  }
}
```

## Pattern 5: Type Guards and Narrowing

Use type guards with your mappers:

```typescript
interface ApiProduct {
  product_id: string;
  product_type: 'physical' | 'digital';
  weight?: number;
  download_url?: string;
  [key: string]: unknown;
}

const productMapping = {
  product_id: 'id',
  product_type: 'type',
  weight: 'weight',
  download_url: 'downloadUrl',
} as const;

type Product = MappedType<ApiProduct, typeof productMapping>;

// Type guards
function isPhysicalProduct(product: Product): product is Product & { weight: number } {
  return product.type === 'physical' && product.weight !== undefined;
}

function isDigitalProduct(product: Product): product is Product & { downloadUrl: string } {
  return product.type === 'digital' && product.downloadUrl !== undefined;
}

// Usage
class ProductMapper extends MappedServiceBase<ApiProduct, typeof productMapping> {
  protected fieldMapping = productMapping;
  
  mapToSpecific(source: Partial<ApiProduct>) {
    const product = this.map(source);
    
    if (isPhysicalProduct(product)) {
      console.log(`Physical product weighs ${product.weight}kg`);
    } else if (isDigitalProduct(product)) {
      console.log(`Digital product at ${product.downloadUrl}`);
    }
    
    return product;
  }
}
```

## Pattern 6: Default Values

Provide default values for missing fields:

```typescript
class UserMapperWithDefaults extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  
  map(source: Partial<ApiUser>) {
    const mapped = super.map(source);
    return {
      id: mapped.id ?? crypto.randomUUID(),
      name: mapped.name ?? 'Anonymous',
      email: mapped.email ?? 'no-email@example.com',
      ...mapped,
    };
  }
}
```

## Pattern 7: Mapper Factory

Create a factory for generating mappers:

```typescript
function createMapper<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>
>(mapping: TMapping) {
  return new (class extends MappedServiceBase<TSource, TMapping> {
    protected fieldMapping = mapping;
  })();
}

// Usage
const userMapper = createMapper(userMapping);
const orderMapper = createMapper(orderMapping);
const productMapper = createMapper(productMapping);
```

## Pattern 8: Testing Strategies

Write tests for your mappers:

```typescript
import { describe, it, expect } from 'vitest';

describe('UserMapper', () => {
  const mapper = new UserMapper();
  
  it('should map all fields correctly', () => {
    const input = {
      user_id: '123',
      user_name: 'John',
      email_address: 'john@example.com',
    };
    
    const result = mapper.map(input);
    
    expect(result).toEqual({
      id: '123',
      name: 'John',
      email: 'john@example.com',
    });
  });
  
  it('should handle partial input', () => {
    const input = { user_id: '123' };
    const result = mapper.map(input);
    
    expect(result.id).toBe('123');
    expect(result.name).toBeUndefined();
  });
  
  it('should reverse map correctly', () => {
    const input = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
    };
    
    const result = mapper.reverseMap(input);
    
    expect(result).toEqual({
      user_id: '123',
      user_name: 'John',
      email_address: 'john@example.com',
    });
  });
});
```

## Pattern 9: Logging and Debugging

Add logging for debugging:

```typescript
class LoggingUserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  
  map(source: Partial<ApiUser>) {
    console.log('Mapping from API:', source);
    const result = super.map(source);
    console.log('Mapped to domain:', result);
    return result;
  }
  
  reverseMap(target: Partial<User>) {
    console.log('Reverse mapping from domain:', target);
    const result = super.reverseMap(target);
    console.log('Mapped to API:', result);
    return result;
  }
}
```

## Pattern 10: Conditional Mapping

Map fields conditionally based on runtime values:

```typescript
class ConditionalUserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  
  constructor(private includeEmail: boolean = true) {
    super();
  }
  
  map(source: Partial<ApiUser>) {
    const mapped = super.map(source);
    
    if (!this.includeEmail) {
      const { email, ...rest } = mapped;
      return rest as typeof mapped;
    }
    
    return mapped;
  }
}

// Usage
const publicMapper = new ConditionalUserMapper(false); // Don't include email
const privateMapper = new ConditionalUserMapper(true);  // Include email
```

## Best Practices

1. **Keep mappings simple**: This library is designed for straightforward field renaming
2. **Handle complex transformations separately**: Use additional methods for data type conversions
3. **Use type guards**: Narrow types when dealing with union types
4. **Test your mappers**: Write unit tests to ensure correctness
5. **Document your mappings**: Add comments explaining non-obvious field mappings
6. **Consider validation**: Integrate with validation libraries for runtime safety
7. **Use factories for reusability**: Create mapper factories for common patterns

## Performance Tips

- Mappers are lightweight; create instances as needed
- For bulk operations, consider batch processing
- Avoid deep cloning unless necessary
- Use partial types when possible to reduce memory footprint
