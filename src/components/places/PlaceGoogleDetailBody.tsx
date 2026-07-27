import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { PlaceDetailVO } from '../../types/googlePlaces';
import type { AppLanguage } from '../../types/user';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import { formatTourismInfoRows } from '../../utils/places/tourismDetailFormatter';
import { GoogleReviewCard } from './GoogleReviewCard';

export type PlaceGoogleDetailCopy = {
  detailLoading: string;
  notFound: string;
  addressLabel: string;
  phoneLabel: string;
  hoursLabel: string;
  openNow: string;
  closedNow: string;
  reviewsTitle: string;
  reviewsSource: string;
  priceLevelLabel?: string;
  priceLevel?: (level: number) => string;
  detailSectionInfo?: string;
  detailSectionFacility?: string;
  detailSectionReviews?: string;
  detailSectionEmpty?: string;
  detailSectionEvent?: string;
};

type PlaceGoogleDetailBodyProps = {
  detail: PlaceDetailVO | null;
  loading: boolean;
  fallbackAddress?: string;
  copy: PlaceGoogleDetailCopy;
  showPriceLevel?: boolean;
  language?: AppLanguage;
  contentTypeId?: string;
};

type DetailSectionId = 'info' | 'facility' | 'reviews';

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

function EmptySection({ message }: { message: string }) {
  return (
    <View className="items-center py-8">
      <Text className="text-center text-sm text-brand-muted">{message}</Text>
    </View>
  );
}

