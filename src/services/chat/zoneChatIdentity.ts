import { ZONE_CHAT_WS_CONFIG } from '../../constants/chat/zoneChatConfig';
import type { AuthUser } from '../../types/auth';
import type {
  ZoneChatIdentityField,
  ZoneChatParticipant,
} from '../../types/zoneChatWebSocket';

export function resolveZoneChatIdentityField(
  override?: ZoneChatIdentityField,
): ZoneChatIdentityField {
  return override ?? ZONE_CHAT_WS_CONFIG.identityField;
}

/**
 * 채팅방 입장용 참가자 정보.
 * identityValue는 identityField에 따라 userId / email / nickname 중 하나.
 * displayNickname은 UI·메시지 author 표시용.
 */
export function buildZoneChatParticipant(
  user: AuthUser | null,
  options?: {
    identityField?: ZoneChatIdentityField;
    guestDisplayNickname?: string;
    guestIdentityValue?: string;
  },
): ZoneChatParticipant {
  const identityField = resolveZoneChatIdentityField(options?.identityField);
  const guestDisplayNickname = options?.guestDisplayNickname ?? 'Guest';
  const guestIdentityValue = options?.guestIdentityValue ?? `guest-${Date.now()}`;

  if (!user) {
    return {
      identityField: 'nickname',
      identityValue: guestIdentityValue,
      displayNickname: guestDisplayNickname,
      userId: null,
      email: null,
    };
  }

  const identityValue = pickIdentityValue(user, identityField, guestIdentityValue);

  return {
    identityField,
    identityValue,
    displayNickname: user.nickname || user.email.split('@')[0] || 'User',
    userId: user.userId,
    email: user.email,
  };
}

function pickIdentityValue(
  user: AuthUser,
  field: ZoneChatIdentityField,
  fallback: string,
): string {
  switch (field) {
    case 'email':
      return user.email || fallback;
    case 'nickname':
      return user.nickname || fallback;
    case 'userId':
    default:
      return user.userId || fallback;
  }
}
