import type { AppLanguage } from '../../types/user';
import type { EventGameType, EventZoneId, ZoneEvent } from '../../types/eventZone';
import { EVENT_ZONE_BY_ID } from './eventZone';
import { buildMockZoneEvent } from './zoneEvents';

/** Phase 1: 장소·사물 인증만 (묵찌빠는 Phase 3+) */
export const PHASE1_EVENT_GAME_TYPES: Array<'place_auth' | 'object_sight'> = [
  'place_auth',
  'object_sight',
];

/** @deprecated Phase 1에서는 PHASE1_EVENT_GAME_TYPES 사용 */
export const EVENT_GAME_TYPES: EventGameType[] = [
  'place_auth',
  'object_sight',
  'mukjjippa',
];

/** 기본 인증 반경 (m) — Notion auth_target.radius_m */
export const DEFAULT_AUTH_RADIUS_M = 150;

const MOCK_OBJECTS = [
  {
    labelKo: '핑크색 우체통',
    labelEn: 'pink mailbox',
    labelJa: 'ピンクのポスト',
    labelZh: '粉色邮筒',
  },
  {
    labelKo: '부산 시티 투어 버스',
    labelEn: 'Busan city tour bus',
    labelJa: '釜山シティツアーバス',
    labelZh: '釜山城市观光巴士',
  },
  {
    labelKo: '해운대 조형물',
    labelEn: 'Haeundae sculpture',
    labelJa: '海雲台のオブジェ',
    labelZh: '海云台雕塑',
  },
] as const;

export function isEventGameType(type: string): type is EventGameType {
  return (
    type === 'place_auth' || type === 'object_sight' || type === 'mukjjippa'
  );
}

/** Phase 1 화면에서 다루는 인증 게임인지 */
export function isPhase1EventGame(event: ZoneEvent): boolean {
  return event.type === 'place_auth' || event.type === 'object_sight';
}

export function isEventGame(event: ZoneEvent): boolean {
  return isEventGameType(event.type);
}

export function isCameraEventGame(event: ZoneEvent): boolean {
  return event.type === 'place_auth' || event.type === 'object_sight';
}

export function resolveEventAuthTarget(event: ZoneEvent): {
  latitude: number;
  longitude: number;
  radiusM: number;
} | null {
  const zone = EVENT_ZONE_BY_ID[event.zoneId];
  const landmark =
    (event.targetLandmarkId
      ? zone.landmarks.find(item => item.id === event.targetLandmarkId)
      : undefined) ?? zone.landmarks[0];

  const latitude = event.authLatitude ?? landmark?.location.lat;
  const longitude = event.authLongitude ?? landmark?.location.lng;
  if (latitude == null || longitude == null) {
    return null;
  }

  return {
    latitude,
    longitude,
    radiusM: event.authRadiusM ?? DEFAULT_AUTH_RADIUS_M,
  };
}

export function buildMockGameEvent(
  zoneId: EventZoneId,
  type: EventGameType,
): ZoneEvent {
  const zone = EVENT_ZONE_BY_ID[zoneId];
  const landmark = zone.landmarks[0];
  const base = buildMockZoneEvent(zoneId, type);
  const authFields =
    landmark != null
      ? {
          authLatitude: landmark.location.lat,
          authLongitude: landmark.location.lng,
          authRadiusM: DEFAULT_AUTH_RADIUS_M,
        }
      : { authRadiusM: DEFAULT_AUTH_RADIUS_M };

  if (type === 'place_auth') {
    return {
      ...base,
      targetLandmarkId: landmark?.id,
      ...authFields,
    };
  }

  if (type === 'mukjjippa') {
    return base;
  }

  const object = MOCK_OBJECTS[Math.floor(Math.random() * MOCK_OBJECTS.length)];
  return {
    ...base,
    targetLandmarkId: landmark?.id,
    targetObjectLabelKo: object.labelKo,
    targetObjectLabelEn: object.labelEn,
    targetObjectLabelJa: object.labelJa,
    targetObjectLabelZh: object.labelZh,
    ...authFields,
  };
}

export function buildRandomMockGameEvent(zoneId: EventZoneId): ZoneEvent {
  const type =
    PHASE1_EVENT_GAME_TYPES[
      Math.floor(Math.random() * PHASE1_EVENT_GAME_TYPES.length)
    ];
  return buildMockGameEvent(zoneId, type);
}

