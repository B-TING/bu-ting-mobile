import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SUGGESTED_QUESTIONS,
  type HelpDeskIntent,
} from '../../constants/helpdesk/helpDesk';
import { useAppLanguage, useCopy } from '../../i18n';
import {
  matchHelpDeskIntent,
  requestHelpDeskReply,
} from '../../services/helpdesk/helpDeskAiService';
import { selectActivePlan, usePlanStore } from '../../stores';
import { getNearestUpcomingStop } from '../../utils/plan/planSchedule';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

let messageCounter = 0;

function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}-${Date.now()}`;
}

function readKeyboardInset(event: KeyboardEvent): number {
  const windowHeight = Dimensions.get('window').height;
  const { screenY, height } = event.endCoordinates;
  return Math.max(height, windowHeight - screenY);
}

export function useHelpDeskChatScreen() {
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const copy = useCopy('helpdesk');
  const activePlan = usePlanStore(selectActivePlan);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const onShow = (event: KeyboardEvent) => setKeyboardInset(readKeyboardInset(event));
    const onHide = () => setKeyboardInset(0);

    const showSub = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const anchor = useMemo(() => {
    if (!activePlan) {
      return undefined;
    }
    const upcoming = getNearestUpcomingStop(activePlan);
    return upcoming?.route.location;
  }, [activePlan]);

  const showSuggestions = messages.length === 0;

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string, intent?: HelpDeskIntent) => {
      const trimmed = text.trim();
      if (!trimmed || loading) {
        return;
      }

      const userMsg: ChatMessage = {
        id: nextMessageId(),
        role: 'user',
        text: trimmed,
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      scrollToEnd();

      try {
        const resolvedIntent = intent ?? matchHelpDeskIntent(trimmed);
        const reply = await requestHelpDeskReply(trimmed, resolvedIntent, {
          language,
          activePlan,
          anchor,
        });

        setMessages(prev => [
          ...prev,
          { id: nextMessageId(), role: 'assistant', text: reply },
        ]);
      } finally {
        setLoading(false);
        scrollToEnd();
      }
    },
    [activePlan, anchor, language, loading, scrollToEnd],
  );

  const handleSuggestedSelect = useCallback(
    (intent: HelpDeskIntent, label: string) => {
      sendMessage(label, intent);
    },
    [sendMessage],
  );

  const inputBottomPad = Math.max(insets.bottom, 12);

  return {
    copy,
    language,
    messages,
    input,
    setInput,
    loading,
    keyboardInset,
    listRef,
    showSuggestions,
    scrollToEnd,
    sendMessage,
    handleSuggestedSelect,
    inputBottomPad,
    suggestedQuestions: SUGGESTED_QUESTIONS,
    insets,
  };
}
