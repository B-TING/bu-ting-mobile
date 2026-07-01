import {
  getFestivalStatus,
  MOCK_BUSAN_FESTIVALS,
  type BusanFestival,
} from '../../constants/festival/festivalCalendar';
import { PLACE_CATALOG } from '../../constants/places/placeCatalog';
import type { HelpDeskIntent } from '../../constants/helpdesk/helpDesk';
import { HELP_DESK_COPY } from '../../constants/helpdesk/helpDesk';
import { BUSAN_ATTRACTIONS, BUSAN_FOODS } from '../../constants/plan/planWizard';
import type { TravelPlan } from '../types/travelPlan';
import type { AppLanguage } from '../types/user';
import { getNearestUpcomingStop } from '../../utils/plan/planSchedule';
import { findNearbyRebootCandidates } from '../../utils/places/rebootPlaces';
import { fetchSubwayLockerStations } from '../locker/subwayLockerService';

export type HelpDeskContext = {
  language: AppLanguage;
  activePlan: TravelPlan | null;
  anchor?: { lat: number; lng: number };
};

const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

const INTENT_KEYWORDS: Record<HelpDeskIntent, string[]> = {
  nearby: [
    '근처', '주변', '맛집', '식당', '관광', '추천', 'nearby', 'restaurant', 'spot', 'recommend',
    '近く', 'グルメ', '観光', '附近', '餐厅', '推荐',
  ],
  emergency: [
    '119', '112', '118', '1339', '비상', '긴급', '응급', '연락', 'emergency', 'urgent', 'police',
    'fire', 'ambulance', '緊急', '救急', '警察', '紧急', '报警', '急救',
  ],
  festivals: [
    '축제', '페스티벌', '행사', 'festival', 'event', '祭り', '祭', '节庆', '活动',
  ],
  lockers: [
    '보관', '짐', '로커', 'locker', 'luggage', 'storage', 'ロッカー', '荷物', '寄存', '行李',
  ],
  schedule: [
    '일정', '다음', '여행', 'schedule', 'itinerary', 'next', 'stop', 'plan', 'trip',
    '予定', '行程', '下一个',
  ],
  guide: [
    '해설', '설명', '소개', 'guide', 'explain', 'about', 'tell me', '解説', '紹介', '介绍', '讲解',
  ],
  unknown: [],
};

function resolveAnchor(ctx: HelpDeskContext): { lat: number; lng: number } {
  if (ctx.anchor) {
    return ctx.anchor;
  }
  const upcoming = ctx.activePlan ? getNearestUpcomingStop(ctx.activePlan) : null;
  if (upcoming?.route.location) {
    return upcoming.route.location;
  }
  return BUSAN_CENTER;
}

export function matchHelpDeskIntent(message: string): HelpDeskIntent {
  const lower = message.toLowerCase();
  let best: HelpDeskIntent = 'unknown';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [HelpDeskIntent, string[]][]) {
    if (intent === 'unknown') {
      continue;
    }
    const score = keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  return bestScore > 0 ? best : 'unknown';
}

function festivalTitle(f: BusanFestival, lang: AppLanguage): string {
  if (lang === 'en') return f.titleEn;
  if (lang === 'ja') return f.titleJa;
  if (lang === 'zh') return f.titleZh;
  return f.titleKo;
}

function festivalLocation(f: BusanFestival, lang: AppLanguage): string {
  if (lang === 'en') return f.locationEn;
  if (lang === 'ja') return f.locationJa;
  if (lang === 'zh') return f.locationZh;
  return f.locationKo;
}

function festivalSummary(f: BusanFestival, lang: AppLanguage): string {
  if (lang === 'en') return f.summaryEn;
  if (lang === 'ja') return f.summaryJa;
  if (lang === 'zh') return f.summaryZh;
  return f.summaryKo;
}

function buildNearbyResponse(ctx: HelpDeskContext): string {
  const { language } = ctx;
  const anchor = resolveAnchor(ctx);
  const nearby = findNearbyRebootCandidates(anchor, {
    excludePlaceIds: [],
    language,
    limit: 4,
  });

  const foodSamples = BUSAN_FOODS.slice(0, 3).map(f => f.label[language] ?? f.label.ko);

  const attractionLines = nearby.length
    ? nearby.map(p => `• ${p.placeName} (약 ${p.distanceKm.toFixed(1)}km)`).join('\n')
    : BUSAN_ATTRACTIONS.slice(0, 4)
        .map(a => `• ${a.label[language] ?? a.label.ko}`)
        .join('\n');

  const foodLine = foodSamples.join(', ');

  if (language === 'ko') {
    return `📍 현재 위치 기준 인근 추천이에요.\n\n**관광지**\n${attractionLines}\n\n**맛집·음식**\n${foodLine} 등 부산 대표 메뉴를 즐겨 보세요. 자갈치시장·국밥·밀면도 인기 있어요.`;
  }
  if (language === 'en') {
    return `📍 Nearby picks from your current area:\n\n**Attractions**\n${attractionLines}\n\n**Food**\nTry ${foodLine} and local favorites like Jagalchi Market or milmyeon.`;
  }
  if (language === 'ja') {
    return `📍 現在地付近のおすすめです。\n\n**観光地**\n${attractionLines}\n\n**グルメ**\n${foodLine}など、釜山名物を楽しんでください。`;
  }
  return `📍 根据当前位置推荐：\n\n**景点**\n${attractionLines}\n\n**美食**\n推荐 ${foodLine} 等釜山特色美食。`;
}

