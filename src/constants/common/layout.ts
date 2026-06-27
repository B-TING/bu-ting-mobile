/** NativeWind 미적용 시에도 화면이 보이도록 하는 레이아웃 fallback */
export const layout = {
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenPad24: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
  },
} as const;
