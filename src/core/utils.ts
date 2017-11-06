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
