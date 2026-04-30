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
}
