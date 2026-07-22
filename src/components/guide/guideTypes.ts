export type GuideRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const GUIDE_TARGET = {
  plannerHeroCta: 'guide.planner.heroCta',
  helpFab: 'guide.home.helpFab',
  rebootFab: 'guide.home.rebootFab',
  syncDot: 'guide.home.syncDot',
  quickAccessRow: 'guide.quick.row',
  quickLuggage: 'guide.quick.luggage',
  quickFestivals: 'guide.quick.festivals',
  quickRestaurants: 'guide.quick.restaurants',
  quickAttractions: 'guide.quick.attractions',
  quickHotels: 'guide.quick.hotels',
  homeEventZone: 'guide.home.eventZone',
  traveloguePreview: 'guide.home.traveloguePreview',
  navbarRoute: 'guide.navbar.route',
  navbarFeed: 'guide.navbar.feed',
} as const;

export type GuideTargetId = (typeof GUIDE_TARGET)[keyof typeof GUIDE_TARGET];
