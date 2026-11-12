import type { MessageShape } from '../types';

const en = {
  Meta: {
    title: 'taxib — buses in Antananarivo',
  },
  App: {
    tagline: 'Bus lines · Antananarivo',
    whereTo: 'Where are you going?',
    origin: 'From',
    dest: 'To',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    useGps: 'Use GPS',
    currentLocation: 'Current location',
    searchQuartier: 'Search a neighborhood',
    searchStops: 'Search bus stops',
    zoneHint: 'Tap the map to choose the centre of the zone.',
    zoneCancel: 'Cancel',
    removeOrigin: 'Tap to remove the departure',
    removeDest: 'Tap to remove the destination',
  },
  Drawer: {
    menu: 'Menu',
    title: 'Your trip',
    close: 'Close menu',
    reset: 'Reset',
    tabOrigin: 'From',
    tabDest: 'To',
    originPlaceholder: 'Where do you start?',
    destPlaceholder: 'Where to?',
    useMyPosition: 'Use my position',
    myPosition: 'My position',
    locating: 'Locating…',
    swap: 'Swap origin and destination',
    replayTour: 'Replay the tutorial',
    busHint: 'Set an origin and a destination to see the buses.',
    language: 'Language',
  },
  Search: {
    searching: 'Searching…',
    failed: 'Search failed, try again.',
    empty: 'No places found in Antananarivo.',
    clear: 'Clear {label}',
    clearField: 'Clear',
  },
  Stops: {
    count:
      '{count, plural, =0 {No stops} one {# stop} other {# stops}}',
    loading: 'Loading stops…',
    failed: 'Couldn’t load the stops.',
    clear: 'Clear',
    section: 'Nearby stops',
    pickOrigin: 'Set an origin to see stops.',
    pickDest: 'Set a destination to see stops.',
    none: 'No mapped stop within 500 m.',
    unnamed: 'Unnamed stop',
  },
  Quartier: {
    title: 'Search a neighborhood',
    loading: 'Loading neighborhoods…',
    total:
      '{count, plural, =0 {No neighborhood} one {# neighborhood} other {# neighborhoods}} · Antananarivo',
    placeholder: 'Search a neighborhood… e.g. Ivandry',
    clear: 'Clear',
    close: 'Close',
    remove: 'Remove the neighborhood',
    zoneTitle: 'Search zone',
    zoneCount:
      '{count, plural, =0 {No stops} one {# stop} other {# stops}} · {radius}',
    more: '{count, plural, one {# more result} other {# more results}} — type more to narrow down.',
    empty: 'No neighborhood found. Try a shorter name.',
    error: 'Couldn’t load neighborhoods. Check your connection.',
  },
  Tour: {
    prev: 'Previous step',
    skip: 'Skip',
    next: 'Next',
    finish: 'Done',
    steps: {
      menu: {
        title: 'The menu',
        body: 'Open the menu to pick your origin and destination, or replay this tutorial.',
      },
      trip: {
        title: 'Your trip',
        body: 'Origin and destination stay visible here. Tap to open the search again.',
      },
      gps: {
        title: 'Your location',
        body: 'One tap uses GPS and sets your position as the origin.',
      },
      quartier: {
        title: 'Neighborhoods',
        body: 'Search a neighborhood by name, even if it’s misspelled. On the map, the first tap sets the origin, the next one the destination.',
      },
      lines: {
        title: 'Bus lines',
        body: 'The menu lists the lines: number, direction and stops. Pick one to trace it on the map, and tap a stop to see the buses that serve it.',
      },
      stops: {
        title: 'Bus stops',
        body: 'Tap the bus button, then the map: every stop around that point shows up in a 500 m zone. Tap a stop to see the buses that serve it.',
      },
    },
  },
  TourPrompt: {
    title: 'Welcome to taxib',
    body: 'Find your bus in Antananarivo in seconds. Want a quick look? {count, plural, one {# step} other {# steps}}, thirty seconds.',
    start: 'Start the tutorial',
    skip: 'Skip, I know the app',
  },
  Errors: {
    stops: 'Couldn’t load nearby stops. Check your connection.',
    lines: 'Couldn’t load nearby lines. Check your connection.',
    routeNotFound: 'No road connects these two points.',
    routeUnavailable: 'Directions unavailable. Check your connection.',
    gpsDenied: 'Allow location access to use GPS.',
    gpsUnsupported: 'Geolocation isn’t available on this device.',
    gpsUnavailable: 'Position unavailable. Check your settings.',
  },
  Appearance: {
    section: 'Appearance',
    mode: 'Mode',
    modeLabel: 'Display mode',
    clair: 'Light',
    sombre: 'Dark',
    color: 'Color',
    colorLabel: 'Accent color',
    themes: {
      rouge: 'Red',
      bleu: 'Blue',
      emeraude: 'Emerald',
      violet: 'Violet',
      ambre: 'Amber',
      rose: 'Rose',
    },
  },
  Locale: {
    label: 'Language',
    beta: 'beta',
    betaNote:
      'Translation under review. Some passages may still read awkwardly.',
    names: {
      mg: 'Malagasy',
      fr: 'Français',
      en: 'English',
    },
  },
  Lines: {
    title: 'Bus lines',
    browse: 'Browse the lines',
    search: 'Number or name…',
    loading: 'Loading the lines…',
    failed: 'Couldn’t load the lines.',
    empty: 'No line matches.',
    none: 'No bus stops here.',
    atStop: 'Bus lines at {name}',
    setOrigin: 'Set as departure',
    setDest: 'Set as arrival',
    variantCount:
      '{count, plural, one {# variant} other {# variants}}',
    stopsCount:
      '{count, plural, =0 {no stops} one {# stop} other {# stops}}',
    directions: {
      aller: 'Outbound',
      retour: 'Inbound',
      circulaire: 'Circular',
    },
  },
} as const satisfies MessageShape;

export default en;
