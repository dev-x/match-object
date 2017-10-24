# Match Object

## example

```
const objectMatch = require('match-object');

const anObject = {
  name: "John",
  age: 20,
  shipping_address: {
    country: "US"
  }
};

const comparisons = [
  {
    attribute: 'name',
    comparison: 'contains',
    value: 'oh'
  },
  {
    attribute: 'age',
    comparison: 'gt',
    value: 18
  },
  {
    attribute: 'shipping_address.country',
    comparison: 'eq',
    value: 'US'
  }
];


console.log(objectMatch.check(anObject, comparisons));
```