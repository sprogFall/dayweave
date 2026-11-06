import type { TimeValue } from '@/domain/time';
import { enqueueDialog } from '@/lib/dialog';

export interface DatePickerOptions {
  title?: string;
  initial?: Date;
  min?: Date;
  max?: Date;
  confirmText?: string;
  cancelText?: string;
}

export interface TimePickerOptions {
  title?: string;
  initial?: TimeValue;
  minuteStep?: number;
  confirmText?: string;
  cancelText?: string;
}

/** 返回 null 表示用户取消；日历完全由应用内组件绘制，不使用平台原生日期选择器。 */
export function pickDate(options: DatePickerOptions = {}): Promise<Date | null> {
  return enqueueDialog<Date | null>({
    kind: 'date',
    title: options.title ?? '选择日期',
    initialDate: options.initial,
    minDate: options.min,
    maxDate: options.max,
    confirmText: options.confirmText,
    cancelText: options.cancelText,
  });
}

/** 返回 null 表示用户取消；分钟刻度可按业务调整。 */
export function pickTime(options: TimePickerOptions = {}): Promise<TimeValue | null> {
  return enqueueDialog<TimeValue | null>({
    kind: 'time',
    title: options.title ?? '选择时间',
    initialTime: options.initial,
    minuteStep: options.minuteStep,
    confirmText: options.confirmText,
    cancelText: options.cancelText,
  });
}
