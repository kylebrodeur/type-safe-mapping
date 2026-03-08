# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Dynamic Mapping Expansions**: `map()` and `reverseMap()` now accept an optional `options`
  parameter. Setting `{ dynamicMapping: true }` causes any source fields that are not present in
  the field mapping to be copied through to the result unchanged. This is useful when working with
  APIs or datasets where the schema is only partially known.
- New exported type `MapOptions` that describes the options object accepted by `map()` and
  `reverseMap()`.
- `devDependencies` added to `package.json` (`typescript`, `vitest`, `eslint`,
  `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`) so the project builds and tests
  without requiring an external monorepo root.

### Fixed
- `tsconfig.json` no longer extends `../../tsconfig.base.json` (a file that does not exist in the
  standalone repository). All required compiler options are now inlined directly.

## [0.1.1] - 2026-03-02

### Fixed
- ESM compatibility: relative imports in emitted JS now include explicit `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` errors in Node.js ESM environments (`"type": "module"`)
- Switched `tsconfig.json` to `module: NodeNext` / `moduleResolution: NodeNext` to ensure correct extension handling

## [0.1.0] - 2026-02-25

### Added
- Initial release
- `MappedServiceBase` abstract class for creating type-safe field mappers
- `MappedType` utility type for inferring mapped types from field mappings
- `map()` method for transforming external data to internal models
- `reverseMap()` method for transforming internal models back to external format
- Full TypeScript type safety and inference
- Zero runtime dependencies
- Support for optional fields
- Bidirectional mapping capabilities

[0.1.0]: https://github.com/kylebrodeur/type-safe-mapping/releases/tag/v0.1.0
