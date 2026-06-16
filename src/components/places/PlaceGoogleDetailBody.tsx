import { ActivityIndicator, Text, View } from 'react-native';

import type { PlaceDetailVO } from '../../types/googlePlaces';
import { GoogleReviewCard } from '../accommodation/GoogleReviewCard';

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
};

type PlaceGoogleDetailBodyProps = {
  detail: PlaceDetailVO | null;
  loading: boolean;
  fallbackAddress?: string;
  copy: PlaceGoogleDetailCopy;
  showPriceLevel?: boolean;
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

export function PlaceGoogleDetailBody({
  detail,
  loading,
  fallbackAddress,
  copy,
  showPriceLevel = false,
}: PlaceGoogleDetailBodyProps) {
  if (loading) {
    return (
      <View className="my-6 items-center">
        <ActivityIndicator size="small" color="#0077B6" />
        <Text className="mt-2 text-xs text-brand-muted">{copy.detailLoading}</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
        <DetailRow label={copy.addressLabel} value={fallbackAddress} />
        <Text className="mt-2 text-xs text-brand-muted">{copy.notFound}</Text>
      </View>
    );
  }

  return (
    <>
      {detail.editorialSummary ? (
        <Text className="mt-3 text-sm leading-5 text-brand-text">{detail.editorialSummary}</Text>
      ) : null}

      <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">
        <DetailRow label={copy.addressLabel} value={detail.formattedAddress} />
        <DetailRow label={copy.phoneLabel} value={detail.phones?.international} />
        {showPriceLevel && detail.priceLevel && copy.priceLevelLabel && copy.priceLevel ? (
          <DetailRow
            label={copy.priceLevelLabel}
            value={copy.priceLevel(detail.priceLevel)}
          />
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

      {detail.reviews.length > 0 ? (
        <View className="mt-4">
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
      ) : null}
    </>
  );
}
