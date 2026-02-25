import { MappedType, MappingDefinition } from './types';

type MappingEntries<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
> = Array<[keyof TMapping & keyof TSource, TMapping[keyof TMapping]]>;

export abstract class MappedServiceBase<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
> {
  protected abstract fieldMapping: TMapping;

  map(source: Partial<TSource>): MappedType<TSource, TMapping> {
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

  reverseMap(target: Partial<MappedType<TSource, TMapping>>): Partial<TSource> {
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
