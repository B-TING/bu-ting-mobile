export type LockerSize = 'small' | 'medium' | 'large' | 'extraLarge';

export type LockerFeeSchedule = 'default' | 'weekday' | 'weekend';

export type LockerFeeItem = {
  size: LockerSize;
  amount: number;
  unit: string;
};

export type LockerFeeGroup = {
  schedule: LockerFeeSchedule;
  items: LockerFeeItem[];
};

export type SubwayLockerCounts = {
  small: number;
  medium: number;
  large: number;
  extraLarge: number;
  total: number;
};

export type SubwayLockerRecord = {
  id: string;
  line: number;
  name: string;
  locationDetail: string;
  counts: {
    small: number;
    medium: number;
    large: number;
    extraLarge: number;
  };
  costRaw: string;
  fees: LockerFeeGroup[];
  company: string;
};

export type SubwayLockerStation = {
  id: string;
  line: number;
  name: string;
  locationDetail: string;
  location: { lat: number; lng: number };
  lockers: SubwayLockerCounts;
  fees: LockerFeeGroup[];
  costRaw: string;
  company: string;
  /** API 주변 검색 시 기준점으로부터의 거리(m) */
  distanceMeters?: number;
};
