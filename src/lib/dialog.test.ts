import {
  dismissActiveDialog,
  enqueueDialog,
  getActiveDialog,
  resolveActiveDialog,
  subscribeDialog,
} from './dialog';

function drain() {
  while (getActiveDialog()) dismissActiveDialog();
}

afterEach(drain);

describe('dialog controller', () => {
  it('fills in shared defaults for an enqueued dialog', () => {
    const pending = enqueueDialog<void>({ kind: 'message', title: '提示' });
    const request = getActiveDialog();

    expect(request?.title).toBe('提示');
    expect(request?.confirmText).toBe('知道了');
    expect(request?.cancelText).toBe('取消');
    expect(request?.destructive).toBe(false);
    expect(request?.minuteStep).toBe(5);
    expect(request?.initialDate).toBeUndefined();
    expect(typeof request?.id).toBe('number');

    dismissActiveDialog();
    return pending;
  });

  it('queues dialogs in order and resolves each promise', async () => {
    const first = enqueueDialog<boolean>({ kind: 'confirm', title: '第一个' });
    const second = enqueueDialog<boolean>({ kind: 'confirm', title: '第二个' });

    expect(getActiveDialog()?.title).toBe('第一个');
    const firstId = getActiveDialog()?.id ?? -1;
    resolveActiveDialog(firstId, true);
    expect(await first).toBe(true);
    expect(getActiveDialog()?.title).toBe('第二个');

    resolveActiveDialog(getActiveDialog()?.id ?? -1, false);
    expect(await second).toBe(false);
    expect(getActiveDialog()).toBeNull();
  });

  it('ignores a stale id so a late callback cannot close a newer dialog', async () => {
    const stale = enqueueDialog<void>({ kind: 'message', title: '旧的' });
    const staleId = getActiveDialog()?.id ?? -1;
    dismissActiveDialog();
    const current = enqueueDialog<void>({ kind: 'message', title: '新的' });

    resolveActiveDialog(staleId, undefined);

    expect(getActiveDialog()?.title).toBe('新的');
    dismissActiveDialog();
    await Promise.all([stale, current]);
  });

  it('uses a kind-specific fallback when dismissed', async () => {
    const message = enqueueDialog<void>({ kind: 'message', title: '消息' });
    dismissActiveDialog();
    expect(await message).toBeUndefined();

    const confirm = enqueueDialog<boolean>({ kind: 'confirm', title: '确认' });
    dismissActiveDialog();
    expect(await confirm).toBe(false);

    const date = enqueueDialog<Date | null>({ kind: 'date', title: '日期' });
    dismissActiveDialog();
    expect(await date).toBeNull();

    const time = enqueueDialog<{ hour: number } | null>({ kind: 'time', title: '时间' });
    dismissActiveDialog();
    expect(await time).toBeNull();
  });

  it('notifies subscribers and stops after unsubscribing', () => {
    const seen: Array<string | null> = [];
    const unsubscribe = subscribeDialog((request) => seen.push(request?.title ?? null));
    const pending = enqueueDialog<void>({ kind: 'message', title: '订阅测试' });

    expect(seen).toEqual([null, '订阅测试']);
    unsubscribe();
    dismissActiveDialog();
    expect(seen).toEqual([null, '订阅测试']);

    return pending;
  });
});
