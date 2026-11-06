import { useEffect, useMemo, useState } from 'react';

import { formatCalendarDay, startOfDay } from '@/domain/calendar';
import { DEFAULT_TIME, formatTime, normalizeTime, type TimeValue } from '@/domain/time';
import {
  dismissActiveDialog,
  getActiveDialog,
  resolveActiveDialog,
  subscribeDialog,
  type DialogRequest,
} from '@/lib/dialog';
import type { IconName, TintName } from '@/theme';
import { DatePicker } from './DatePicker';
import { DialogSheet, type DialogAction } from './DialogSheet';
import { TimePicker } from './TimePicker';

interface Appearance {
  icon: IconName;
  tint: TintName;
}

function appearanceFor(request: DialogRequest): Appearance {
  switch (request.kind) {
    case 'confirm':
      return request.destructive
        ? { icon: 'warning-outline', tint: 'rose' }
        : { icon: 'help-circle-outline', tint: 'mint' };
    case 'date':
      return { icon: 'calendar-outline', tint: 'blue' };
    case 'time':
      return { icon: 'time-outline', tint: 'violet' };
    default:
      return { icon: 'information-circle-outline', tint: 'mint' };
  }
}

function resultFor(request: DialogRequest, date: Date, time: TimeValue): unknown {
  switch (request.kind) {
    case 'confirm':
      return true;
    case 'date':
      return date;
    case 'time':
      return time;
    default:
      return undefined;
  }
}

function useActiveDialog(): DialogRequest | null {
  const [request, setRequest] = useState<DialogRequest | null>(getActiveDialog);
  useEffect(() => subscribeDialog(setRequest), []);
  return request;
}

/** 每次弹窗用独立会话持有草稿值，切换请求时不会串用上一次的选择。 */
function DialogSession({ request }: { request: DialogRequest }) {
  const [date, setDate] = useState(() => startOfDay(request.initialDate ?? new Date()));
  const [time, setTime] = useState(() => normalizeTime(request.initialTime ?? DEFAULT_TIME));
  const today = useMemo(() => startOfDay(new Date()), []);
  const appearance = appearanceFor(request);

  const message =
    request.kind === 'date'
      ? `已选 ${formatCalendarDay(date)}`
      : request.kind === 'time'
        ? `已选 ${formatTime(time)}`
        : request.message;

  const actions: DialogAction[] = [];
  if (request.kind !== 'message') {
    actions.push({ label: request.cancelText, variant: 'ghost', onPress: dismissActiveDialog });
  }
  actions.push({
    label: request.confirmText,
    variant: request.destructive ? 'danger' : 'primary',
    onPress: () => resolveActiveDialog(request.id, resultFor(request, date, time)),
  });

  return (
    <DialogSheet
      visible
      title={request.title}
      message={message}
      icon={appearance.icon}
      tint={appearance.tint}
      onDismiss={dismissActiveDialog}
      actions={actions}
    >
      {request.kind === 'date' ? (
        <DatePicker
          value={date}
          onChange={setDate}
          minDate={request.minDate}
          maxDate={request.maxDate}
          today={today}
        />
      ) : null}
      {request.kind === 'time' ? (
        <TimePicker value={time} onChange={setTime} minuteStep={request.minuteStep} />
      ) : null}
    </DialogSheet>
  );
}

/** 挂在应用根节点，业务侧只通过 alert / picker 的 Promise API 发起弹窗。 */
export function DialogHost() {
  const request = useActiveDialog();
  if (!request) return null;
  return <DialogSession key={request.id} request={request} />;
}