export function eventGameObjectLabel(event: ZoneEvent, language: AppLanguage): string {
  if (language === 'en') {
    return event.targetObjectLabelEn ?? event.targetObjectLabelKo ?? '';
  }
  if (language === 'ja') {
    return event.targetObjectLabelJa ?? event.targetObjectLabelKo ?? '';
  }
  if (language === 'zh') {
    return event.targetObjectLabelZh ?? event.targetObjectLabelKo ?? '';
  }
  return event.targetObjectLabelKo ?? '';
}

/** 목업: 촬영 후 성공 여부 (90% 성공) */
export function mockEvaluateGameCapture(_event: ZoneEvent): boolean {
  return Math.random() < 0.9;
}

export const EVENT_GAME_COPY: Record<
  AppLanguage,
  {
    nearbyEventBanner: string;
    joinEvent: string;
    detailTitle: string;
    statusTitle: string;
    statusNotJoined: string;
    statusInProgress: string;
    statusCompleted: string;
    rulesTitle: string;
    rewardTitle: string;
    rewardHint: string;
    participate: string;
    placeAuthRules: string;
    objectSightRules: string;
    mukjjippaRules: string;
    targetPlace: string;
    targetObject: string;
    targetOpponent: string;
    targetOpponentHint: string;
    radiusTitle: string;
    radiusLabel: (meters: number) => string;
    radiusHint: string;
    outOfRadiusTitle: string;
    outOfRadiusHint: string;
    outOfRadiusMessage: (distanceM: number, radiusM: number) => string;
    locationDeniedTitle: string;
    locationDeniedMessage: string;
    locationUnavailableTitle: string;
    locationUnavailableMessage: string;
    checkingLocation: string;
    typePlaceAuth: string;
    typeObjectSight: string;
    remainingLabel: (remaining: string) => string;
    cameraHintPlace: string;
    cameraHintObject: (objectName: string) => string;
    capture: string;
    processing: string;
    processingPlace: string;
    processingObject: string;
    successTitle: string;
    successPlace: string;
    successObject: (objectName: string) => string;
    successMukjjippa: string;
    failTitle: string;
    failPlace: string;
    failObject: string;
    failMukjjippa: string;
    retry: string;
    retryMukjjippa: string;
    done: string;
    mockCameraLabel: string;
    mukjjippaYou: string;
    mukjjippaOpponent: string;
    mukjjippaPickHint: string;
    mukjjippaNoAttack: string;
    mukjjippaYourAttack: string;
    mukjjippaOpponentAttack: string;
    mukjjippaHandRock: string;
    mukjjippaHandScissors: string;
    mukjjippaHandPaper: string;
    mukjjippaRevealing: string;
    mukjjippaRoundContinue: string;
  }
