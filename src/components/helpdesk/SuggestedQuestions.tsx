import { Pressable, Text, View } from 'react-native';

import type { HelpDeskIntent, SuggestedQuestion } from '../../constants/helpDesk';
import type { AppLanguage } from '../../types/user';

type SuggestedQuestionsProps = {
  questions: SuggestedQuestion[];
  language: AppLanguage;
  title: string;
  disabled?: boolean;
  onSelect: (intent: HelpDeskIntent, label: string) => void;
};

export function SuggestedQuestions({
  questions,
  language,
  title,
  disabled,
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-muted">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {questions.map(q => {
          const label = q.label[language] ?? q.label.ko;
          return (
            <Pressable
              key={q.id}
              disabled={disabled}
              onPress={() => onSelect(q.id, label)}
              className={`rounded-full border border-brand-primary/30 bg-brand-primary/8 px-3 py-2 active:opacity-80 ${
                disabled ? 'opacity-50' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel={label}>
              <Text className="text-[13px] font-semibold text-brand-primary">{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
