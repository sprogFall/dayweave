export interface Colors {
  bg: string;
  bgTop: string;
  card: string;
  cardMuted: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  onPrimary: string;
  shadow: string;
  /** 弹窗遮罩，浅色偏墨绿、深色偏纯黑，保持与背景同色系。 */
  backdrop: string;
}

/** 柔和色块与对应前景色，用于工具图标底座、标签与统计卡片。 */
export interface TintSet {
  bg: Record<TintName, string>;
  fg: Record<TintName, string>;
}

export type TintName = 'mint' | 'blue' | 'amber' | 'violet' | 'rose' | 'teal';

export const LIGHT_COLORS: Colors = {
  bg: '#F7FBFA',
  bgTop: '#E8F6EF',
  card: '#FFFFFF',
  cardMuted: '#F3F8F6',
  text: '#16213A',
  muted: '#7A8598',
  faint: '#A7B0BF',
  border: '#EBF1EF',
  primary: '#2CAE73',
  primarySoft: '#E1F5EC',
  accent: '#F5A93B',
  accentSoft: '#FEF0DA',
  danger: '#E4696F',
  dangerSoft: '#FDE9E9',
  onPrimary: '#FFFFFF',
  shadow: '#0F2C22',
  backdrop: 'rgba(12, 35, 27, 0.42)',
};

export const DARK_COLORS: Colors = {
  bg: '#0E1413',
  bgTop: '#14231D',
  card: '#18211F',
  cardMuted: '#1F2A28',
  text: '#F3F6F4',
  muted: '#98A5AF',
  faint: '#6C7A7F',
  border: '#243029',
  primary: '#5ACB95',
  primarySoft: '#1B3A2C',
  accent: '#F2B45C',
  accentSoft: '#3A2C18',
  danger: '#F08289',
  dangerSoft: '#3A2223',
  onPrimary: '#0B1410',
  shadow: '#000000',
  backdrop: 'rgba(0, 0, 0, 0.66)',
};

export const LIGHT_TINTS: TintSet = {
  bg: {
    mint: '#DFF4E8',
    blue: '#E2ECFE',
    amber: '#FEF0DA',
    violet: '#EDE7FE',
    rose: '#FDE7E7',
    teal: '#DDF3F2',
  },
  fg: {
    mint: '#2CAE73',
    blue: '#4C8DF6',
    amber: '#EFA13A',
    violet: '#9375F2',
    rose: '#EC6D6D',
    teal: '#2FAFA8',
  },
};

export const DARK_TINTS: TintSet = {
  bg: {
    mint: '#1C3A2C',
    blue: '#1C2A44',
    amber: '#3A2E18',
    violet: '#2A2340',
    rose: '#3A2226',
    teal: '#123231',
  },
  fg: {
    mint: '#6ED3A2',
    blue: '#7FB0FB',
    amber: '#F0B866',
    violet: '#AE95F7',
    rose: '#F29398',
    teal: '#5FCEC7',
  },
};
