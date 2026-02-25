# Frequently Asked Questions

## General Questions

### What problem does this package solve?

When mapping data between different shapes (e.g., API responses to domain models), you typically need to:
1. Define the mapping (which fields map to which)
2. Write transformation functions
3. Define the output type

This leads to duplication. If you change a field name, you need to update it in multiple places. This package eliminates that by using TypeScript's type system to infer the mapped type from your field mapping definition.

### How is this different from other mapping libraries?

- **Zero runtime dependencies**: No external libraries to bloat your bundle
- **Type inference**: The output type is automatically inferred from your mapping definition
- **Bidirectional**: Built-in support for both directions (external ↔ internal)
- **Simple API**: Just extend a base class and define your mapping

### When should I use this?

Use this package when you:
- Need to transform data between different shapes (API ↔ Domain)
- Want full TypeScript type safety
- Want to avoid duplication in mapping definitions
- Need bidirectional transformations

### When should I NOT use this?

This package might not be the best fit if:
- You need complex transformations (data type conversions, computed fields, etc.)
- You need to map nested objects (currently not supported)
- You need to handle arrays of objects differently

## Technical Questions

### Why do I need `as const` on my field mapping?

The `as const` assertion tells TypeScript to preserve the exact literal types of the mapping. Without it, TypeScript would widen the types to `string`, and you'd lose the type inference.

```typescript
// ❌ Without 'as const'
const mapping = {
  api_field: 'domainField'  // Type: { api_field: string }
};

// ✅ With 'as const'
const mapping = {
  api_field: 'domainField'  // Type: { api_field: 'domainField' }
} as const;
```

### What happens to unmapped fields?

Unmapped fields are ignored. Only fields defined in your mapping will be transformed:

```typescript
interface Source {
  field_a: string;
  field_b: number;
  field_c: boolean;
}

const mapping = {
  field_a: 'fieldA',
} as const;

// Result type: { fieldA: string }
// field_b and field_c are not included
```

### How are optional fields handled?

Optional fields in the source are preserved as optional in the mapped type:

```typescript
interface Source {
  required_field: string;
  optional_field?: number;
}

const mapping = {
  required_field: 'requiredField',
  optional_field: 'optionalField',
} as const;

// Result: { requiredField: string; optionalField?: number }
```

### Can I map nested objects?

Currently, the package supports flat object mapping only. For nested objects, you would need to:
1. Flatten the object before mapping
2. Use separate mappers for nested structures
3. Or use a more complex mapping library

### Can I transform data types during mapping?

No, this package preserves the data types. If you need to transform values (e.g., string to number, date parsing, etc.), you should handle that separately:

```typescript
class UserMapper extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;
  
  map(source: Partial<ApiUser>) {
    const mapped = super.map(source);
    return {
      ...mapped,
      createdAt: new Date(mapped.createdAt), // Transform after mapping
    };
  }
}
```

### What's the performance impact?

The package is very lightweight with minimal runtime overhead:
- No deep cloning
- Simple object iteration
- No runtime type checking
- Zero dependencies

For most use cases, the performance impact is negligible.

### Can I use this with validation libraries?

Yes! The package works well with validation libraries like Zod, Yup, or io-ts:

```typescript
import { z } from 'zod';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

class UserMapper extends MappedServiceBase<ApiUser, typeof mapping> {
  protected fieldMapping = mapping;
  
  map(source: Partial<ApiUser>) {
    const mapped = super.map(source);
    return userSchema.parse(mapped); // Validate after mapping
  }
}
```

## Troubleshooting

### TypeScript says "Type 'X' is not assignable to type 'Y'"

Make sure you're using `as const` on your field mapping. Without it, TypeScript can't properly infer the types.

### My IDE shows type errors but the code compiles

Try restarting your TypeScript server. In VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### The mapped type doesn't include all my fields

Only fields defined in your `fieldMapping` will be included in the result. This is by design - it allows you to control exactly which fields get mapped.

## Contributing

Have a question that's not answered here? Feel free to [open an issue](https://github.com/kylebrodeur/type-safe-mapping/issues)!
