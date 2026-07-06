import type { BusanFestival } from '../../constants/festival/festivalCalendar';
import type { FestivalSearchItemDto, PlaceDetailResponseDto } from '../../types/placesApi';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';
import type { BusanPlace } from '../../types/placeSearch';
import { resolvePlaceDetailImageUrl } from './placesApiMapper';
import { tourApiDistrictLabelKo } from './tourApiDistrict';

const DEFAULT_FESTIVAL_COLOR = '#6366f1';
const DEFAULT_FESTIVAL_EMOJI = '🎪';
const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

export function toYyyymmdd(isoDate: string): string {
  return isoDate.replaceAll('-', '');
}

export function yyyymmddToIso(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) {
    return yyyymmdd;
  }
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function monthDateRangeYyyymmdd(
  year: number,
  month: number,
): { eventStartDate: string; eventEndDate: string } {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventStartDate = `${year}${String(month + 1).padStart(2, '0')}01`;
  const eventEndDate = `${year}${String(month + 1).padStart(2, '0')}${String(daysInMonth).padStart(2, '0')}`;
  return { eventStartDate, eventEndDate };
}

export function currentMonthDateRangeYyyymmdd(): { eventStartDate: string; eventEndDate: string } {
  const now = new Date();
  return monthDateRangeYyyymmdd(now.getFullYear(), now.getMonth());
}

export function upcomingFestivalDateRangeYyyymmdd(
  days = 90,
): { eventStartDate: string; eventEndDate: string } {
  const today = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const eventStartDate = toYyyymmdd(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  );
  const eventEndDate = toYyyymmdd(
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
  );
  return { eventStartDate, eventEndDate };
}

function parseCoord(value: number | string | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (Math.abs(parsed) > 180) {
    return parsed / 10_000_000;
  }
  return parsed;
}

function resolveLatLng(item: {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  mapx?: number | string;
  mapy?: number | string;
}): { lat: number; lng: number } | null {
  const lat = parseCoord(item.lat ?? item.latitude ?? item.mapy);
  const lng = parseCoord(item.lng ?? item.longitude ?? item.mapx);
  if (lat == null || lng == null) {
    return null;
  }
  return { lat, lng };
}

export function mapFestivalSearchItemToBusanFestival(
  item: FestivalSearchItemDto,
): BusanFestival {
  const title = item.title?.trim() || '행사';
  const address = item.address?.trim() || '';
  const districtLabel = item.districtCode ? tourApiDistrictLabelKo(item.districtCode) : '';
  const locationName = districtLabel || address;
  const startDate = yyyymmddToIso(item.eventStartDate);
  const endDate = item.eventEndDate ? yyyymmddToIso(item.eventEndDate) : startDate;
  const location = resolveLatLng(item) ?? BUSAN_CENTER;
  const summary = title.length > 80 ? `${title.slice(0, 80)}…` : title;

  return {
    id: item.contentId,
    tag: 'FESTIVAL',
    titleKo: title,
    titleEn: title,
    titleJa: title,
    titleZh: title,
    locationKo: locationName,
    locationEn: locationName,
    locationJa: locationName,
    locationZh: locationName,
    addressKo: address,
    addressEn: address,
    addressJa: address,
    addressZh: address,
    descriptionKo: title,
    descriptionEn: title,
    descriptionJa: title,
    descriptionZh: title,
    hoursKo: '',
    hoursEn: '',
    hoursJa: '',
    hoursZh: '',
    startDate,
    endDate,
    summaryKo: summary,
    summaryEn: summary,
    summaryJa: summary,
    summaryZh: summary,
    imageUri: item.imageUrl ?? item.thumbnailUrl ?? '',
    imageColor: DEFAULT_FESTIVAL_COLOR,
    imageEmoji: DEFAULT_FESTIVAL_EMOJI,
    location,
  };
}

export function mapFestivalToBusanPlace(festival: BusanFestival): BusanPlace {
  return {
    id: festival.id,
    contentId: festival.id,
    contentTypeId: PLACE_CONTENT_TYPE.festival,
    name: festival.titleKo,
    address: festival.addressKo,
    location: festival.location,
    rating: 0,
    userRatingsTotal: 0,
    imageUrl: festival.imageUri || undefined,
  };
}

export function mapFestivalSearchItemToBusanPlace(item: FestivalSearchItemDto): BusanPlace {
  return mapFestivalToBusanPlace(mapFestivalSearchItemToBusanFestival(item));
}

export function enrichFestivalFromDetail(
  festival: BusanFestival,
  detail: PlaceDetailResponseDto,
): BusanFestival {
  const title = detail.title?.trim() || festival.titleKo;
  const intro =
    detail.details?.overview?.trim() ||
    detail.details?.infotext?.trim() ||
    detail.details?.expdetail?.trim();
  const hours = detail.details?.usetimefestival?.trim() || detail.details?.usetime?.trim();
  const address = detail.address?.trim() || festival.addressKo;
  const location = resolveLatLng(detail) ?? festival.location;
  const summary = intro
    ? intro.length > 80
      ? `${intro.slice(0, 80)}…`
      : intro
    : festival.summaryKo;
  const resolvedHours = hours && hours !== '0' ? hours : festival.hoursKo;

  return {
    ...festival,
    titleKo: title,
    titleEn: title,
    titleJa: title,
    titleZh: title,
    addressKo: address,
    addressEn: address,
    addressJa: address,
    addressZh: address,
    descriptionKo: intro || festival.descriptionKo,
    descriptionEn: intro || festival.descriptionEn,
    descriptionJa: intro || festival.descriptionJa,
    descriptionZh: intro || festival.descriptionZh,
    hoursKo: resolvedHours,
    hoursEn: resolvedHours,
    hoursJa: resolvedHours,
    hoursZh: resolvedHours,
    summaryKo: summary,
    summaryEn: summary,
    summaryJa: summary,
    summaryZh: summary,
    location,
    imageUri: resolvePlaceDetailImageUrl(detail) || festival.imageUri,
  };
}
