import { confirmAction, showMessage } from './alert';
import { dismissActiveDialog, getActiveDialog, resolveActiveDialog } from './dialog';

afterEach(() => {
  while (getActiveDialog()) dismissActiveDialog();
});

describe('alert facade', () => {
  it('routes a confirmation through the shared dialog queue', async () => {
    const pending = confirmAction({
      title: '退出登录？',
      message: '本机登录状态会被清除。',
      confirmText: '退出',
      destructive: true,
    });
    const request = getActiveDialog();

    expect(request?.kind).toBe('confirm');
    expect(request?.title).toBe('退出登录？');
    expect(request?.message).toBe('本机登录状态会被清除。');
    expect(request?.confirmText).toBe('退出');
    expect(request?.cancelText).toBe('取消');
    expect(request?.destructive).toBe(true);

    resolveActiveDialog(request?.id ?? -1, true);
    expect(await pending).toBe(true);
  });

  it('applies safe defaults for a normal confirmation', async () => {
    const pending = confirmAction({ title: '保存？' });
    const request = getActiveDialog();

    expect(request?.confirmText).toBe('确定');
    expect(request?.destructive).toBe(false);

    dismissActiveDialog();
    expect(await pending).toBe(false);
  });

  it('routes a message with a friendly default action label', async () => {
    const pending = showMessage('还在路上', '这个入口会在后续版本开放。');
    const request = getActiveDialog();

    expect(request?.kind).toBe('message');
    expect(request?.title).toBe('还在路上');
    expect(request?.message).toBe('这个入口会在后续版本开放。');
    expect(request?.confirmText).toBe('知道了');

    resolveActiveDialog(request?.id ?? -1, undefined);
    await expect(pending).resolves.toBeUndefined();
  });

  it('allows a message to override its action label', () => {
    const pending = showMessage('完成', undefined, { confirmText: '好的' });

    expect(getActiveDialog()?.confirmText).toBe('好的');
    dismissActiveDialog();
    return pending;
  });
});
