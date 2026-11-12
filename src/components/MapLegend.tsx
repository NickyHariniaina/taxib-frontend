import { useAppearance } from '../lib/useAppearance';
import { useTranslations } from '../i18n';

/** The marker kinds the legend can explain. */
export type LegendEntry =
  | 'departure'
  | 'arrival'
  | 'stopsNearStart'
  | 'stopsNearEnd'
  | 'busStops'
  | 'quartier'
  | 'zone';

const PIN_PATH =
  'M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0Z';

function PinSwatch() {
  return (
    <svg viewBox="0 0 24 36" width="11" height="16" aria-hidden="true">
      <path d={PIN_PATH} fill="#4a92ca" stroke="white" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  );
}

function DotSwatch({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill={color} stroke="white" strokeWidth="2" />
    </svg>
  );
}

function BadgeSwatch({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="3.5"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RingSwatch({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
      <circle
        cx="7"
        cy="7"
        r="5.5"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

/** Always-on key of the map markers, listing only what is on screen. */
export default function MapLegend({ entries }: { entries: LegendEntry[] }) {
  const t = useTranslations('Legend');
  const { accentColor } = useAppearance();

  if (entries.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-3 top-[max(4.5rem,calc(env(safe-area-inset-top)+4.5rem))] z-[1040] w-max max-w-[45vw] rounded-2xl border border-line bg-panel/90 px-2.5 py-2 shadow-xl backdrop-blur">
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li
            key={entry}
            className="flex items-center gap-2 text-[11px] leading-tight text-muted"
          >
            <span className="flex h-4 w-3.5 shrink-0 items-center justify-center">
              {entry === 'departure' || entry === 'arrival' ? (
                <PinSwatch />
              ) : entry === 'stopsNearStart' ? (
                <DotSwatch color="#22c55e" />
              ) : entry === 'stopsNearEnd' ? (
                <DotSwatch color="#38bdf8" />
              ) : entry === 'busStops' ? (
                <BadgeSwatch color={accentColor} />
              ) : entry === 'quartier' ? (
                <DotSwatch color={accentColor} />
              ) : (
                <RingSwatch color={accentColor} />
              )}
            </span>
            <span className="truncate">
              {entry === 'departure'
                ? t('departure')
                : entry === 'arrival'
                  ? t('arrival')
                  : entry === 'stopsNearStart'
                    ? t('stopsNearStart')
                    : entry === 'stopsNearEnd'
                      ? t('stopsNearEnd')
                      : entry === 'busStops'
                        ? t('busStops')
                        : entry === 'quartier'
                          ? t('quartier')
                          : t('zone')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
