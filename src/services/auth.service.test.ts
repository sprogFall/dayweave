import { supabase } from '@/lib/supabase';
import { signUp } from './auth.service';

describe('shared auth registration', () => {
  it('sends the nickname understood by the shared profiles trigger', async () => {
    jest.mocked(supabase.auth.signUp).mockResolvedValue({ data: { session: null, user: null }, error: null });
    expect(await signUp('  小明  ', ' test@example.com ', 'password')).toBe(false);
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password', options: { data: { nickname: '小明' } } });
  });
});
