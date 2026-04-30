import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { MappedServiceBase, FieldMapper, createMapper } from '../src/MappedServiceBase';
import { MappedType } from '../src/types';
import { validateMapping } from '../src/validation';

interface ApiRow {
  custom_a: boolean;
  custom_b: string;
  optional_c?: number;
  [key: string]: unknown;
}

const fieldMapping = {
  custom_a: 'isEnterprise',
  custom_b: 'commerceType',
} as const;

type Domain = MappedType<ApiRow, typeof fieldMapping>;

class UserMapper extends MappedServiceBase<ApiRow, typeof fieldMapping> {
  protected fieldMapping = fieldMapping;
}

describe('MappedServiceBase', () => {
  const mapper = new UserMapper();

  it('maps external rows to domain objects', () => {
    const result = mapper.map({ custom_a: true, custom_b: 'B2B' });

    expect(result).toEqual({ isEnterprise: true, commerceType: 'B2B' });
  });

  it('reverse maps domain objects to external rows', () => {
    const result = mapper.reverseMap({ isEnterprise: false, commerceType: 'B2C' });

    expect(result).toEqual({ custom_a: false, custom_b: 'B2C' });
  });

  it('handles optional values in map()', () => {
    const withOptional = mapper.map({ custom_a: true, custom_b: 'B2B', optional_c: 42 });

    expect(withOptional).toEqual({ isEnterprise: true, commerceType: 'B2B' });
  });

  it('handles optional values in reverseMap()', () => {
    const result = mapper.reverseMap({ isEnterprise: true, commerceType: 'B2B' });

    expect(result).toEqual({ custom_a: true, custom_b: 'B2B' });
  });

  it('infers mapped domain type', () => {
    expectTypeOf<Domain>().toEqualTypeOf<{
      isEnterprise: boolean;
      commerceType: string;
    }>();
  });

  describe('map() with validation', () => {
    it('passes when all mapped fields are present', () => {
      expect(() => mapper.map({ custom_a: true, custom_b: 'B2B' }, { validate: true })).not.toThrow();
    });

    it('throws when a mapped field is missing', () => {
      expect(() => mapper.map({ custom_a: true }, { validate: true })).toThrow(
        'Missing required field `custom_b` in source.',
      );
    });

    it('throws when multiple mapped fields are missing', () => {
      expect(() => mapper.map({}, { validate: true })).toThrow('Validation failed:');
    });

    it('allows unknown fields by default (validate: true)', () => {
      expect(() =>
        mapper.map({ custom_a: true, custom_b: 'B2B', extra: 'ignored' }, { validate: true }),
      ).not.toThrow();
    });

    it('throws on unknown fields when allowUnknownFields is false', () => {
      expect(() =>
        mapper.map(
          { custom_a: true, custom_b: 'B2B', extra: 'unexpected' },
          { validate: true, allowUnknownFields: false },
        ),
      ).toThrow('Unmapped field `extra` is not allowed.');
    });

    it('throws on both missing and unknown field errors together', () => {
      expect(() =>
        mapper.map({ extra: 'unexpected' }, { validate: true, allowUnknownFields: false }),
      ).toThrow('Validation failed:');
    });

    it('does not validate when validate is omitted', () => {
      // Missing fields should not throw without validate: true
      expect(() => mapper.map({})).not.toThrow();
    });

    it('does not validate when validate is false', () => {
      expect(() => mapper.map({}, { validate: false })).not.toThrow();
    });

    it('calls validateWith when provided without validate flag', () => {
      const customValidator = vi.fn();
      mapper.map({ custom_a: true, custom_b: 'B2B' }, { validateWith: customValidator });
      expect(customValidator).toHaveBeenCalledWith({ custom_a: true, custom_b: 'B2B' });
    });

    it('calls validateWith when provided alongside validate: true', () => {
      const customValidator = vi.fn();
      mapper.map({ custom_a: true, custom_b: 'B2B' }, { validate: true, validateWith: customValidator });
      expect(customValidator).toHaveBeenCalledOnce();
    });

    it('calls validateWith even when built-in validation would throw', () => {
      const customValidator = vi.fn();
      // custom_b is missing — built-in validation will throw, but validateWith must still run first
      expect(() =>
        mapper.map({ custom_a: true }, { validate: true, validateWith: customValidator }),
      ).toThrow('Validation failed:');
      expect(customValidator).toHaveBeenCalledOnce();
    });

    it('propagates errors thrown by validateWith', () => {
      expect(() =>
        mapper.map(
          { custom_a: true, custom_b: 'B2B' },
          { validateWith: () => { throw new Error('custom error'); } },
        ),
      ).toThrow('custom error');
    });
  });

  describe('reverseMap() with validation', () => {
    it('passes when all mapped internal fields are present', () => {
      expect(() =>
        mapper.reverseMap({ isEnterprise: true, commerceType: 'B2B' }, { validate: true }),
      ).not.toThrow();
    });

    it('throws when a mapped internal field is missing', () => {
      expect(() => mapper.reverseMap({ isEnterprise: true }, { validate: true })).toThrow(
        'Missing required field `commerceType` in source.',
      );
    });

    it('allows unknown internal fields by default', () => {
      expect(() =>
        mapper.reverseMap(
          { isEnterprise: true, commerceType: 'B2B' },
          { validate: true },
        ),
      ).not.toThrow();
    });

    it('throws on unknown internal fields when allowUnknownFields is false', () => {
      expect(() =>
        mapper.reverseMap(
          { isEnterprise: true, commerceType: 'B2B', extra: 'unexpected' } as Domain & { extra: string },
          { validate: true, allowUnknownFields: false },
        ),
      ).toThrow('Unmapped field `extra` is not allowed.');
    });

    it('calls validateWith in reverseMap when provided', () => {
      const customValidator = vi.fn();
      mapper.reverseMap({ isEnterprise: false, commerceType: 'B2C' }, { validateWith: customValidator });
      expect(customValidator).toHaveBeenCalledWith({ isEnterprise: false, commerceType: 'B2C' });
    });
  });
});

