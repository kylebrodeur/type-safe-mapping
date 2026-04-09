import { MapOptions, validateMapping } from './validation.js';
import { MappedType, MappingDefinition } from './types.js';

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

    const result = {} as MappedType<TSource, TMapping>;

    for (const [externalKey, internalKey] of Object.entries(this.fieldMapping) as MappingEntries<
      TSource,
      TMapping
    >) {
      const value = source[externalKey];
      if (value !== undefined) {
        result[internalKey] = value as TSource[typeof externalKey];
      }
    }

    return result;
  }

  reverseMap(
    target: Partial<MappedType<TSource, TMapping>>,
    options: MapOptions = {},
  ): Partial<TSource> {
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

    const result = {} as Partial<TSource>;

    for (const [externalKey, internalKey] of Object.entries(this.fieldMapping) as MappingEntries<
      TSource,
      TMapping
    >) {
      const value = target[internalKey];
      if (value !== undefined) {
        result[externalKey] = value as TSource[typeof externalKey];
      }
    }

    return result;
  }
}
