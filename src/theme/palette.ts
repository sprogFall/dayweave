export interface Colors {
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  accent: string;
  danger: string;
  dangerSoft: string;
  onPrimary: string;
}

export const LIGHT_COLORS: Colors = {
  bg: '#F6F3ED',
  card: '#FFFEFA',
  text: '#1F2A24',
  muted: '#69766E',
  border: '#E4DED3',
  primary: '#3F6B57',
  primarySoft: '#DDEAE2',
  accent: '#C97345',
  danger: '#B74335',
  dangerSoft: '#F8E5E1',
  onPrimary: '#FFFFFF',
};

export const DARK_COLORS: Colors = {
  bg: '#111714',
  card: '#1A211D',
  text: '#F2F4F0',
  muted: '#A4AFA8',
  border: '#2D3932',
  primary: '#8DC7A8',
  primarySoft: '#243B30',
  accent: '#E6A77C',
  danger: '#F08A7A',
  dangerSoft: '#3A2420',
  onPrimary: '#102018',
};
