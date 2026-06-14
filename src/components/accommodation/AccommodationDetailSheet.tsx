import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ACCOMMODATION_COPY, localizedAreaName } from '../../constants/accommodation';
import { fetchAccommodationDetail, buildGoogleMapsUrl } from '../../services/googlePlacesService';
import type { BusanAccommodation } from '../../types/accommodation';
import type { AccommodationPlaceDetail } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { GoogleReviewCard } from './GoogleReviewCard';

type Copy = (typeof ACCOMMODATION_COPY)['ko'];

const SHEET_HEIGHT_RATIO = 0.62;

type AccommodationDetailSheetProps = {
  visible: boolean;
  stay: BusanAccommodation | null;
  language: AppLanguage;
  copy: Copy;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }
  return (
    <View className="mt-3 flex-row">
      <Text className="w-20 text-xs font-bold text-brand-muted">{label}</Text>
      <Text className="flex-1 text-sm leading-5 text-brand-text">{value}</Text>
    </View>
  );
}

export function AccommodationDetailSheet({
  visible,
  stay,
  language,
  copy,
  onClose,
}: AccommodationDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.round(screenHeight * SHEET_HEIGHT_RATIO);

  const [detail, setDetail] = useState<AccommodationPlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !stay) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchAccommodationDetail(stay.internalPlaceId)
      .then(result => {
        if (!cancelled) {
          setDetail(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, stay?.internalPlaceId]);

  if (!stay) {
    return null;
  }

  const openGoogleMaps = () => {
    if (detail) {
      Linking.openURL(buildGoogleMapsUrl(detail)).catch(() => {});
      return;
    }
    const query = encodeURIComponent(stay.name);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${stay.googlePlaceId}`,
    ).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.close} />

        <View
          style={[
            styles.sheet,
            {
              maxHeight: sheetMaxHeight,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.handle} />
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-xl font-bold text-brand-text">{stay.name}</Text>
              <View className="rounded-full bg-brand-selected px-2.5 py-1">
                <Text className="text-[10px] font-semibold text-brand-primary">
                  {copy.areaLabel(localizedAreaName(stay, language))}
                </Text>
              </View>
            </View>

            <Text className="mt-1 text-sm font-semibold text-brand-primary">
              {copy.ratingSummary(stay.rating, stay.userRatingsTotal)}
            </Text>

            {loading ? (
              <View className="my-6 items-center">
                <ActivityIndicator size="small" color="#0077B6" />
                <Text className="mt-2 text-xs text-brand-muted">{copy.detailLoading}</Text>
              </View>
            ) : detail ? (
              <>
                {detail.editorialSummary ? (
                  <Text className="mt-3 text-sm leading-5 text-brand-text">
                    {detail.editorialSummary}
                  </Text>
                ) : null}

                <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
                  <DetailRow label={copy.addressLabel} value={detail.formattedAddress} />
                  <DetailRow label={copy.phoneLabel} value={detail.internationalPhoneNumber} />
                  {detail.priceLevel ? (
                    <DetailRow
                      label={copy.priceLevelLabel}
                      value={copy.priceLevel(detail.priceLevel)}
                    />
                  ) : null}
                  {detail.openingHours ? (
                    <View className="mt-3">
                      <View className="flex-row items-center">
                        <Text className="w-20 text-xs font-bold text-brand-muted">
                          {copy.hoursLabel}
                        </Text>
                        <Text
                          className={`text-xs font-semibold ${
                            detail.openingHours.openNow ? 'text-emerald-600' : 'text-brand-muted'
                          }`}>
                          {detail.openingHours.openNow ? copy.openNow : copy.closedNow}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {detail.reviews.length > 0 ? (
                  <View className="mt-4">
                    <Text className="text-sm font-bold text-brand-text">{copy.reviewsTitle}</Text>
                    <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.reviewsSource}</Text>
                    <View className="mt-2">
                      {detail.reviews.map(review => (
                        <GoogleReviewCard
                          key={`${review.authorName}-${review.time}`}
                          review={review}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
                <DetailRow label={copy.addressLabel} value={stay.formattedAddress} />
                <Text className="mt-2 text-xs text-brand-muted">{copy.notFound}</Text>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={openGoogleMaps}
            className="mx-5 mt-2 items-center rounded-2xl border border-brand-primary bg-brand-selected py-3 active:opacity-90">
            <Text className="text-[15px] font-bold text-brand-primary">{copy.openInGoogleMaps}</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            className="mx-5 mt-2 items-center rounded-2xl bg-brand-primary py-3 active:opacity-90">
            <Text className="text-[15px] font-bold text-white">{copy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    zIndex: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
