/**
 * Supabase 测试替身：避免单元测试创建真实客户端或读取环境变量。
 * 需要断言请求时，在具体测试里对相应方法做 jest.spyOn。
 */
export const supabase = {
  auth: {
    getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(),
};
