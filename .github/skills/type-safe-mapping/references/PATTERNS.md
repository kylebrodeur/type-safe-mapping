# Advanced Usage Patterns

Real-world patterns and examples for `@workspace/type-safe-mapping`.

## Table of Contents

1. [Multiple Mapping Strategies](#multiple-mapping-strategies)
2. [Nested Object Mapping](#nested-object-mapping)
3. [Array Transformation](#array-transformation)
4. [Conditional Mapping](#conditional-mapping)
5. [Compositional Mapping](#compositional-mapping)
6. [Service Layer Integration](#service-layer-integration)
7. [Testing Patterns](#testing-patterns)

---

## Multiple Mapping Strategies

Handle different views of the same data with multiple mappers.

### List vs Detail Mapping

```typescript
// Minimal fields for list view
const listMapping = {
  user_id: 'id',
  user_name: 'name',
} as const;

// Full fields for detail view
const detailMapping = {
  user_id: 'id',
  user_name: 'name',
  user_email: 'email',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
} as const;

class UserMapper {
  private listMapper = new (class extends MappedServiceBase<ApiUserList, typeof listMapping> {
    protected fieldMapping = listMapping;
  })();

  private detailMapper = new (class extends MappedServiceBase<ApiUserDetail, typeof detailMapping> {
    protected fieldMapping = detailMapping;
  })();

  mapList(users: ApiUserList[]): Array<MappedType<ApiUserList, typeof listMapping>> {
    return users.map(user => this.listMapper.map(user));
  }

  mapDetail(user: ApiUserDetail): MappedType<ApiUserDetail, typeof detailMapping> {
    return this.detailMapper.map(user);
  }
}
```

### Read vs Write Mapping

Different mappings for GET vs POST/PUT:

```typescript
// Read mapping: includes computed fields
const readMapping = {
  id: 'id',
  full_name: 'fullName',
  created_at_formatted: 'createdAt',
} as const;

// Write mapping: only editable fields
const writeMapping = {
  full_name: 'fullName',
} as const;

class UserService extends MappedServiceBase<ApiUser, typeof readMapping> {
  protected fieldMapping = readMapping;

  private writeMapper = new (class extends MappedServiceBase<ApiUserWrite, typeof writeMapping> {
    protected fieldMapping = writeMapping;
  })();

  async get(id: string) {
    const response = await api.get(`/users/${id}`);
    return this.map(response);
  }

  async update(user: MappedType<ApiUserWrite, typeof writeMapping>) {
    const payload = this.writeMapper.reverseMap(user);
    await api.put('/users', payload);
  }
}
```

---

## Nested Object Mapping

Handle nested structures by composing mappers.

### Basic Nested Mapping

```typescript
// Map nested address object
const addressMapping = {
  street_address: 'street',
  city_name: 'city',
  postal_code: 'zip',
} as const;

const userMapping = {
  user_id: 'id',
  user_name: 'name',
} as const;

class AddressMapper extends MappedServiceBase<ApiAddress, typeof addressMapping> {
  protected fieldMapping = addressMapping;
}

class UserMapper extends MappedServiceBase<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  private addressMapper = new AddressMapper();

  mapWithAddress(user: ApiUser & { address: ApiAddress }) {
    return {
      ...this.map(user),
      address: this.addressMapper.map(user.address),
    };
  }
}
```

### Deep Nesting

```typescript
interface ApiOrganization {
  org_id: string;
  org_name: string;
  owner: ApiUser & { address: ApiAddress };
}

class OrganizationMapper {
  private userMapper = new UserMapper();
  private addressMapper = new AddressMapper();

  map(org: ApiOrganization) {
    return {
      id: org.org_id,
      name: org.org_name,
      owner: {
        ...this.userMapper.map(org.owner),
        address: this.addressMapper.map(org.owner.address),
      },
    };
  }
}
```

---

## Array Transformation

Patterns for mapping arrays of data.

### Bulk Mapping with Error Handling

```typescript
class UserMapper extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;

  mapMany(users: ApiUser[]): Array<MappedType<ApiUser, typeof mapping>> {
    return users.map(user => this.map(user));
  }

  mapManyWithErrors(users: ApiUser[]): {
    success: Array<MappedType<ApiUser, typeof mapping>>;
    errors: Array<{ index: number; error: Error }>;
  } {
    const success = [];
    const errors = [];

    users.forEach((user, index) => {
      try {
        success.push(this.map(user));
      } catch (error) {
        errors.push({ index, error });
      }
    });

    return { success, errors };
  }
}
```

### Filtering During Mapping

```typescript
class UserMapper extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;

  mapActive(users: ApiUser[]): Array<MappedType<ApiUser, typeof mapping>> {
    return users
      .filter(user => user.status === 'active')
      .map(user => this.map(user));
  }

  mapWithValidation(
    users: ApiUser[],
    validate: (user: MappedType<ApiUser, typeof mapping>) => boolean
  ) {
    return users
      .map(user => this.map(user))
      .filter(validate);
  }
}
```

---

## Conditional Mapping

Handle optional fields and conditional transformations.

### Optional Field Handling

```typescript
interface ApiUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

const baseMapping = {
  id: 'id',
  name: 'name',
} as const;

const fullMapping = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
} as const;

class UserMapper extends MappedServiceBase<ApiUser, typeof fullMapping> {
  protected fieldMapping = fullMapping;

  mapWithOptionals(user: ApiUser) {
    const mapped = this.map(user);
    
    // Optional: remove undefined values
    return Object.fromEntries(
      Object.entries(mapped).filter(([_, v]) => v !== undefined)
    );
  }
}
```

### Conditional Field Inclusion

```typescript
class UserMapper extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;

  mapWithPermissions(user: ApiUser, canViewEmail: boolean) {
    const mapped = this.map(user);
    
    if (!canViewEmail) {
      delete mapped.email;
    }
    
    return mapped;
  }
}
```

---

## Compositional Mapping

Build complex mappers from simple ones.

### Mapper Composition

```typescript
// Base mapper
class BaseMapper<T extends Record<string, unknown>, M extends MappingDefinition<T>> 
  extends MappedServiceBase<T, M> {
  
  protected abstract fieldMapping: M;
  
  mapArray(items: T[]): Array<MappedType<T, M>> {
    return items.map(item => this.map(item));
  }
}

// Composed mapper
class UserMapper extends BaseMapper<ApiUser, typeof userMapping> {
  protected fieldMapping = userMapping;
  
  private roleMapper = new (class extends BaseMapper<ApiRole, typeof roleMapping> {
    protected fieldMapping = roleMapping;
  })();
  
  mapWithRoles(user: ApiUser & { roles: ApiRole[] }) {
    return {
      ...this.map(user),
      roles: this.roleMapper.mapArray(user.roles),
    };
  }
}
```

### Middleware Pattern

```typescript
type MapperMiddleware<T, R> = (input: T, next: (input: T) => R) => R;

class UserMapper extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;
  private middleware: MapperMiddleware<ApiUser, MappedType<ApiUser, typeof mapping>>[] = [];

  use(middleware: MapperMiddleware<ApiUser, MappedType<ApiUser, typeof mapping>>) {
    this.middleware.push(middleware);
    return this;
  }

  map(user: Partial<ApiUser>) {
    const baseMap = () => super.map(user);
    
    return this.middleware.reduceRight(
      (next, middleware) => (input: ApiUser) => middleware(input, next),
      baseMap
    )(user as ApiUser);
  }
}

// Usage
const mapper = new UserMapper()
  .use((user, next) => {
    console.log('Before mapping:', user);
    const result = next(user);
    console.log('After mapping:', result);
    return result;
  })
  .use((user, next) => {
    // Validate before mapping
    if (!user.user_id) throw new Error('Missing user_id');
    return next(user);
  });
```

---

## Service Layer Integration

Integrate mappers into service architecture.

### Repository Pattern

```typescript
interface IUserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

class UserRepository implements IUserRepository {
  private mapper = new UserMapper();

  async findById(id: string): Promise<User> {
    const apiUser = await api.get<ApiUser>(`/users/${id}`);
    return this.mapper.map(apiUser);
  }

  async save(user: User): Promise<void> {
    const apiUser = this.mapper.reverseMap(user);
    await api.post('/users', apiUser);
  }

  async findAll(): Promise<User[]> {
    const apiUsers = await api.get<ApiUser[]>('/users');
    return apiUsers.map(user => this.mapper.map(user));
  }
}
```

### Use Case Pattern

```typescript
class GetUserUseCase {
  constructor(
    private repository: IUserRepository,
    private cache: ICache
  ) {}

  async execute(id: string): Promise<User> {
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;

    const user = await this.repository.findById(id);
    await this.cache.set(`user:${id}`, user, { ttl: 300 });
    
    return user;
  }
}
```

### API Controller Integration

```typescript
class UserController {
  private mapper = new UserMapper();

  async getUser(req: Request, res: Response) {
    try {
      const apiUser = await userService.fetchUser(req.params.id);
      const user = this.mapper.map(apiUser);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const apiUser = this.mapper.reverseMap(req.body);
      await userService.updateUser(req.params.id, apiUser);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

---

## Testing Patterns

Effective testing strategies for mapped services.

### Type-Level Tests

```typescript
import { expectTypeOf } from 'vitest';

describe('UserMapper types', () => {
  it('infers correct mapped type', () => {
    type Mapped = MappedType<ApiUser, typeof mapping>;
    
    expectTypeOf<Mapped>().toEqualTypeOf<{
      id: string;
      name: string;
      email: string;
    }>();
  });

  it('map returns correct type', () => {
    const mapper = new UserMapper();
    const result = mapper.map({ user_id: '1', user_name: 'Test', user_email: 'test@example.com' });
    
    expectTypeOf(result).toEqualTypeOf<{
      id: string;
      name: string;
      email: string;
    }>();
  });
});
```

### Runtime Tests

```typescript
describe('UserMapper behavior', () => {
  const mapper = new UserMapper();

  it('maps all fields correctly', () => {
    const input = {
      user_id: '123',
      user_name: 'John Doe',
      user_email: 'john@example.com',
    };

    const result = mapper.map(input);

    expect(result).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('handles partial input', () => {
    const input = {
      user_id: '123',
      user_name: 'John Doe',
    };

    const result = mapper.map(input);

    expect(result).toEqual({
      id: '123',
      name: 'John Doe',
    });
  });

  it('ignores undefined values', () => {
    const input = {
      user_id: '123',
      user_name: undefined,
      user_email: 'john@example.com',
    };

    const result = mapper.map(input);

    expect(result).toEqual({
      id: '123',
      email: 'john@example.com',
    });
    expect(result).not.toHaveProperty('name');
  });

  it('preserves null values', () => {
    const input = {
      user_id: '123',
      user_name: null,
    };

    const result = mapper.map(input);

    expect(result).toEqual({
      id: '123',
      name: null,
    });
  });
});
```

### Integration Tests

```typescript
describe('UserRepository integration', () => {
  let repository: UserRepository;
  let mockApi: jest.Mocked<typeof api>;

  beforeEach(() => {
    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
    } as any;
    
    repository = new UserRepository(mockApi);
  });

  it('fetches and maps user correctly', async () => {
    mockApi.get.mockResolvedValue({
      user_id: '123',
      user_name: 'John Doe',
      user_email: 'john@example.com',
    });

    const user = await repository.findById('123');

    expect(user).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(mockApi.get).toHaveBeenCalledWith('/users/123');
  });

  it('saves user with correct mapping', async () => {
    const user = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    };

    await repository.save(user);

    expect(mockApi.post).toHaveBeenCalledWith('/users', {
      user_id: '123',
      user_name: 'John Doe',
      user_email: 'john@example.com',
    });
  });
});
```

### Test Utilities

```typescript
// Test helper for creating mock API data
function createMockApiUser(overrides: Partial<ApiUser> = {}): ApiUser {
  return {
    user_id: '123',
    user_name: 'Test User',
    user_email: 'test@example.com',
    ...overrides,
  };
}

// Test helper for creating mapped data
function createMockUser(
  overrides: Partial<MappedType<ApiUser, typeof mapping>> = {}
): MappedType<ApiUser, typeof mapping> {
  return {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
}

describe('UserMapper with helpers', () => {
  it('maps mock data correctly', () => {
    const mapper = new UserMapper();
    const input = createMockApiUser({ user_name: 'Custom Name' });
    const result = mapper.map(input);
    
    expect(result.name).toBe('Custom Name');
  });
});
```
