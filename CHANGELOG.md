# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