describe('validateMapping utility', () => {
  it('does not throw when all expected keys are present', () => {
    expect(() => validateMapping({ a: 1, b: 2 }, ['a', 'b'], {})).not.toThrow();
  });

  it('throws when an expected key is missing', () => {
    expect(() => validateMapping({ a: 1 }, ['a', 'b'], {})).toThrow(
      'Missing required field `b` in source.',
    );
  });

  it('allows unknown keys by default', () => {
    expect(() => validateMapping({ a: 1, b: 2, c: 3 }, ['a', 'b'], {})).not.toThrow();
  });

  it('throws on unknown keys when allowUnknownFields is false', () => {
    expect(() =>
      validateMapping({ a: 1, b: 2, c: 3 }, ['a', 'b'], { allowUnknownFields: false }),
    ).toThrow('Unmapped field `c` is not allowed.');
  });

  it('collects all errors into a single thrown error', () => {
    let errorMessage = '';
    try {
      validateMapping({ c: 3 }, ['a', 'b'], { allowUnknownFields: false });
    } catch (e) {
      errorMessage = (e as Error).message;
    }
    expect(errorMessage).toContain('Missing required field `a`');
    expect(errorMessage).toContain('Missing required field `b`');
    expect(errorMessage).toContain('Unmapped field `c`');
  });

  it('does not treat inherited prototype properties as present fields', () => {
    // 'toString' exists on every object's prototype chain but must not be treated as an own field
    expect(() => validateMapping({}, ['toString'], {})).toThrow(
      'Missing required field `toString` in source.',
    );
  });
});

