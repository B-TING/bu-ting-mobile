import { useMemo } from 'react';

import { Pressable, Text, View } from 'react-native';



import { useCopy, type CopyFor } from '../../../i18n';

import { useCachedRoutePlaceDetail } from '../../../hooks/useCachedRoutePlaceDetail';

import type { PlaceReview } from '../../../types/travelReview';

import type { RouteItem } from '../../../types/travelPlan';

import type { AppLanguage } from '../../../types/user';

import { routeItemToBusanPlaceFallback } from '../../../utils/places/placeModelBridge';

import { shouldFetchRoutePlaceDetail } from '../../../utils/places/routePlaceDetail';

import { PlaceDetailPanel } from '../../places/PlaceDetailPanel';

import { StarRating } from '../../shared/rating/StarRating';



type Copy = CopyFor<'planDetail'>;



type ScheduleRouteDetailPanelProps = {

  route: RouteItem;

  language: AppLanguage;

  copy: Copy;

  placeReview?: PlaceReview;

  onToggleVisited: () => void;

  onWriteReview?: () => void;

};



export function ScheduleRouteDetailPanel({

  route,

  language,

  copy,

  placeReview,

  onToggleVisited,

  onWriteReview,

}: ScheduleRouteDetailPanelProps) {

  const searchCopy = useCopy('placeSearch');

  const showPlaceSearchDetail = shouldFetchRoutePlaceDetail(route.type);

  const { detail, loading: loadingDetail } = useCachedRoutePlaceDetail(route, showPlaceSearchDetail);



  const busanPlace = useMemo(() => routeItemToBusanPlaceFallback(route), [route]);

  const info = route.placeInfo;



  const scheduleActions = (

    <View className="px-5">

      <View className="mt-3 flex-row flex-wrap gap-2">

        <Pressable

          onPress={onToggleVisited}

          className="rounded-full bg-brand-selected px-3 py-2 active:opacity-80">

          <Text className="text-sm font-semibold text-brand-primary">

            {route.isVisited ? copy.visited : copy.markVisited}

          </Text>

        </Pressable>

        {onWriteReview && copy.writeReview ? (

          <Pressable

            onPress={route.isVisited ? onWriteReview : undefined}

            disabled={!route.isVisited}

            className={`rounded-full px-3 py-2 ${

              route.isVisited ? 'bg-brand-primary active:opacity-80' : 'bg-brand-border opacity-60'

            }`}>

            <Text

              className={`text-sm font-semibold ${

                route.isVisited ? 'text-white' : 'text-brand-muted'

              }`}>

              {placeReview ? (copy.editReview ?? copy.writeReview) : copy.writeReview}

            </Text>

          </Pressable>

        ) : null}

      </View>



      {placeReview ? (

        <View className="mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">

          <Text className="mb-2 text-xs font-bold text-brand-muted">

            {language === 'ko' ? '내 후기' : 'My review'}

          </Text>

          <StarRating value={placeReview.rating} readonly size="sm" />

          {placeReview.comment ? (

            <Text className="mt-2 text-sm text-brand-text">{placeReview.comment}</Text>

          ) : null}

        </View>

      ) : route.isVisited && copy.visitFirstReview && onWriteReview ? (

        <Text className="mt-2 text-xs text-brand-muted">{copy.visitFirstReview}</Text>

      ) : null}

    </View>

  );



  if (showPlaceSearchDetail) {

    return (

      <PlaceDetailPanel

        place={busanPlace}

        detail={detail}

        language={language}

        copy={searchCopy}

        loading={loadingDetail}

        footerExtra={scheduleActions}

      />

    );

  }



  if (info) {

    return (

      <View>

        {scheduleActions}

        <View className="mx-5 mt-4 rounded-2xl border border-brand-border bg-brand-surface p-4">

          <Text className="mb-2 text-sm leading-5 text-brand-text">{info.description}</Text>

          {info.dwellMinutes ? (

            <Text className="mb-1 text-xs text-brand-muted">{copy.dwell(info.dwellMinutes)}</Text>

          ) : null}

          <Text className="text-xs text-brand-muted">{info.hours}</Text>

          <Text className="mt-1 text-xs text-brand-muted">{info.address}</Text>

        </View>

      </View>

    );

  }



  return (

    <View>

      {scheduleActions}

    </View>

  );

}


