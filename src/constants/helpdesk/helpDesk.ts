import type { AppLanguage } from '../../types/user';

export type HelpDeskIntent =
  | 'nearby'
  | 'emergency'
  | 'festivals'
  | 'lockers'
  | 'schedule'
  | 'guide'
  | 'unknown';

export type SuggestedQuestion = {
  id: HelpDeskIntent;
  label: Record<AppLanguage, string>;
};

/** @deprecated Use useCopy('helpdesk') from src/i18n */
export const HELP_DESK_COPY: Record<
  AppLanguage,
  {
    screenTitle: string;
    welcome: string;
    welcomeSub: string;
    suggestedTitle: string;
    inputPlaceholder: string;
    send: string;
    typing: string;
    fabLabel: string;
    fallback: string;
    noPlanSchedule: string;
    noOngoingFestivals: string;
  }
> = {
  ko: {
    screenTitle: 'AI 헬프데스크',
    welcome: '안녕하세요! BU-TING AI 도우미예요.',
    welcomeSub: '아래 질문을 누르거나 직접 입력해 주세요.',
    suggestedTitle: '자주 묻는 질문',
    inputPlaceholder: '궁금한 것을 입력하세요…',
    send: '전송',
    typing: '답변 생성 중…',
    fabLabel: 'AI 헬프데스크',
    fallback:
      '죄송해요, 아직 그 질문은 잘 이해하지 못했어요. 아래 예시 질문을 선택하거나 관광지·축제·일정·보관소·비상 연락망에 대해 물어봐 주세요.',
    noPlanSchedule: '진행 중인 여행 일정이 없어요. AI 플래너로 일정을 만들어 보세요!',
    noOngoingFestivals: '현재 진행 중인 축제가 없어요. 축제 캘린더에서 예정 일정을 확인해 보세요.',
  },
  en: {
    screenTitle: 'AI Help Desk',
    welcome: 'Hi! I\'m the BU-TING AI assistant.',
    welcomeSub: 'Tap a question below or type your own.',
    suggestedTitle: 'Suggested questions',
    inputPlaceholder: 'Ask anything…',
    send: 'Send',
    typing: 'Generating reply…',
    fabLabel: 'AI Help Desk',
    fallback:
      'Sorry, I didn\'t quite get that. Try a suggested question or ask about attractions, festivals, schedule, lockers, or emergency contacts.',
    noPlanSchedule: 'No active trip yet. Start the AI planner to build an itinerary!',
    noOngoingFestivals: 'No festivals running right now. Check the festival calendar for upcoming events.',
  },
  ja: {
    screenTitle: 'AIヘルプデスク',
    welcome: 'こんにちは！BU-TING AIアシスタントです。',
    welcomeSub: '下の質問を選ぶか、直接入力してください。',
    suggestedTitle: 'よくある質問',
    inputPlaceholder: '質問を入力…',
    send: '送信',
    typing: '回答を生成中…',
    fabLabel: 'AIヘルプデスク',
    fallback:
      'すみません、その質問はまだ理解できませんでした。下の例から選ぶか、観光地・祭り・行程・ロッカー・緊急連絡先について聞いてください。',
    noPlanSchedule: '進行中の旅行がありません。AIプランナーで行程を作ってみてください！',
    noOngoingFestivals: '現在開催中の祭りはありません。祭りカレンダーで予定を確認してください。',
  },
  zh: {
    screenTitle: 'AI 帮助台',
    welcome: '您好！我是 BU-TING AI 助手。',
    welcomeSub: '点击下方问题或直接输入。',
    suggestedTitle: '常见问题',
    inputPlaceholder: '输入您的问题…',
    send: '发送',
    typing: '正在生成回复…',
    fabLabel: 'AI 帮助台',
    fallback:
      '抱歉，我还不太理解这个问题。请选择下方示例，或询问景点、节庆、行程、寄存处或紧急联系方式。',
    noPlanSchedule: '暂无进行中的行程。请使用 AI 规划器创建行程！',
    noOngoingFestivals: '目前没有进行中的节庆。请在节庆日历中查看即将举行的活动。',
  },
};

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'nearby',
    label: {
      ko: '근처 관광지·맛집 추천해줘',
      en: 'Recommend nearby spots & restaurants',
      ja: '近くの観光地・グルメを教えて',
      zh: '推荐附近景点和餐厅',
    },
  },
  {
    id: 'emergency',
    label: {
      ko: '비상 연락망 알려줘',
      en: 'Emergency contact numbers',
      ja: '緊急連絡先を教えて',
      zh: '紧急联系方式',
    },
  },
  {
    id: 'festivals',
    label: {
      ko: '지금 진행 중인 축제는?',
      en: 'Festivals happening now',
      ja: '今開催中の祭りは？',
      zh: '现在有哪些节庆？',
    },
  },
  {
    id: 'lockers',
    label: {
      ko: '인근 짐 보관소 위치',
      en: 'Nearby luggage lockers',
      ja: '近くのロッカー場所',
      zh: '附近行李寄存处',
    },
  },
  {
    id: 'schedule',
    label: {
      ko: '다음 여행 일정 알려줘',
      en: 'What\'s my next stop?',
      ja: '次の予定を教えて',
      zh: '下一个行程是什么？',
    },
  },
  {
    id: 'guide',
    label: {
      ko: '관광지 해설 들려줘',
      en: 'Tell me about a tourist spot',
      ja: '観光地の解説をして',
      zh: '介绍一下景点',
    },
  },
];
