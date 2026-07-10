import type { LucideIcon } from 'lucide-react-native';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Bus,
  Calendar,
  Camera,
  Car,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  ClipboardList,
  Compass,
  FileText,
  Film,
  Flame,
  Flower2,
  Footprints,
  Heart,
  Hotel,
  Landmark,
  Luggage,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Music2,
  Paperclip,
  PartyPopper,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Satellite,
  Sparkles,
  Star,
  Store,
  Sunset,
  Tent,
  Ticket,
  Timer,
  User,
  Utensils,
  WifiOff,
  Waves,
  X,
  Zap,
  Home,
} from 'lucide-react-native';

/** 앱에서 쓰는 Lucide 아이콘 레지스트리 — 화면별로 이름만 참조 */
export const LUCIDE_ICONS = {
  alertTriangle: AlertTriangle,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  bookOpen: BookOpen,
  building2: Building2,
  bus: Bus,
  calendar: Calendar,
  camera: Camera,
  car: Car,
  check: Check,
  checkCircle: CheckCircle,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  circle: Circle,
  circleDot: CircleDot,
  clipboardList: ClipboardList,
  compass: Compass,
  fileText: FileText,
  film: Film,
  flame: Flame,
  flower2: Flower2,
  footprints: Footprints,
  heart: Heart,
  home: Home,
  hotel: Hotel,
  landmark: Landmark,
  luggage: Luggage,
  map: Map,
  mapPin: MapPin,
  menu: Menu,
  messageCircle: MessageCircle,
  minus: Minus,
  music2: Music2,
  paperclip: Paperclip,
  partyPopper: PartyPopper,
  plus: Plus,
  refreshCw: RefreshCw,
  rotateCcw: RotateCcw,
  rotateCw: RotateCw,
  satellite: Satellite,
  sparkles: Sparkles,
  star: Star,
  store: Store,
  sunset: Sunset,
  tent: Tent,
  ticket: Ticket,
  timer: Timer,
  user: User,
  utensils: Utensils,
  waves: Waves,
  wifiOff: WifiOff,
  x: X,
  zap: Zap,
} as const satisfies Record<string, LucideIcon>;

export type LucideIconName = keyof typeof LUCIDE_ICONS;

/** 기본 아이콘 색 (brand-text) */
export const ICON_COLOR_DEFAULT = '#0F172A';
export const ICON_COLOR_MUTED = '#64748B';
export const ICON_COLOR_PRIMARY = '#0077B6';
export const ICON_COLOR_WHITE = '#FFFFFF';
export const ICON_COLOR_STAR = '#FBBF24';
export const ICON_COLOR_STAR_EMPTY = '#E2E8F0';
export const ICON_COLOR_HEART = '#EF4444';

/** 하단 네비게이션 탭 */
export const NAVBAR_TAB_ICONS = {
  home: 'home',
  route: 'calendar',
  feed: 'compass',
  my: 'user',
} as const satisfies Record<string, LucideIconName>;

/** 홈 퀵 액세스 */
export const QUICK_ACCESS_ICONS = {
  hotels: 'hotel',
  attractions: 'landmark',
  festivals: 'calendar',
  eventZone: 'map',
  luggage: 'luggage',
} as const satisfies Record<string, LucideIconName>;

/** 이동 수단 */
export const TRANSPORT_MODE_ICONS = {
  walk: 'footprints',
  transit: 'bus',
  drive: 'car',
} as const satisfies Record<string, LucideIconName>;
