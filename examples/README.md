# Type-Safe Mapping Examples

This directory contains examples demonstrating different use cases for the `@kylebrodeur/type-safe-mapping` package.

## Available Examples

### [basic-usage.ts](./basic-usage.ts)
Demonstrates the core functionality:
- Mapping API responses to domain models
- Reversing domain models back to API format
- Type inference and type safety

## Running Examples

You can run these examples using `ts-node` or by compiling them with TypeScript:

```bash
# Install ts-node if you haven't
npm install -g ts-node

# Run an example
ts-node examples/basic-usage.ts
```

Or compile and run:

```bash
npx tsc examples/basic-usage.ts --outDir dist/examples
node dist/examples/basic-usage.js
```

## Contributing Examples

If you have a useful example that demonstrates a specific use case, feel free to submit a PR!
