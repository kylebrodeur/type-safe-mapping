/**
 * Core utilities for zero-duplication field mapping between external data shapes and internal models.
 *
 * Usage notes:
 * - Define your `fieldMapping` with `as const` so the mapping keys and values stay literal.
 * - Extend `MappedServiceBase` and implement `fieldMapping` to map external → internal keys.
 * - Use `map` to go from the external shape to the internal typed shape, and `reverseMap` to go back.
 */
export { MappedServiceBase } from './MappedServiceBase';
export type { MappedType, MappingDefinition, ReverseMapping } from './types';
