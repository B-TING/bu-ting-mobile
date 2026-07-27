import type { OAuthProvider } from './auth';

export type MyProfileResponse = {
  userId: string;
  email: string;
  nickname: string;
  profileImageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  provider?: OAuthProvider;
};

export type UpdateMyProfileRequest = {
  nickname?: string;
};
