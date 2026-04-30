import { MapOptions, validateMapping } from './validation.js';
import { MappedType, MappingDefinition } from './types.js';
import { getPath, setPath } from './utils.js';

type MappingEntries<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
> = Array<[keyof TMapping & keyof TSource, TMapping[keyof TMapping]]>;

export abstract class MappedServiceBase<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
> {
  protected abstract fieldMapping: TMapping;

  map(source: Partial<TSource>, options: MapOptions = {}): MappedType<TSource, TMapping> {
    if (!this.fieldMapping) {
      throw new Error('fieldMapping is not initialized. Ensure the subclass sets this property.');
    }

    if (options.validateWith) {
      options.validateWith(source);
    }

    if (options.validate) {
      validateMapping(
        source as Record<string, unknown>,
        Object.keys(this.fieldMapping),
        options,
      );
    }

    const result = (options.allowPassThrough ? { ...source } : {}) as MappedType<TSource, TMapping>;

    for (const [externalKey, internalKey] of Object.entries(this.fieldMapping) as MappingEntries<
      TSource,
      TMapping
    >) {
      const extStr = externalKey as string;
      const intStr = internalKey as string;
      const value = getPath(source, extStr);
      if (value !== undefined || options.stripUndefined === false) {
        setPath(result, intStr, value);
      }
    }

    return result;
  }

  reverseMap(
    target: Partial<MappedType<TSource, TMapping>>,
    options: MapOptions = {},
  ): Partial<TSource> {
    if (!this.fieldMapping) {
      throw new Error('fieldMapping is not initialized. Ensure the subclass sets this property.');
    }

    if (options.validateWith) {
      options.validateWith(target);
    }

    if (options.validate) {
      validateMapping(
        target as Record<string, unknown>,
        Object.values(this.fieldMapping) as string[],
        options,
      );
    }

    const result = (options.allowPassThrough ? { ...target } : {}) as Partial<TSource>;

    for (const [externalKey, internalKey] of Object.entries(this.fieldMapping) as MappingEntries<
      TSource,
      TMapping
    >) {
      const extStr = externalKey as string;
      const intStr = internalKey as string;
      const value = getPath(target, intStr);
      if (value !== undefined || options.stripUndefined === false) {
        setPath(result, extStr, value);
      }
    }

    return result;
  }

  /**
   * Get all keys from the field mapping.
   * @returns Object with external (source) and internal (mapped) key arrays
   */
  public getAllKeys(): { external: string[]; internal: string[] } {
    if (!this.fieldMapping) {
      throw new Error('fieldMapping is not initialized. Ensure the subclass sets this property.');
    }
    return {
      external: Object.keys(this.fieldMapping),
      internal: Object.values(this.fieldMapping) as string[],
    };
  }

  /**
   * Get a flat set of all keys (both external and internal) from the field mapping.
   * Useful for purge/exclusion operations where you need all possible keys.
   * @returns Set containing all keys from both directions
   */
  public getKeySet(): Set<string> {
    if (!this.fieldMapping) {
      throw new Error('fieldMapping is not initialized. Ensure the subclass sets this property.');
    }
    return new Set([
      ...Object.keys(this.fieldMapping),
      ...Object.values(this.fieldMapping) as string[],
    ]);
  }
}

/**
 * Concrete implementation of MappedServiceBase that accepts field mapping via constructor.
 * Use this when you don't need to extend the base class and want to create mappers inline.
 */
export class FieldMapper<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
> extends MappedServiceBase<TSource, TMapping> {
  protected fieldMapping: TMapping;

  constructor(mapping: TMapping) {
    super();
    this.fieldMapping = mapping;
  }
}

/**
 * Factory function to create a FieldMapper instance.
 * Convenience wrapper around `new FieldMapper()` with better type inference.
 *
 * @param mapping - The field mapping definition
 * @returns A new FieldMapper instance
 *
 * @example
 * ```typescript
 * const mapping = { custom_a: 'isEnterprise', custom_b: 'commerceType' } as const;
 * const mapper = createMapper(mapping);
 *
 * const result = mapper.map({ custom_a: true, custom_b: 'B2B' });
 * // { isEnterprise: true, commerceType: 'B2B' }
 * ```
 */
export function createMapper<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
>(mapping: TMapping): FieldMapper<TSource, TMapping> {
  return new FieldMapper(mapping);
}
