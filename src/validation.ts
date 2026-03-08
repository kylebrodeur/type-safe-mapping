/**
 * Options for controlling runtime validation behavior in `map()` and `reverseMap()`.
 */
export interface MapOptions {
  /**
   * Enable runtime validation. Default: `false`.
   *
   * When `true`:
   * - All fields defined in the mapping must be present in the source.
   * - Unknown fields are validated according to `allowUnknownFields`.
   */
  validate?: boolean;

  /**
   * Allow fields in the source that are not part of the mapping. Default: `true`.
   *
   * Only checked when `validate` is `true`. When set to `false`, an error is thrown
   * if the source contains fields that are not defined in the mapping.
   */
  allowUnknownFields?: boolean;

  /**
   * Custom validation function. Called with the source object whenever it is provided,
   * regardless of the `validate` flag.
   *
   * Throw an error inside the function to signal a validation failure.
   *
   * @example
   * ```typescript
   * mapper.map(source, {
   *   validateWith: (data) => externalSchema.parse(data),
   * });
   * ```
   */
  validateWith?: (data: unknown) => void;
}

/**
 * Validates a source object against a set of expected keys and the provided options.
 *
 * Called internally by `MappedServiceBase` when `validate: true` is passed to
 * `map()` or `reverseMap()`.
 *
 * @param source - The source object to validate.
 * @param expectedKeys - The keys that must be present in the source (i.e. the keys
 *   defined in the mapping for the current direction).
 * @param options - Validation options.
 * @throws {Error} If any validation rule is violated.
 */
export function validateMapping(
  source: Record<string, unknown>,
  expectedKeys: string[],
  options: Pick<MapOptions, 'allowUnknownFields'>,
): void {
  const errors: string[] = [];

  // Validate presence of all expected (mapped) fields.
  for (const key of expectedKeys) {
    if (!(key in source)) {
      errors.push(`Missing required field \`${key}\` in source.`);
    }
  }

  // Check for unmapped (unknown) fields.
  if (options.allowUnknownFields === false) {
    const unknownFields = Object.keys(source).filter((key) => !expectedKeys.includes(key));
    for (const field of unknownFields) {
      errors.push(`Unmapped field \`${field}\` is not allowed.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }
}