function InfoSection({
  detail,
  copy,
  showPriceLevel,
}: {
  detail: PlaceDetailVO;
  copy: PlaceGoogleDetailCopy;
  showPriceLevel: boolean;
}) {
  return (
    <View className="rounded-2xl border border-brand-border bg-brand-surface p-4">
      <DetailRow label={copy.addressLabel} value={detail.formattedAddress} />
      <DetailRow label={copy.phoneLabel} value={detail.phones?.international} />
      {showPriceLevel && detail.priceLevel && copy.priceLevelLabel && copy.priceLevel ? (
        <DetailRow label={copy.priceLevelLabel} value={copy.priceLevel(detail.priceLevel)} />
      ) : null}
      {detail.openingHours ? (
        <View className="mt-3">
          <View className="flex-row items-center">
            <Text className="w-20 text-xs font-bold text-brand-muted">{copy.hoursLabel}</Text>
            <Text
              className={`text-xs font-semibold ${
                detail.openingHours.openNow ? 'text-emerald-600' : 'text-brand-muted'
              }`}>
              {detail.openingHours.openNow ? copy.openNow : copy.closedNow}
            </Text>
          </View>
          {detail.openingHours.weekdayDescriptions.map(line => (
            <Text key={line} className="mt-1 pl-20 text-xs text-brand-muted">
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function FacilitySection({
  rows,
  emptyMessage,
}: {
  rows: NonNullable<PlaceDetailVO['tourismInfoRows']>;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <EmptySection message={emptyMessage} />;
  }

  return (
    <View className="rounded-2xl border border-brand-border bg-brand-surface p-4">
      {rows.map(row => (
        <DetailRow key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
      ))}
    </View>
  );
}

function ReviewsSection({
  detail,
  copy,
  emptyMessage,
}: {
  detail: PlaceDetailVO;
  copy: PlaceGoogleDetailCopy;
  emptyMessage: string;
}) {
  if (detail.reviews.length === 0) {
    return <EmptySection message={emptyMessage} />;
  }

  return (
    <View>
      <Text className="text-sm font-bold text-brand-text">{copy.reviewsTitle}</Text>
      <Text className="mt-0.5 text-[11px] text-brand-muted">{copy.reviewsSource}</Text>
      <View className="mt-2">
        {detail.reviews.map((review, index) => (
          <GoogleReviewCard
            key={review.reviewId ?? `${review.authorName}-${index}`}
            review={review}
          />
        ))}
      </View>
    </View>
  );
}

function DetailPage({
  pageWidth,
  children,
}: {
  pageWidth: number;
  children: ReactNode;
}) {
  return (
    <ScrollView
      style={{ width: pageWidth }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      bounces={false}>
      {children}
    </ScrollView>
  );
}

function PlaceDetailSectionPager({
  detail,
  copy,
  showPriceLevel,
  fallbackAddress,
  language = 'ko',
  contentTypeId,
}: {
  detail: PlaceDetailVO | null;
  copy: PlaceGoogleDetailCopy;
  showPriceLevel: boolean;
  fallbackAddress?: string;
  language?: AppLanguage;
  contentTypeId?: string;
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const pageWidth = screenWidth;
  const pagerHeight = Math.max(200, Math.round(screenHeight * 0.62) - 260);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionLabels = useMemo(
    () => ({
      info: copy.detailSectionInfo ?? '기본 정보',
      facility:
        contentTypeId === PLACE_CONTENT_TYPE.festival
          ? (copy.detailSectionEvent ?? '행사 정보')
          : (copy.detailSectionFacility ?? '시설'),
      reviews: copy.detailSectionReviews ?? '리뷰',
      empty: copy.detailSectionEmpty ?? '표시할 정보가 없어요',
    }),
    [copy, contentTypeId],
  );

  const facilityRows = useMemo(() => {
    if (!detail) {
      return [];
    }
    if (detail.tourismRawDetails && contentTypeId) {
      return formatTourismInfoRows(detail.tourismRawDetails, contentTypeId, language);
    }
    return detail.tourismInfoRows ?? [];
  }, [detail, contentTypeId, language]);

  const sections = useMemo<DetailSectionId[]>(() => ['info', 'facility', 'reviews'], []);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      setActiveIndex(Math.max(0, Math.min(sections.length - 1, index)));
    },
    [pageWidth, sections.length],
  );

  const goToSection = useCallback(
    (index: number) => {
      setActiveIndex(index);
      scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
    },
    [pageWidth],
  );

  if (!detail) {
    return (
      <View className="mt-4 px-5">
        <View className="rounded-2xl border border-brand-border bg-brand-surface p-4">
          <DetailRow label={copy.addressLabel} value={fallbackAddress} />
          <Text className="mt-2 text-xs text-brand-muted">{copy.notFound}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-4">
      <View className="flex-row border-b border-brand-border px-5">
        {sections.map((sectionId, index) => {
          const selected = activeIndex === index;
          return (
            <Pressable
              key={sectionId}
              onPress={() => goToSection(index)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className={`flex-1 items-center border-b-2 py-2.5 ${
                selected ? 'border-brand-primary' : 'border-transparent'
              }`}>
              <Text
                className={`text-xs font-bold ${
                  selected ? 'text-brand-primary' : 'text-brand-muted'
                }`}>
                {sectionLabels[sectionId]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        decelerationRate="fast"
        style={{ height: pagerHeight }}>
        <DetailPage pageWidth={pageWidth}>
          <InfoSection detail={detail} copy={copy} showPriceLevel={showPriceLevel} />
        </DetailPage>
        <DetailPage pageWidth={pageWidth}>
          <FacilitySection rows={facilityRows} emptyMessage={sectionLabels.empty} />
        </DetailPage>
        <DetailPage pageWidth={pageWidth}>
          <ReviewsSection detail={detail} copy={copy} emptyMessage={sectionLabels.empty} />
        </DetailPage>
      </ScrollView>
    </View>
  );
}

export function PlaceGoogleDetailBody({
  detail,
  loading,
  fallbackAddress,
  copy,
  showPriceLevel = false,
  language = 'ko',
  contentTypeId,
}: PlaceGoogleDetailBodyProps) {
  if (loading) {
    return (
      <View className="my-6 items-center">
        <ActivityIndicator size="small" color="#0077B6" />
        <Text className="mt-2 text-xs text-brand-muted">{copy.detailLoading}</Text>
      </View>
    );
  }

  return (
    <PlaceDetailSectionPager
      detail={detail}
      copy={copy}
      showPriceLevel={showPriceLevel}
      fallbackAddress={fallbackAddress}
      language={language}
      contentTypeId={contentTypeId}
    />
  );
}
