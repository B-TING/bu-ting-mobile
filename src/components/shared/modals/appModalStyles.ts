import { StyleSheet } from 'react-native';

export const APP_MODAL = {
  backdropColor: 'rgba(0,0,0,0.45)',
  sheetBackground: '#F8FAFC',
  sheetRadius: 24,
  handleColor: '#E2E8F0',
  handleWidth: 40,
  handleHeight: 4,
} as const;

export const appModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: APP_MODAL.backdropColor,
  },
  sheet: {
    zIndex: 2,
    borderTopLeftRadius: APP_MODAL.sheetRadius,
    borderTopRightRadius: APP_MODAL.sheetRadius,
    backgroundColor: APP_MODAL.sheetBackground,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: APP_MODAL.handleWidth,
    height: APP_MODAL.handleHeight,
    borderRadius: APP_MODAL.handleHeight / 2,
    backgroundColor: APP_MODAL.handleColor,
    marginTop: 10,
    marginBottom: 8,
  },
  alertCard: {
    borderRadius: 20,
    backgroundColor: APP_MODAL.sheetBackground,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
});
