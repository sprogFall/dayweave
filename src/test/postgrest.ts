/**
 * Supabase PostgREST 链式查询替身：中间方法返回自身，
 * 终结方法（returns / single / await）返回结果。
 */
export interface QueryResult {
  data?: unknown;
  error?: unknown;
}

export type QueryMethod =
  | 'select'
  | 'eq'
  | 'gte'
  | 'lte'
  | 'order'
  | 'insert'
  | 'update'
  | 'upsert'
  | 'delete';

export interface QueryMock extends Record<QueryMethod, jest.Mock> {
  returns: jest.Mock;
  single: jest.Mock;
  then: (onFulfilled: (value: QueryResult) => unknown) => Promise<unknown>;
}

const METHODS: readonly QueryMethod[] = [
  'select',
  'eq',
  'gte',
  'lte',
  'order',
  'insert',
  'update',
  'upsert',
  'delete',
];

export function queryBuilder(result: QueryResult): QueryMock {
  const builder = {
    returns: jest.fn(async () => result),
    single: jest.fn(async () => result),
    then: (onFulfilled: (value: QueryResult) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
  } as unknown as QueryMock;

  METHODS.forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });

  return builder;
}
