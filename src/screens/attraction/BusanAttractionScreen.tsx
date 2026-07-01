import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';

type Props = NativeStackScreenProps<RootStackParamList, 'BusanAttraction'>;

/** @deprecated PlaceMapSearch로 리다이렉트 */
export function BusanAttractionScreen({ navigation }: Props) {
  useEffect(() => {
    navigation.replace('PlaceMapSearch', { contentTypeId: PLACE_CONTENT_TYPE.attraction });
  }, [navigation]);

  return null;
}
