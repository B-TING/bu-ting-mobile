import { StyleSheet, Text, View } from 'react-native';

type ChatMessageBubbleProps = {
  role: 'user' | 'assistant';
  text: string;
};

/** 간단한 **bold** 마크다운 렌더 */
function renderFormattedText(text: string, isUser: boolean) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={[styles.bold, isUser && styles.userBold]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return (
      <Text key={i} style={isUser ? styles.userText : styles.assistantText}>
        {part}
      </Text>
    );
  });
}

export function ChatMessageBubble({ role, text }: ChatMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View className={`mb-3 max-w-[88%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser ? 'rounded-br-md bg-brand-primary' : 'rounded-bl-md bg-brand-surface border border-brand-border'
        }`}>
        <Text className="text-[15px] leading-[22px]">
          {renderFormattedText(text, isUser)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userText: {
    color: '#FFFFFF',
  },
  userBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  assistantText: {
    color: '#1E293B',
  },
  bold: {
    fontWeight: '700',
    color: '#1E293B',
  },
});
