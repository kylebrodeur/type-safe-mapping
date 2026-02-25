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
