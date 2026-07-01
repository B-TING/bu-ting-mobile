import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildZoneChatWebSocketUrl,
  isZoneChatWebSocketEnabled,
} from '../constants/chat/zoneChatConfig';
import { buildZoneChatParticipant } from '../services/chat/zoneChatIdentity';
import { mapServerMessagesToEventZoneChat } from '../services/chat/zoneChatMessageMapper';
import {
  ZoneChatWebSocketClient,
} from '../services/chat/zoneChatWebSocketClient';
import { selectReusableAccessToken, useAuthStore } from '../stores/useAuthStore';
import type { EventZoneId } from '../types/eventZone';
import type { EventZoneChatMessage } from '../types/eventZone';
import type {
  ZoneChatConnectionStatus,
  ZoneChatIdentityField,
} from '../types/zoneChatWebSocket';

export type UseZoneChatWebSocketOptions = {
  roomId: string;
  zoneId?: EventZoneId;
  /** WebSocket 미사용 시 mock 시드 메시지 */
  seedMessages?: EventZoneChatMessage[];
  identityField?: ZoneChatIdentityField;
  guestDisplayNickname?: string;
  enabled?: boolean;
};

export type UseZoneChatWebSocketResult = {
  enabled: boolean;
  status: ZoneChatConnectionStatus;
  messages: EventZoneChatMessage[];
  participant: ReturnType<typeof buildZoneChatParticipant>;
  sendMessage: (text: string) => boolean;
  isRealtime: boolean;
};

let localMessageCounter = 0;

function nextLocalMessageId(): string {
  localMessageCounter += 1;
  return `local-msg-${localMessageCounter}-${Date.now()}`;
}

export function useZoneChatWebSocket(
  options: UseZoneChatWebSocketOptions,
): UseZoneChatWebSocketResult {
  const {
    roomId,
    zoneId,
    seedMessages = [],
    identityField,
    guestDisplayNickname,
    enabled: enabledOverride,
  } = options;

  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(selectReusableAccessToken);

  const wsEnabled = enabledOverride ?? isZoneChatWebSocketEnabled();
  const participant = useMemo(
    () =>
      buildZoneChatParticipant(user, {
        identityField,
        guestDisplayNickname,
      }),
    [user, identityField, guestDisplayNickname],
  );

  const [status, setStatus] = useState<ZoneChatConnectionStatus>(
    wsEnabled ? 'idle' : 'disabled',
  );
  const [messages, setMessages] = useState<EventZoneChatMessage[]>(seedMessages);
  const clientRef = useRef<ZoneChatWebSocketClient | null>(null);

  useEffect(() => {
    setMessages(seedMessages);
  }, [roomId, seedMessages]);

  useEffect(() => {
    if (!wsEnabled) {
      setStatus('disabled');
      return undefined;
    }

    const client = new ZoneChatWebSocketClient();
    clientRef.current = client;

    client.setListeners({
      onStatusChange: setStatus,
      onFrame: frame => {
        if (frame.type === 'HISTORY') {
          setMessages(mapServerMessagesToEventZoneChat(frame.messages, participant));
          return;
        }
        if (frame.type === 'MESSAGE') {
          setMessages(prev => {
            if (prev.some(item => item.id === frame.message.id)) {
              return prev;
            }
            return [
              ...prev,
              ...mapServerMessagesToEventZoneChat([frame.message], participant),
            ];
          });
        }
      },
    });

    client.connect({
      url: buildZoneChatWebSocketUrl(accessToken),
      roomId,
      zoneId,
      participant,
      accessToken,
    });

    return () => {
      client.leaveRoom();
      client.disconnect();
      clientRef.current = null;
    };
  }, [wsEnabled, roomId, zoneId, participant, accessToken]);

  const sendMessage = useCallback(
    (text: string): boolean => {
      const trimmed = text.trim();
      if (!trimmed) {
        return false;
      }

      const clientMessageId = nextLocalMessageId();
      const optimistic: EventZoneChatMessage = {
        id: clientMessageId,
        roomId,
        authorId: participant.identityValue,
        authorNickname: participant.displayNickname,
        text: trimmed,
        sentAt: new Date().toISOString(),
        isMine: true,
      };

      if (!wsEnabled || status !== 'connected') {
        setMessages(prev => [...prev, optimistic]);
        return false;
      }

      setMessages(prev => [...prev, optimistic]);
      return clientRef.current?.sendChatMessage(clientMessageId, trimmed) ?? false;
    },
    [participant, roomId, status, wsEnabled],
  );

  return {
    enabled: wsEnabled,
    status,
    messages,
    participant,
    sendMessage,
    isRealtime: wsEnabled && status === 'connected',
  };
}
