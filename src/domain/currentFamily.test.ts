import { resolveCurrentFamily } from './currentFamily';

const families = [{ id: 'f1' }, { id: 'f2' }];
it('keeps a valid preference and defaults invalid or missing selections to the first family', () => {
  expect(resolveCurrentFamily('f2', families)).toBe('f2');
  expect(resolveCurrentFamily(null, families)).toBe('f1');
  expect(resolveCurrentFamily('gone', families)).toBe('f1');
  expect(resolveCurrentFamily('f1', [])).toBeNull();
});
