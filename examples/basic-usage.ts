/**
 * Example: API to Domain Model Mapping
 * 
 * This example shows how to map between an API response (snake_case)
 * and a domain model (camelCase) with full type safety.
 */

import { MappedServiceBase, MappedType } from '../src';

// 1. Define your API response type
interface ApiOrderResponse {
  order_id: string;
  customer_name: string;
  order_total: number;
  is_paid: boolean;
  shipping_address?: string;
  [key: string]: unknown;
}

// 2. Define your field mapping
const orderMapping = {
  order_id: 'id',
  customer_name: 'customerName',
  order_total: 'total',
  is_paid: 'paid',
  shipping_address: 'shippingAddress',
} as const;

// 3. Infer the domain type (or define it explicitly if you prefer)
type Order = MappedType<ApiOrderResponse, typeof orderMapping>;
// Result:
// {
//   id: string;
//   customerName: string;
//   total: number;
//   paid: boolean;
//   shippingAddress?: string;
// }

// 4. Create your mapper service
class OrderMapper extends MappedServiceBase<ApiOrderResponse, typeof orderMapping> {
  protected fieldMapping = orderMapping;
}

// 5. Use it!
const mapper = new OrderMapper();

// Transform API response to domain model
const apiResponse: Partial<ApiOrderResponse> = {
  order_id: 'ORD-12345',
  customer_name: 'John Doe',
  order_total: 99.99,
  is_paid: true,
};

const order = mapper.map(apiResponse);
console.log('Domain Order:', order);
// Output: { id: 'ORD-12345', customerName: 'John Doe', total: 99.99, paid: true }

// Transform domain model back to API format
const domainOrder: Partial<Order> = {
  id: 'ORD-67890',
  customerName: 'Jane Smith',
  total: 149.99,
  paid: false,
  shippingAddress: '123 Main St',
};

const apiFormat = mapper.reverseMap(domainOrder);
console.log('API Format:', apiFormat);
// Output: { order_id: 'ORD-67890', customer_name: 'Jane Smith', order_total: 149.99, is_paid: false, shipping_address: '123 Main St' }

// Type safety in action!
// The following would cause TypeScript errors:

// ❌ TypeScript error: Property 'invalidField' does not exist
// const invalid = mapper.map({ invalidField: 'test' });

// ❌ TypeScript error: Type 'number' is not assignable to type 'boolean'
// mapper.reverseMap({ paid: 123 });
