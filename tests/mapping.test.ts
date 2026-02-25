import { describe, expect, expectTypeOf, it } from 'vitest';

import { MappedServiceBase } from '../src/MappedServiceBase';
import { MappedType } from '../src/types';

interface ApiRow {
  custom_a: boolean;
  custom_b: string;
  optional_c?: number;
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
});
