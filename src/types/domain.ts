export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
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
