import { toCamelCase, toSnakeCase } from './utils/caseUtils.js';

const testObj = {
  first_name: 'John',
  last_name: 'Doe',
  deep_obj: {
    nested_key: 'value'
  },
  array_items: [
    { item_id: 1 },
    { item_id: 2 }
  ]
};

console.log('Original:', JSON.stringify(testObj, null, 2));
const camel = toCamelCase(testObj as never); // Test util only
console.log('Camel:', JSON.stringify(camel, null, 2));

const snake = toSnakeCase(camel);
console.log('Snake:', JSON.stringify(snake, null, 2));
