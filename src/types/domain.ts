export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface FamilyMember {
  familyId: string;
  userId: string;
  role: 'owner' | 'member';
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
}

export type WorkTaskStatus = 'open' | 'done';

/** 工时任务：预计工时与时间范围用于估算投入，状态只有进行中 / 已完成。 */
export interface WorkTask {
  id: string;
  title: string;
  description: string;
  /** 预计工时，分钟；0 表示未估。 */
  estimatedMinutes: number;
  /** 起止日期均为本地自然日，格式 YYYY-MM-DD。 */
  startDate: string;
  dueDate: string;
  status: WorkTaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 挂在任务下的工时记录；date 为归属的本地自然日。 */
export interface WorkLog {
  id: string;
  taskId: string;
  content: string;
  minutes: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** GitHub 最新正式版的可安装信息。 */
export interface AppRelease {
  tagName: string;
  version: string;
  title: string;
  notes: string;
  pageUrl: string;
  apkUrl: string;
  apkSize: number | null;
  mirrors: string[];
  publishedAt: string | null;
}
