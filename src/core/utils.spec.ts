import * as utils from './utils';

describe(`sort(direction: 'asc' | 'desc', transform = o => o)`, () => {
  it('should sort an array of strings in ascending order', () => {
    const array = [ 'a', 'c', 'b' ];
    expect(array.sort(utils.sort('asc'))).toEqual([ 'a', 'b', 'c' ]);
  });
  it('should sort an array of strings in descending order', () => {
    const array = [ 'a', 'c', 'b' ];
    expect(array.sort(utils.sort('desc'))).toEqual([ 'c', 'b', 'a' ]);
  });
  it('should sort an array of numbers in ascending order', () => {
    const array = [ 1, 3, 2 ];
    expect(array.sort(utils.sort('asc'))).toEqual([ 1, 2, 3 ]);
  });
  it('should sort an array of numbers in descending order', () => {
    const array = [ 1, 3, 2 ];
    expect(array.sort(utils.sort('desc'))).toEqual([ 3, 2, 1 ]);
  });
  it('should sort an array of objects by "$key" in ascending order', () => {
    const array = [ { $key: 1 }, { $key: 3 }, { $key: 2 }];
    expect(array.sort(utils.sort('asc', o => o.$key))).toEqual([
      { $key: 1 },
      { $key: 2 },
      { $key: 3 }
    ]);
  });
  it('should not sort an array of objects, when property is falsy', () => {
    const array = [ { $key: 1 }, { $key: 3 }, { $key: 2 }];
    expect(array.sort(utils.sort('desc', o => o.a))).toEqual(array);
  });
  it('should sort an array of objects by property in descending order', () => {
    const array = [ { $key: 1, a: 2 }, { $key: 3, a: 1 }, { $key: 2, a: 3 }];
    expect(array.sort(utils.sort('desc', o => o.a))).toEqual([
      { $key: 2, a: 3 },
      { $key: 1, a: 2 },
      { $key: 3, a: 1 }
    ]);
  });
});

describe('type', () => {
  it('should transform type property to string', () => {
    expect(utils.type({ type: String })).toEqual({ type: 'string' });
    expect(utils.type({ type: Number })).toEqual({ type: 'number' });
    expect(utils.type({ type: 'Path' })).toEqual({ type: 'path' });
    expect(utils.type({ type: Boolean })).toEqual({ type: 'boolean' });
  });
});

describe('omitBy<T>(source: T, filter: (value: any, key: string) => boolean)', () => {
  const obj = { a: 1, b: 2 };
  it('should return input if it is null or not an object', () => {
    expect(utils.omitBy(null, null)).toBe(null);
    expect(utils.omitBy(123, null)).toBe(123);
    expect(utils.omitBy('abc', null)).toBe('abc');
  });
  it('should return new object without matched keys for value filter', () => {
    expect(utils.omitBy(obj, (value, key) => value === 1)).toEqual({ b: 2 });
  });
  it('should return new object without matched keys for key filter', () => {
    expect(utils.omitBy(obj, (value, key) => key === 'b')).toEqual({ a: 1 });
  });
});

describe('uniqueFn<T>(value: T, index: number, array: T[])', () => {
  it('should filter duplicates in array', () => {
    const array = [ 1, 2, 3, 2, 1 ];
    expect(array.filter(utils.uniqueFn)).toEqual([ 1, 2, 3 ]);
  });
});