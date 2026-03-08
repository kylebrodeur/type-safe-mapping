import { describe, expect, expectTypeOf, it } from 'vitest';

import { MappedServiceBase } from '../src/MappedServiceBase';
import { MappedType } from '../src/types';

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

  describe('dynamicMapping option', () => {
    it('map() passes through unmapped fields when dynamicMapping is true', () => {
      const result = mapper.map(
        { custom_a: true, custom_b: 'B2B', other_field: 'dynamic_value' },
        { dynamicMapping: true },
      );

      expect(result).toEqual({
        isEnterprise: true,
        commerceType: 'B2B',
        other_field: 'dynamic_value',
      });
    });

    it('map() does not include unmapped fields by default', () => {
      const result = mapper.map({ custom_a: true, custom_b: 'B2B', other_field: 'dynamic_value' });

      expect(result).toEqual({ isEnterprise: true, commerceType: 'B2B' });
      expect('other_field' in result).toBe(false);
    });

    it('map() with dynamicMapping skips undefined unmapped fields', () => {
      const result = mapper.map(
        { custom_a: true, custom_b: 'B2B', other_field: undefined },
        { dynamicMapping: true },
      );

      expect(result).toEqual({ isEnterprise: true, commerceType: 'B2B' });
      expect('other_field' in result).toBe(false);
    });

    it('map() with dynamicMapping returns Record<string, unknown> intersection type', () => {
      const result = mapper.map(
        { custom_a: true, custom_b: 'B2B', other_field: 'dynamic_value' },
        { dynamicMapping: true },
      );

      expectTypeOf(result).toMatchTypeOf<{ isEnterprise: boolean; commerceType: string }>();
      expectTypeOf(result).toMatchTypeOf<Record<string, unknown>>();
    });

    it('map() without dynamicMapping returns plain MappedType', () => {
      const result = mapper.map({ custom_a: true, custom_b: 'B2B' });

      expectTypeOf(result).toEqualTypeOf<Domain>();
    });

    it('reverseMap() passes through unmapped fields when dynamicMapping is true', () => {
      const result = mapper.reverseMap(
        { isEnterprise: false, commerceType: 'B2C', extra_info: 42 },
        { dynamicMapping: true },
      );

      expect(result).toEqual({ custom_a: false, custom_b: 'B2C', extra_info: 42 });
    });

    it('reverseMap() does not include unmapped fields by default', () => {
      const result = mapper.reverseMap({ isEnterprise: false, commerceType: 'B2C', extra_info: 42 });

      expect(result).toEqual({ custom_a: false, custom_b: 'B2C' });
      expect('extra_info' in result).toBe(false);
    });

    it('reverseMap() with dynamicMapping skips undefined unmapped fields', () => {
      const result = mapper.reverseMap(
        { isEnterprise: true, commerceType: 'B2B', extra_info: undefined },
        { dynamicMapping: true },
      );

      expect(result).toEqual({ custom_a: true, custom_b: 'B2B' });
      expect('extra_info' in result).toBe(false);
    });

    it('reverseMap() with dynamicMapping returns Partial<TSource> & Record<string, unknown> type', () => {
      const result = mapper.reverseMap(
        { isEnterprise: false, commerceType: 'B2C', extra_info: 42 },
        { dynamicMapping: true },
      );

      expectTypeOf(result).toMatchTypeOf<Partial<ApiRow>>();
      expectTypeOf(result).toMatchTypeOf<Record<string, unknown>>();
    });
  });
});

