import { MapOptions, MappedType, MappingDefinition } from './types.js';

type MappingEntries<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
> = Array<[keyof TMapping & keyof TSource, TMapping[keyof TMapping]]>;

export abstract class MappedServiceBase<
  TSource extends Record<string, unknown>,
  TMapping extends MappingDefinition<TSource>,
> {
  protected abstract fieldMapping: TMapping;

  map(source: Partial<TSource>, options?: { dynamicMapping?: false }): MappedType<TSource, TMapping>;
  map(
    source: Partial<TSource>,
    options: { dynamicMapping: true },
  ): MappedType<TSource, TMapping> & Record<string, unknown>;
  map(
    source: Partial<TSource>,
    options?: MapOptions,
  ): MappedType<TSource, TMapping> | (MappedType<TSource, TMapping> & Record<string, unknown>) {
    const result: Record<string, unknown> = {};

    const mappedExternalKeys = new Set<string>();

    for (const [externalKey, internalKey] of Object.entries(this.fieldMapping) as MappingEntries<
      TSource,
      TMapping
    >) {
      mappedExternalKeys.add(externalKey as string);
      const value = source[externalKey];
      if (value !== undefined) {
        result[internalKey as string] = value;
      }
    }

    if (options?.dynamicMapping) {
      for (const [key, value] of Object.entries(source)) {
        if (!mappedExternalKeys.has(key) && value !== undefined) {
          result[key] = value;
        }
      }
      return result as MappedType<TSource, TMapping> & Record<string, unknown>;
    }

    return result as MappedType<TSource, TMapping>;
  }

  reverseMap(
    target: Partial<MappedType<TSource, TMapping>>,
    options?: { dynamicMapping?: false },
  ): Partial<TSource>;
  reverseMap(
    target: Partial<MappedType<TSource, TMapping>> & Record<string, unknown>,
    options: { dynamicMapping: true },
  ): Partial<TSource> & Record<string, unknown>;
  reverseMap(
    target: Partial<MappedType<TSource, TMapping>> & Record<string, unknown>,
    options?: MapOptions,
  ): Partial<TSource> | (Partial<TSource> & Record<string, unknown>) {
    const result: Record<string, unknown> = {};

    const mappedInternalKeys = new Set<string>();

    for (const [externalKey, internalKey] of Object.entries(this.fieldMapping) as MappingEntries<
      TSource,
      TMapping
    >) {
      mappedInternalKeys.add(internalKey as string);
      const value = target[internalKey as string];
      if (value !== undefined) {
        result[externalKey as string] = value;
      }
    }

    if (options?.dynamicMapping) {
      for (const [key, value] of Object.entries(target)) {
        if (!mappedInternalKeys.has(key) && value !== undefined) {
          result[key] = value;
        }
      }
      return result as Partial<TSource> & Record<string, unknown>;
    }

    return result as Partial<TSource>;
  }
}
