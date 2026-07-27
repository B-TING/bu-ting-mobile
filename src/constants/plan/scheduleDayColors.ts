export type ScheduleDayColor = {
  main: string;
  light: string;
  border: string;
};

const DAY_PALETTE: ScheduleDayColor[] = [
  { main: '#0077B6', light: '#E8F6FC', border: '#90E0EF' },
  { main: '#E85D04', light: '#FFF4ED', border: '#FDBA74' },
  { main: '#7B2CBF', light: '#F5EEFF', border: '#C4B5FD' },
  { main: '#2D6A4F', light: '#EDF7F1', border: '#86EFAC' },
  { main: '#D00000', light: '#FEF2F2', border: '#FCA5A5' },
  { main: '#CA8A04', light: '#FFFBEB', border: '#FDE047' },
  { main: '#0891B2', light: '#ECFEFF', border: '#67E8F9' },
  { main: '#BE185D', light: '#FDF2F8', border: '#F9A8D4' },
];

export function getScheduleDayColor(dayNumber: number): ScheduleDayColor {
  const index = (Math.max(1, dayNumber) - 1) % DAY_PALETTE.length;
  return DAY_PALETTE[index];
}