describe('Key introspection methods', () => {
  const mapper = new UserMapper();

  describe('getAllKeys()', () => {
    it('returns separate arrays for external and internal keys', () => {
      const keys = mapper.getAllKeys();

      expect(keys).toEqual({
        external: ['custom_a', 'custom_b'],
        internal: ['isEnterprise', 'commerceType'],
      });
    });

    it('returns arrays (not sets or other iterables)', () => {
      const keys = mapper.getAllKeys();

      expect(Array.isArray(keys.external)).toBe(true);
      expect(Array.isArray(keys.internal)).toBe(true);
    });
  });

  describe('getKeySet()', () => {
    it('returns a Set containing all keys from both directions', () => {
      const keySet = mapper.getKeySet();

      expect(keySet).toBeInstanceOf(Set);
      expect(keySet.size).toBe(4);
      expect(keySet.has('custom_a')).toBe(true);
      expect(keySet.has('custom_b')).toBe(true);
      expect(keySet.has('isEnterprise')).toBe(true);
      expect(keySet.has('commerceType')).toBe(true);
    });

    it('can be used for purge/exclusion operations', () => {
      const allKeys = mapper.getKeySet();
      const data = {
        custom_a: true,
        custom_b: 'B2B',
        isEnterprise: false,
        commerceType: 'B2C',
        unrelated: 'keep this',
      };

      // Filter out all keys in the mapping
      const filtered = Object.fromEntries(
        Object.entries(data).filter(([key]) => !allKeys.has(key)),
      );

      expect(filtered).toEqual({ unrelated: 'keep this' });
    });
  });
});

describe('FieldMapper (constructor-based mapper)', () => {
  const mapper = new FieldMapper(fieldMapping);

  it('maps external to internal just like subclass pattern', () => {
    const result = mapper.map({ custom_a: true, custom_b: 'B2B' });

    expect(result).toEqual({ isEnterprise: true, commerceType: 'B2B' });
  });

  it('reverse maps internal to external', () => {
    const result = mapper.reverseMap({ isEnterprise: false, commerceType: 'B2C' });

    expect(result).toEqual({ custom_a: false, custom_b: 'B2C' });
  });

  it('supports getAllKeys()', () => {
    const keys = mapper.getAllKeys();

    expect(keys).toEqual({
      external: ['custom_a', 'custom_b'],
      internal: ['isEnterprise', 'commerceType'],
    });
  });

  it('supports getKeySet()', () => {
    const keySet = mapper.getKeySet();

    expect(keySet.size).toBe(4);
    expect(keySet.has('custom_a')).toBe(true);
    expect(keySet.has('isEnterprise')).toBe(true);
  });

  it('supports validation options', () => {
    expect(() =>
      mapper.map({ custom_a: true, custom_b: 'B2B' }, { validate: true }),
    ).not.toThrow();

    expect(() => mapper.map({ custom_a: true }, { validate: true })).toThrow(
      'Missing required field `custom_b` in source.',
    );
  });

  it('can be created inline without subclassing', () => {
    const inlineMapping = { field_x: 'x', field_y: 'y' } as const;
    const inlineMapper = new FieldMapper(inlineMapping);

    const result = inlineMapper.map({ field_x: 1, field_y: 2 });

    expect(result).toEqual({ x: 1, y: 2 });
  });
});

describe('createMapper() factory function', () => {
  it('creates a FieldMapper instance', () => {
    const mapper = createMapper(fieldMapping);

    expect(mapper).toBeInstanceOf(FieldMapper);
    expect(mapper).toBeInstanceOf(MappedServiceBase);
  });

  it('works identically to new FieldMapper()', () => {
    const mapper1 = createMapper(fieldMapping);
    const mapper2 = new FieldMapper(fieldMapping);

    const input = { custom_a: true, custom_b: 'B2B' };
    expect(mapper1.map(input)).toEqual(mapper2.map(input));
  });

  it('enables inline mapper creation with type inference', () => {
    const mapper = createMapper({ api_id: 'id', api_name: 'name' } as const);

    const result = mapper.map({ api_id: '123', api_name: 'Test' });

    expect(result).toEqual({ id: '123', name: 'Test' });
  });

  it('supports all mapper methods', () => {
    const mapper = createMapper(fieldMapping);

    expect(typeof mapper.map).toBe('function');
    expect(typeof mapper.reverseMap).toBe('function');
    expect(typeof mapper.getAllKeys).toBe('function');
    expect(typeof mapper.getKeySet).toBe('function');
  });
});

