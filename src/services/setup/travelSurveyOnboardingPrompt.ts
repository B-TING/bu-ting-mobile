import type { NavigationProp } from '@react-navigation/native';

import type { AppAlertButton } from '../../components/shared/modals/AppAlertModal';
import { getCopyForLanguage } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import type { AppLanguage } from '../../types/user';

type TravelSurveyNavigation = Pick<
  NavigationProp<RootStackParamList>,
  'navigate'
>;

export function showTravelSurveyOnboardingPrompt(
  alert: (options: {
    title: string;
    message?: string;
    buttons?: AppAlertButton[];
  }) => void,
  navigation: TravelSurveyNavigation,
  language: AppLanguage,
): void {
  const copy = getCopyForLanguage('setup', language);
  alert({
    title: copy.travelSurveyPromptTitle,
    message: copy.travelSurveyPromptMessage,
    buttons: [
      {
        label: copy.travelSurveyPromptLater,
        variant: 'secondary',
        onPress: () => {},
      },
      {
        label: copy.travelSurveyPromptStart,
        variant: 'primary',
        onPress: () => navigation.navigate('Onboarding', { mode: 'account' }),
      },
    ],
  });
}
