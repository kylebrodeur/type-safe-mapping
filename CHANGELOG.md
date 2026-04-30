# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-30

### Added
- **Deep path support**: Field mappings now support dot-notation for nested object traversal (e.g., `'user.profile.name'`)
- New utility functions `getPath`, `setPath`, and `hasPath` in `src/utils.ts` for safe nested property access
- `allowPassThrough` option in `MapOptions`: preserves unmapped fields in the output when set to `true` (default: `false`)
- `stripUndefined` option in `MapOptions`: controls whether `undefined` values are excluded from mapping (default: `true` for backward compatibility)

### Fixed
- Added guard for uninitialized `fieldMapping` property - now throws a clear error message instead of crashing with `TypeError: Cannot convert undefined or null to object`
- Validation now correctly handles nested paths when checking for field presence
- Unknown field validation now checks only top-level keys to avoid false positives with nested mappings

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

[0.2.0]: https://github.com/kylebrodeur/type-safe-mapping/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/kylebrodeur/type-safe-mapping/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/kylebrodeur/type-safe-mapping/releases/tag/v0.1.0
