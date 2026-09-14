import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/types';

type EventAuthNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'EventGameCamera' | 'EventGameMukjjippa' | 'EventGameDetail'
>;

/**
 * 인증 플로우(Detail/Camera)를 스택에서 걷어내고 EventZone을 top으로 둔다.
 * EventZone이 스택에 없으면 navigate fallback.
 */
export function leaveEventAuthFlowToZone(navigation: EventAuthNavigation): void {
  const hasEventZone = navigation
    .getState()
    .routes.some(route => route.name === 'EventZone');
  if (hasEventZone) {
    navigation.popTo('EventZone');
    return;
  }
  navigation.navigate('EventZone');
}