function buildEmergencyResponse(language: AppLanguage): string {
  if (language === 'ko') {
    return `🚨 **비상·긴급 연락망**\n\n• **119** — 소방·구급 (화재, 응급환자)\n• **112** — 경찰 (범죄, 실종, 교통사고)\n• **118** — 해양경찰 (해상 사고)\n• **1339** — 질병관리청 (감염·보건 상담)\n• **1330** — 관광통역·안내 (다국어)\n\n위험 상황에서는 119 또는 112에 먼저 연락하세요.`;
  }
  if (language === 'en') {
    return `🚨 **Emergency contacts in Korea**\n\n• **119** — Fire & ambulance\n• **112** — Police\n• **118** — Coast guard\n• **1339** — Disease control hotline\n• **1330** — Tourist interpretation (multi-language)\n\nIn danger, call 119 or 112 first.`;
  }
  if (language === 'ja') {
    return `🚨 **緊急連絡先（韓国）**\n\n• **119** — 消防・救急\n• **112** — 警察\n• **118** — 海上警察\n• **1339** — 疾病管理庁\n• **1330** — 観光通訳案内\n\n危険な場合は119または112に連絡してください。`;
  }
  return `🚨 **韩国紧急联系方式**\n\n• **119** — 消防/急救\n• **112** — 警察\n• **118** — 海警\n• **1339** — 疾病管理热线\n• **1330** — 旅游翻译咨询\n\n遇险请优先拨打 119 或 112。`;
}

function buildFestivalsResponse(ctx: HelpDeskContext): string {
  const { language } = ctx;
  const ongoing = MOCK_BUSAN_FESTIVALS.filter(f => getFestivalStatus(f) === 'ongoing');

  if (ongoing.length === 0) {
    return HELP_DESK_COPY[language].noOngoingFestivals;
  }

  const lines = ongoing
    .map(f => {
      const title = festivalTitle(f, language);
      const loc = festivalLocation(f, language);
      const summary = festivalSummary(f, language);
      return `• **${title}**\n  📍 ${loc}\n  ${summary}`;
    })
    .join('\n\n');

  const header =
    language === 'ko'
      ? '🎉 **현재 진행 중인 축제**\n\n'
      : language === 'en'
        ? '🎉 **Festivals happening now**\n\n'
        : language === 'ja'
          ? '🎉 **現在開催中の祭り**\n\n'
          : '🎉 **正在进行的节庆**\n\n';

  return header + lines;
}

