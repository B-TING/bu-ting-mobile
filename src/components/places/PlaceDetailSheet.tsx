import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICON_COLOR_PRIMARY } from '../../constants/icons';
import type { CopyFor } from '../../i18n';
import type { BusanPlace } from '../../types/placeSearch';
import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { PrimaryButton } from '../shared/buttons/PrimaryButton';
import { AppIcon } from '../shared/icons/AppIcon';
import { appModalStyles } from '../shared/modals/appModalStyles';
import { PlaceDetailPanel } from './PlaceDetailPanel';

type Copy = CopyFor<'placeSearch'>;

const DEFAULT_SHEET_RATIO = 0.88;
const MIN_SHEET_RATIO = 0.62;
const MAX_SHEET_RATIO = 0.96;
const SNAP_CLOSE_THRESHOLD = 96;
const HANDLE_AREA_HEIGHT = 28;

type PlaceDetailSheetProps = {
  visible: boolean;
  place: BusanPlace | null;
  detail: PlaceDetailVO | null;
  language: AppLanguage;
  copy: Copy;
  bookmarked?: boolean;
  loading?: boolean;
  onToggleBookmark?: () => void;
  onClose: () => void;
  primaryAction?: { label: string; onPress: () => void } | null;
};

function snapSheetHeight(
  height: number,
  minHeight: number,
  defaultHeight: number,
  maxHeight: number,
): number | null {
  if (height < SNAP_CLOSE_THRESHOLD) {
    return null;
  }

  const clamped = Math.max(minHeight, Math.min(height, maxHeight));
  const candidates = [minHeight, defaultHeight, maxHeight];
  let nearest = defaultHeight;
  let minDist = Math.abs(clamped - defaultHeight);

  for (const candidate of candidates) {
    const dist = Math.abs(clamped - candidate);
    if (dist < minDist) {
      minDist = dist;
      nearest = candidate;
    }
  }

  return nearest;
}

export function PlaceDetailSheet({
  visible,
  place,
  detail,
  language,
  copy,
  bookmarked = false,
  loading = false,
  onToggleBookmark,
  onClose,
  primaryAction = null,
}: PlaceDetailSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxSheetHeight = Math.round(screenHeight * MAX_SHEET_RATIO) - insets.top;
  const defaultSheetHeight = Math.min(
    Math.round(screenHeight * DEFAULT_SHEET_RATIO),
    maxSheetHeight,
  );
  const minSheetHeight = Math.min(
    Math.round(screenHeight * MIN_SHEET_RATIO),
    defaultSheetHeight,
  );

  const [sheetHeight, setSheetHeight] = useState(defaultSheetHeight);
  const sheetHeightRef = useRef(defaultSheetHeight);
  const dragStartHeightRef = useRef(defaultSheetHeight);

  const applySheetHeight = useCallback(
    (height: number) => {
      const clamped = Math.max(0, Math.min(height, maxSheetHeight));
      sheetHeightRef.current = clamped;
      setSheetHeight(clamped);
    },
    [maxSheetHeight],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    applySheetHeight(defaultSheetHeight);
  }, [visible, defaultSheetHeight, applySheetHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          dragStartHeightRef.current = sheetHeightRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          applySheetHeight(dragStartHeightRef.current - gesture.dy);
        },
        onPanResponderRelease: () => {
          const snapped = snapSheetHeight(
            sheetHeightRef.current,
            minSheetHeight,
            defaultSheetHeight,
            maxSheetHeight,
          );
          if (snapped == null) {
            onClose();
            return;
          }
          applySheetHeight(snapped);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [
      applySheetHeight,
      defaultSheetHeight,
      maxSheetHeight,
      minSheetHeight,
      onClose,
    ],
  );

  if (!place || !visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={appModalStyles.overlay}>
        <Pressable
          style={appModalStyles.backdrop}
          onPress={onClose}
          accessibilityLabel={copy.close}
          accessibilityRole="button"
        />

        <View
          style={[
            appModalStyles.sheet,
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel={copy.close}
            style={styles.handleArea}>
            <View style={appModalStyles.handle} />
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={copy.close}
            style={styles.closeBtn}
            hitSlop={8}>
            <AppIcon name="x" size={16} color={ICON_COLOR_PRIMARY} strokeWidth={2.5} />
          </Pressable>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            <PlaceDetailPanel
              place={place}
              detail={detail}
              language={language}
              copy={copy}
              loading={loading}
              bookmarked={bookmarked}
              onToggleBookmark={onToggleBookmark}
              layout="sheetHeader"
            />
          </ScrollView>
          {primaryAction ? (
            <View style={styles.primaryAction}>
              <PrimaryButton
                label={primaryAction.label}
                onPress={primaryAction.onPress}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'relative',
  },
  handleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HANDLE_AREA_HEIGHT,
    paddingBottom: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: HANDLE_AREA_HEIGHT + 8,
    right: 12,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  primaryAction: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
