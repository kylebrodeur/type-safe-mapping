export type MappingDefinition<
  TSource extends Record<string, unknown>,
  TExternal extends keyof TSource = keyof TSource,
> = Record<TExternal, keyof TSource>;

export type ReverseMapping<
  TSource extends Record<string, unknown>,
  M extends MappingDefinition<TSource>,
  Key extends M[keyof M],
> = {
  [External in keyof M]: M[External] extends Key ? External : never;
}[keyof M];

export type MappedType<
  TSource extends Record<string, unknown>,
  M extends MappingDefinition<TSource>,
> = {
  [MappedKey in M[keyof M]]: TSource[ReverseMapping<TSource, M, MappedKey> & keyof TSource];
};

/** Options accepted by `map()` and `reverseMap()`. */
export interface MapOptions {
  /**
   * When `true`, fields from the source that are not present in the field mapping are copied
   * as-is into the result object. This is useful when working with partially-known schemas
   * where unmapped fields should be preserved rather than dropped.
   *
   * @default false
   */
  dynamicMapping?: boolean;
}