async function buildLockersResponse(ctx: HelpDeskContext): Promise<string> {
  const { language } = ctx;
  const anchor = resolveAnchor(ctx);
  const stations = await fetchSubwayLockerStations();

  const ranked = stations
    .map(s => {
      const d =
        Math.abs(s.location.lat - anchor.lat) + Math.abs(s.location.lng - anchor.lng);
      return { station: s, score: d };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  const lines = ranked
    .map(({ station: s }) => {
      const detail = s.locationDetail ? ` (${s.locationDetail})` : '';
      return `• ${s.line}호선 ${s.name}${detail} — ${s.lockers.total}칸`;
    })
    .join('\n');

  if (language === 'ko') {
    return `🧳 **인근 지하철역 물품보관함**\n\n${lines}\n\n역 내 위치·요금은 짐 보관소 메뉴에서 자세히 확인할 수 있어요.`;
  }
  if (language === 'en') {
    return `🧳 **Nearby subway lockers**\n\n${lines}\n\nSee the Luggage menu for fees and exact locations.`;
  }
  if (language === 'ja') {
    return `🧳 **近くの地下鉄ロッカー**\n\n${lines}\n\n詳細は荷物預かりメニューで確認できます。`;
  }
  return `🧳 **附近地铁寄存柜**\n\n${lines}\n\n详情可在行李寄存菜单中查看。`;
}

function buildScheduleResponse(ctx: HelpDeskContext): string {
  const { language, activePlan } = ctx;

  if (!activePlan) {
    return HELP_DESK_COPY[language].noPlanSchedule;
  }

  const upcoming = getNearestUpcomingStop(activePlan);
  if (!upcoming) {
    return HELP_DESK_COPY[language].noPlanSchedule;
  }

  const dayLabel =
    language === 'ko'
      ? `${upcoming.day.dayNumber}일차`
      : language === 'en'
        ? `Day ${upcoming.day.dayNumber}`
        : language === 'ja'
          ? `${upcoming.day.dayNumber}日目`
          : `第${upcoming.day.dayNumber}天`;

  const dateStr = upcoming.day.date;
  const place = upcoming.route.placeName;
  const visited = upcoming.route.isVisited;

  if (language === 'ko') {
    return `📅 **다음 여행 일정**\n\n• ${dayLabel} (${dateStr})\n• **${place}**${visited ? ' (방문 완료)' : ''}\n\n일정 탭에서 전체 루트를 확인하거나 리부트로 장소를 바꿀 수 있어요.`;
  }
  if (language === 'en') {
    return `📅 **Your next stop**\n\n• ${dayLabel} (${dateStr})\n• **${place}**${visited ? ' (visited)' : ''}\n\nOpen the Schedule tab for the full route or use Reboot to swap places.`;
  }
  if (language === 'ja') {
    return `📅 **次の予定**\n\n• ${dayLabel}（${dateStr}）\n• **${place}**${visited ? '（訪問済み）' : ''}\n\n行程タブで全体を確認できます。`;
  }
  return `📅 **下一个行程**\n\n• ${dayLabel}（${dateStr}）\n• **${place}**${visited ? '（已访问）' : ''}\n\n可在行程标签页查看完整路线。`;
}

function findMentionedPlace(message: string, _language: AppLanguage): string | null {
  for (const spot of BUSAN_ATTRACTIONS) {
    const labels = [spot.label.ko, spot.label.en, spot.label.ja, spot.label.zh, spot.id];
    if (labels.some(l => l && message.toLowerCase().includes(l.toLowerCase()))) {
      return spot.meta?.placeId ?? `tour_${spot.id}`;
    }
  }
  return null;
}

function buildGuideResponse(ctx: HelpDeskContext, message: string): string {
  const { language, activePlan } = ctx;
  let placeId = findMentionedPlace(message, language);

  if (!placeId && activePlan) {
    const upcoming = getNearestUpcomingStop(activePlan);
    placeId = upcoming?.route.placeId ?? null;
  }

  if (!placeId) {
    placeId = 'tour_gamcheon';
  }

  const catalog = PLACE_CATALOG[placeId];
  const spot = BUSAN_ATTRACTIONS.find(
    a => (a.meta?.placeId ?? `tour_${a.id}`) === placeId,
  );
  const name = spot?.label[language] ?? spot?.label.ko ?? placeId;

  if (!catalog) {
    if (language === 'ko') {
      return `🏛 **${name}**\n\n부산의 인기 관광지예요. 현장 운영 시간은 변동될 수 있으니 방문 전 확인해 주세요.`;
    }
    return `🏛 **${name}**\n\nA popular Busan spot. Hours may vary — check before you go.`;
  }

  const desc = catalog.description;
  const hours = catalog.hours;
  const address = catalog.address;
  const rating = catalog.rating;
  const dwell = catalog.dwellMinutes;

  if (language === 'ko') {
    return `🏛 **${name}**\n\n${desc}\n\n• 주소: ${address}\n• 운영: ${hours}\n• 추천 체류: 약 ${dwell}분\n• 평점: ★ ${rating}`;
  }
  if (language === 'en') {
    return `🏛 **${name}**\n\n${desc}\n\n• Address: ${address}\n• Hours: ${hours}\n• Suggested stay: ~${dwell} min\n• Rating: ★ ${rating}`;
  }
  if (language === 'ja') {
    return `🏛 **${name}**\n\n${desc}\n\n• 住所: ${address}\n• 営業: ${hours}\n• 滞在目安: 約${dwell}分\n• 評価: ★ ${rating}`;
  }
  return `🏛 **${name}**\n\n${desc}\n\n• 地址: ${address}\n• 营业: ${hours}\n• 建议停留: 约${dwell}分钟\n• 评分: ★ ${rating}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 실제 LLM API 연동 전 규칙 기반 목 응답 */
export async function requestHelpDeskReply(
  message: string,
  intent: HelpDeskIntent,
  ctx: HelpDeskContext,
): Promise<string> {
  await delay(600 + Math.random() * 400);

  const resolvedIntent =
    intent === 'unknown' ? matchHelpDeskIntent(message) : intent;

  switch (resolvedIntent) {
    case 'nearby':
      return buildNearbyResponse(ctx);
    case 'emergency':
      return buildEmergencyResponse(ctx.language);
    case 'festivals':
      return buildFestivalsResponse(ctx);
    case 'lockers':
      return buildLockersResponse(ctx);
    case 'schedule':
      return buildScheduleResponse(ctx);
    case 'guide':
      return buildGuideResponse(ctx, message);
    default:
      return HELP_DESK_COPY[ctx.language].fallback;
  }
}
