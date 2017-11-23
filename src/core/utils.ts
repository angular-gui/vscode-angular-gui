export { camelize, classify, dasherize, terminal } from '@angular-devkit/core';

export function sort(direction: 'asc' | 'desc', transform = o => o) {
  return (a, b) => {
    a = transform(a);
    b = transform(b);

    const A = isNaN(+a)
      ? a
      : +a;
    const B = isNaN(+b)
      ? b
      : +b;
    const r = (A < B ? -1 : 1) * (direction.toLowerCase() === 'asc' ? 1 : -1);
    return r;
  };
}

export function type(o) {
  return {
    ...o,
    type:
      typeof o.type === 'function'
        ? o.type.name.toLowerCase()
        : o.type.toLowerCase()
  };
}

export function omitBy<T>(source: T, filter: (o: T, ...rest) => boolean): T {
  return Object.entries(source)
    .filter(([ key, value ]) => !filter(value, key))
    .reduce((dict, [ key, value ]) =>
      ({ ...dict, [ key ]: value }), {} as any);
}

export function uniqueFn<T>(value: T, index: number, array: T[]) {
  return value && array.indexOf(value) === index;
}