> = {
  ko: {
    nearbyEventBanner: '현재 위치한 곳에 이벤트가 발생했습니다!',
    joinEvent: '이벤트 참여하기',
    detailTitle: '이벤트 안내',
    statusTitle: '참여 현황',
    statusNotJoined: '아직 참여하지 않았어요',
    statusInProgress: '참여 중',
    statusCompleted: '미션 완료',
    rulesTitle: '참여 방법',
    rewardTitle: '보상',
    rewardHint: '미션 성공 시 구역 배지와 포인트가 지급됩니다. (목업)',
    participate: '이벤트 참여',
    placeAuthRules:
      '목표 장소 근처에서 사진을 촬영하면 GPS 기반으로 장소 인증이 완료됩니다.',
    objectSightRules:
      '목표 사물을 찾아 촬영하면 AI 기반으로 사물 인증이 완료됩니다.',
    mukjjippaRules:
      '처음엔 공격권 없이 가위바위보를 합니다. 이긴 사람이 공격권을 가져가고, 공격권을 가진 사람과 상대가 같은 손을 내면 공격권 보유자의 승리로 게임이 끝납니다. (목업: 상대는 랜덤)',
    targetPlace: '목표 장소',
    targetObject: '목표 사물',
    targetOpponent: '대결 상대',
    targetOpponentHint: '다른 구역 유저와 랜덤 매칭 (목업)',
    radiusTitle: '인증 반경',
    radiusLabel: meters => `반경 ${meters}m`,
    radiusHint: '목표 지점 반경 안에서만 참여·촬영할 수 있어요.',
    outOfRadiusTitle: '인증 반경 밖입니다',
    outOfRadiusHint: '목표 지점 반경 안에서만 참여·촬영할 수 있어요.',
    outOfRadiusMessage: (distanceM, radiusM) =>
      `현재 약 ${distanceM}m 떨어져 있어요. 반경 ${radiusM}m 안으로 이동해 주세요.`,
    locationDeniedTitle: '위치 권한이 필요해요',
    locationDeniedMessage:
      '인증 반경을 확인하려면 위치 접근을 허용해 주세요.',
    locationUnavailableTitle: '위치를 확인할 수 없어요',
    locationUnavailableMessage:
      'GPS를 켠 뒤 다시 시도해 주세요.',
    checkingLocation: '위치 확인 중…',
    typePlaceAuth: '장소 인증',
    typeObjectSight: '사물 인증',
    remainingLabel: remaining => `남은 시간 ${remaining}`,
    cameraHintPlace: '목표 장소가 화면에 담기도록 촬영해 주세요',
    cameraHintObject: objectName => `'${objectName}'을(를) 찾아 촬영해 주세요`,
    capture: '촬영',
    processing: '확인 중…',
    processingPlace: '위치를 확인하고 있어요…',
    processingObject: '사물 인증을 확인하고 있어요…',
    successTitle: '미션 성공!',
    successPlace: '장소 인증에 성공했어요!',
    successObject: objectName => `'${objectName}' 인증 성공!`,
    successMukjjippa: '묵찌빠에서 승리했어요!',
    failTitle: '다시 시도해 주세요',
    failPlace: '목표 장소와 거리가 멀거나 촬영이 불명확해요.',
    failObject: '사물 인증에 실패했어요. 목표 사물이 화면에 잘 보이도록 다시 촬영해 주세요.',
    failMukjjippa: '상대가 이겼어요. 다시 도전해 보세요!',
    retry: '다시 촬영',
    retryMukjjippa: '다시 대결',
    done: '완료',
    mockCameraLabel: '카메라 미리보기 (목업)',
    mukjjippaYou: '나',
    mukjjippaOpponent: '상대',
    mukjjippaPickHint: '손 모양을 선택하세요',
    mukjjippaNoAttack: '공격권 없음 · 가위바위보',
    mukjjippaYourAttack: '내 공격권 · 같은 손을 내면 승리',
    mukjjippaOpponentAttack: '상대 공격권 · 같은 손을 내면 패배',
    mukjjippaHandRock: '묵',
    mukjjippaHandScissors: '찌',
    mukjjippaHandPaper: '빠',
    mukjjippaRevealing: '공개 중…',
    mukjjippaRoundContinue: '계속!',
  },
  en: {
    nearbyEventBanner: 'An event is happening at your current location!',
    joinEvent: 'Join event',
    detailTitle: 'Event guide',
    statusTitle: 'Your status',
    statusNotJoined: 'Not joined yet',
    statusInProgress: 'In progress',
    statusCompleted: 'Completed',
    rulesTitle: 'How to play',
    rewardTitle: 'Reward',
    rewardHint: 'Earn zone badges and points on success. (Mock)',
    participate: 'Join event',
    placeAuthRules:
      'Take a photo near the target place to complete GPS place verification.',
    objectSightRules:
      'Find and photograph the target object. AI will verify your shot.',
    mukjjippaRules:
      'Start with no attack right. Winner of rock-paper-scissors gets attack. If the attacker and opponent play the same hand, the attacker wins. (Mock: opponent plays randomly)',
    targetPlace: 'Target place',
    targetObject: 'Target object',
    targetOpponent: 'Opponent',
    targetOpponentHint: 'Random match with another zone (mock)',
    radiusTitle: 'Auth radius',
    radiusLabel: meters => `${meters}m radius`,
    radiusHint: 'You can join and capture only inside the target radius.',
    outOfRadiusTitle: 'Outside the auth radius',
    outOfRadiusHint: 'You can join and capture only inside the target radius.',
    outOfRadiusMessage: (distanceM, radiusM) =>
      `You are about ${distanceM}m away. Move within ${radiusM}m of the target.`,
    locationDeniedTitle: 'Location permission needed',
    locationDeniedMessage:
      'Allow location access to verify you are inside the auth radius.',
    locationUnavailableTitle: 'Could not get your location',
    locationUnavailableMessage: 'Turn on GPS and try again.',
    checkingLocation: 'Checking location…',
    typePlaceAuth: 'Place check-in',
    typeObjectSight: 'Object sight',
    remainingLabel: remaining => `${remaining} left`,
    cameraHintPlace: 'Frame the target place in your shot',
    cameraHintObject: objectName => `Find and photograph the ${objectName}`,
    capture: 'Capture',
    processing: 'Checking…',
    processingPlace: 'Verifying your location…',
    processingObject: 'Recognizing the object…',
    successTitle: 'Mission complete!',
    successPlace: 'Place verified successfully!',
    successObject: objectName => `Recognized: ${objectName}!`,
    successMukjjippa: 'You won Muk-jji-ppa!',
    failTitle: 'Try again',
    failPlace: 'You may be too far from the target or the photo is unclear.',
    failObject: 'Make sure the target object is clearly visible and retry.',
    failMukjjippa: 'Your opponent won. Try again!',
    retry: 'Retake',
    retryMukjjippa: 'Rematch',
    done: 'Done',
    mockCameraLabel: 'Camera preview (mock)',
    mukjjippaYou: 'You',
    mukjjippaOpponent: 'Opponent',
    mukjjippaPickHint: 'Pick your hand',
    mukjjippaNoAttack: 'No attack · rock-paper-scissors',
    mukjjippaYourAttack: 'Your attack · same hand wins',
    mukjjippaOpponentAttack: 'Opponent attack · same hand loses',
    mukjjippaHandRock: 'Rock',
    mukjjippaHandScissors: 'Scissors',
    mukjjippaHandPaper: 'Paper',
    mukjjippaRevealing: 'Revealing…',
    mukjjippaRoundContinue: 'Continue!',
  },
  ja: {
    nearbyEventBanner: '現在地でイベントが発生しました！',
    joinEvent: 'イベント参加',
    detailTitle: 'イベント案内',
    statusTitle: '参加状況',
    statusNotJoined: 'まだ参加していません',
    statusInProgress: '参加中',
    statusCompleted: 'ミッション完了',
    rulesTitle: '参加方法',
    rewardTitle: '報酬',
    rewardHint: '成功時にエリアバッジとポイントを獲得（モック）',
    participate: 'イベント参加',
    placeAuthRules: '目標スポット付近で撮影するとGPSで場所認証が完了します。',
    objectSightRules: '案内された物体を撮影するとAIが認識して判定します。',
    mukjjippaRules:
      '最初は攻撃権なしでじゃんけん。勝った人が攻撃権を持ち、攻撃権のある人と相手が同じ手なら攻撃権者の勝ちです。（モック：相手はランダム）',
    targetPlace: '目標スポット',
    targetObject: '目標物体',
    targetOpponent: '対戦相手',
    targetOpponentHint: '他エリアのユーザーとランダム対戦（モック）',
    radiusTitle: '認証半径',
    radiusLabel: meters => `半径 ${meters}m`,
    radiusHint: '目標地点の半径内でのみ参加・撮影できます。',
    outOfRadiusTitle: '認証半径の外です',
    outOfRadiusHint: '目標地点の半径内でのみ参加・撮影できます。',
    outOfRadiusMessage: (distanceM, radiusM) =>
      `現在およそ${distanceM}m離れています。半径${radiusM}m以内に移動してください。`,
    locationDeniedTitle: '位置情報の許可が必要です',
    locationDeniedMessage:
      '認証半径を確認するには位置情報へのアクセスを許可してください。',
    locationUnavailableTitle: '位置情報を取得できません',
    locationUnavailableMessage: 'GPSをオンにしてから再試行してください。',
    checkingLocation: '位置を確認中…',
    typePlaceAuth: '場所認証',
    typeObjectSight: '物体認証',
    remainingLabel: remaining => `残り ${remaining}`,
    cameraHintPlace: '目標スポットが写るように撮影してください',
    cameraHintObject: objectName => `「${objectName}」を見つけて撮影してください`,
    capture: '撮影',
    processing: '確認中…',
    processingPlace: '位置を確認しています…',
    processingObject: '物体を認識しています…',
    successTitle: 'ミッション成功！',
    successPlace: '場所認証に成功しました！',
    successObject: objectName => `「${objectName}」を認識しました！`,
    successMukjjippa: 'ムクチッパに勝利しました！',
    failTitle: 'もう一度お試しください',
    failPlace: '目標地点から離れているか、写真が不明瞭です。',
    failObject: '目標物体がはっきり写るように再撮影してください。',
    failMukjjippa: '相手の勝ちです。もう一度挑戦してください！',
    retry: '再撮影',
    retryMukjjippa: '再戦',
    done: '完了',
    mockCameraLabel: 'カメラプレビュー（モック）',
    mukjjippaYou: '自分',
    mukjjippaOpponent: '相手',
    mukjjippaPickHint: '手を選んでください',
    mukjjippaNoAttack: '攻撃権なし · じゃんけん',
    mukjjippaYourAttack: '自分の攻撃権 · 同じ手で勝ち',
    mukjjippaOpponentAttack: '相手の攻撃権 · 同じ手で負け',
    mukjjippaHandRock: 'グー',
    mukjjippaHandScissors: 'チョキ',
    mukjjippaHandPaper: 'パー',
    mukjjippaRevealing: '公開中…',
    mukjjippaRoundContinue: '続行！',
  },
  zh: {
    nearbyEventBanner: '您当前位置发生了活动！',
    joinEvent: '参与活动',
    detailTitle: '活动说明',
    statusTitle: '参与状态',
    statusNotJoined: '尚未参与',
    statusInProgress: '进行中',
    statusCompleted: '任务完成',
    rulesTitle: '参与方式',
    rewardTitle: '奖励',
    rewardHint: '成功后获得区域徽章和积分。（模拟）',
    participate: '参与活动',
    placeAuthRules: '在目标地点附近拍照，通过GPS完成地点认证。',
    objectSightRules: '找到并拍摄指定物体，AI将识别并判定是否成功。',
    mukjjippaRules:
      '开局无人拥有攻击权，先猜拳。胜者获得攻击权；拥有攻击权的人与对手出相同手势则攻击方获胜。（模拟：对手随机）',
    targetPlace: '目标地点',
    targetObject: '目标物体',
    targetOpponent: '对战对手',
    targetOpponentHint: '与其他区域用户随机匹配（模拟）',
    radiusTitle: '认证半径',
    radiusLabel: meters => `半径 ${meters}m`,
    radiusHint: '仅可在目标点半径内参与并拍摄。',
    outOfRadiusTitle: '不在认证半径内',
    outOfRadiusHint: '仅可在目标点半径内参与并拍摄。',
    outOfRadiusMessage: (distanceM, radiusM) =>
      `当前约距目标 ${distanceM}m，请移动到半径 ${radiusM}m 以内。`,
    locationDeniedTitle: '需要位置权限',
    locationDeniedMessage: '请允许位置访问以确认是否在认证半径内。',
    locationUnavailableTitle: '无法获取位置',
    locationUnavailableMessage: '请开启 GPS 后重试。',
    checkingLocation: '正在确认位置…',
    typePlaceAuth: '地点认证',
    typeObjectSight: '物体认证',
    remainingLabel: remaining => `剩余 ${remaining}`,
    cameraHintPlace: '请将目标地点拍入画面',
    cameraHintObject: objectName => `找到并拍摄「${objectName}」`,
    capture: '拍摄',
    processing: '确认中…',
    processingPlace: '正在验证位置…',
    processingObject: '正在识别物体…',
    successTitle: '任务成功！',
    successPlace: '地点认证成功！',
    successObject: objectName => `已识别：${objectName}！`,
    successMukjjippa: '你赢了默默啪！',
    failTitle: '请重试',
    failPlace: '距离目标较远或照片不够清晰。',
    failObject: '请确保目标物体清晰可见后重新拍摄。',
    failMukjjippa: '对手获胜了。再试一次吧！',
    retry: '重新拍摄',
    retryMukjjippa: '再战',
    done: '完成',
    mockCameraLabel: '相机预览（模拟）',
    mukjjippaYou: '我',
    mukjjippaOpponent: '对手',
    mukjjippaPickHint: '请选择手势',
    mukjjippaNoAttack: '无攻击权 · 猜拳',
    mukjjippaYourAttack: '你的攻击权 · 相同手势即胜',
    mukjjippaOpponentAttack: '对手攻击权 · 相同手势即败',
    mukjjippaHandRock: '石头',
    mukjjippaHandScissors: '剪刀',
    mukjjippaHandPaper: '布',
    mukjjippaRevealing: '揭晓中…',
    mukjjippaRoundContinue: '继续！',
  },
};
