import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import { upcomingFestivalDateRangeYyyymmdd } from '../../utils/places/festivalApiMapper';

type Props = NativeStackScreenProps<RootStackParamList, 'FestivalDetail'>;

/** @deprecated PlaceMapSearch로 리다이렉트 */
export function FestivalDetailScreen({ navigation, route }: Props) {
  useEffect(() => {
    const { eventStartDate, eventEndDate } = upcomingFestivalDateRangeYyyymmdd();
    navigation.replace('PlaceMapSearch', {
      contentTypeId: PLACE_CONTENT_TYPE.festival,
      selectedContentId: route.params.festivalId,
      festivalEventStartDate: eventStartDate,
      festivalEventEndDate: eventEndDate,
    });
  }, [navigation, route.params.festivalId]);

  return null;
}
