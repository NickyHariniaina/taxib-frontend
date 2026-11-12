import type { MessageShape } from '../types';

/**
 * Malagasy (Malagasy fiteny).
 *
 * Drafted for a Malagasy-speaking audience: "kafo" for quartier (the everyday
 * Antananarivo word for a quarter), "boriby" for bus, informal register.
 * Malagasy does not inflect nouns for number, so the `one` and `other` plural
 * branches read the same.
 */
const mg = {
  Meta: {
    title: 'taxib — horonampy an’Antananarivo',
  },
  App: {
    tagline: 'Taratara boriby · Antananarivo',
    whereTo: 'Iza no halehanao?',
    origin: 'Fanombohana',
    dest: 'Fahatongavana',
    openMenu: 'Sokafy ny meny',
    closeMenu: 'Hidio ny meny',
    useGps: 'Ampiasao ny GPS',
    currentLocation: 'Ny toerana misy anao',
    searchQuartier: 'Karohina ny kafo',
    removeOrigin: 'Kitiho ny toerana mpandehana',
    removeDest: 'Kitiho ny toerana tratra',
  },
  Drawer: {
    menu: 'Meny',
    title: 'Ny lalinao',
    close: 'Hidio ny meny',
    reset: 'Averina',
    tabOrigin: 'Fanombohana',
    tabDest: 'Fahatongavana',
    originPlaceholder: 'Aiza no manombohana ianao?',
    destPlaceholder: 'Iza no halehana ianao?',
    useMyPosition: 'Ampiasao ny toerako',
    myPosition: 'Ny toerako',
    locating: 'Mikaroka ny toerana…',
    swap: 'Ampiova ny toerana mpandehana sy ny toerana tratra',
    replayTour: 'Averina jereo ny fianarana',
    busHint:
      'Amboary ny toerana mpandehana sy ny toerana tratra hahita ny boriby.',
    language: 'Fiteny',
  },
  Search: {
    searching: 'Mikaroka…',
    failed: 'Tsy nahita ny valin’ny karohana. Andramo indray.',
    empty: 'Tsy hita ny toerana any Antananarivo.',
    clear: 'Hamafa {label}',
    clearField: 'Hamafa',
  },
  Journey: {
    direct: 'Taratara mivantana',
    noneDirect:
      'Tsy misy taratara mivantana eo anelanelan’ireo toerana roa.',
    all: 'Taratara rehetra',
    nearOrigin: 'Akaiky ny toerana mpandehana',
    nearDest: 'Akaiky ny toerana tratra',
    none: 'Tsy misy.',
  },
  Stops: {
    section: 'Toerana boriby akaiky',
    pickOrigin:
      'Amboary ny toerana mpandehana hahita ny toerana boriby.',
    pickDest:
      'Amboary ny toerana tratra hahita ny toerana boriby.',
    none: 'Tsy misy toerana boriby voasoratra ao anatin’ny 500 m.',
    unnamed: 'Toerana tsy misy anarana',
  },
  Quartier: {
    title: 'Karohina ny kafo',
    loading: 'Miampahibema ny kafo…',
    total:
      '{count, plural, =0 {Tsy misy kafo} one {# kafo} other {# kafo}} · Antananarivo',
    placeholder: 'Karohina ny kafo… ohatra Ivandry',
    clear: 'Hamafa',
    close: 'Hidio',
    remove: 'Esory ny kafo',
    clearStops: 'Hamafa',
    stopsLoading: 'Miampahibema ny fijanonana…',
    stopsFailed: 'Tsy azo ampitahana ny fijanonana.',
    stopsCount:
      '{count, plural, =0 {Tsy misy fijanonana} one {# fijanonana} other {# fijanonana}}',
    more:
      '{count, plural, one {# valiny fanampiny} other {# valiny fanampiny}} — manoratra bebe kokoa hanampy.',
    empty: 'Tsy hita ny kafo. Andramo ny anarana fohy.',
    error:
      'Tsy azo ampitahana ny kafo. Hamarino ny fifandraisanao.',
  },
  Tour: {
    prev: 'Dingana teo aloha',
    skip: 'Hetsika',
    next: 'Manaraka',
    finish: 'Vita',
    steps: {
      menu: {
        title: 'Ny meny',
        body: 'Sokafy ny meny mba hahafanao ny toerana mpandehana sy ny toerana tratra, na hahita indray ity fianarana ity.',
      },
      trip: {
        title: 'Ny lalinao',
        body: 'Ny toerana mpandehana sy ny toerana tratra dia mijanona eo hita eto. Kitiho mba hanokafana ny fikarohana.',
      },
      gps: {
        title: 'Ny toerako',
        body: 'Ny kitihonady iray dia ampiasaina ny GPS ka apetraka ny toeranao ho toerana mpandehana.',
      },
      quartier: {
        title: 'Ny kafo',
        body: 'Karohina ny kafo amin’ny anarany, na dia diso aza ny fanamarihana. Ao amin’ny sary, ny kitihonady voalohany no manao ny toerana mpandehana, ary ny manaraka no manao ny toerana tratra.',
      },
    },
  },
  TourPrompt: {
    title: 'Tongasoa amin’ny taxib',
    body: 'Mahita ny boribinao any Antananarivo ao anatin’ny segondra vitsy. Haseho anao ve? Dingana efatra, telopolo segondra.',
    start: 'Manomboha ny fianarana',
    skip: 'Hetsika, efa mahalatra ny app',
  },
  Errors: {
    stops:
      'Tsy azo ampitahana ny toerana boriby akaiky. Hamarino ny fifandraisanao.',
    lines:
      'Tsy azo ampitahana ny taratara akaiky. Hamarino ny fifandraisanao.',
    routeNotFound:
      'Tsy misy lalana mifandray an’ireo toerana roa.',
    routeUnavailable:
      'Tsy misy lalana azo ampiasaina. Hamarino ny fifandraisanao.',
    gpsDenied:
      'Avelao ny famantarana ny toerana vao afaka ampiasaina ny GPS.',
    gpsUnsupported:
      'Tsy misy GPS amin’ity fitaovana ity.',
    gpsUnavailable:
      'Tsy azo hita ny toerana. Hamarino ny fomba fanononanao.',
  },
  Appearance: {
    section: 'Endrika',
    mode: 'Fomba',
    modeLabel: 'Fomba filaza',
    clair: 'Mazava',
    sombre: 'Maro',
    color: 'Loko',
    colorLabel: 'Loko manavaka',
    themes: {
      rouge: 'Mena',
      bleu: 'Bulu',
      emeraude: 'Voara maitso',
      violet: 'Violety',
      ambre: 'Ambre',
      rose: 'Rosex',
    },
  },
  Locale: {
    label: 'Fiteny',
    beta: 'beta',
    betaNote:
      'Mbola jerena ny dikantara. Mety mbola misy dikantarana tsy mety.',
    names: {
      mg: 'Malagasy',
      fr: 'Français',
      en: 'English',
    },
  },
} as const satisfies MessageShape;

export default mg;
