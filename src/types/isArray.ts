export const isArray = <T>(value: T | readonly T[]): value is readonly T[] =>
  Array.isArray(value)
