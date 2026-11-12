import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useAppearance } from '../lib/useAppearance';
import type { MapStop } from '../lib/stops';
import { useTranslations } from '../i18n';

/** Escapes text interpolated into the inline SVG of a div icon. */
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char,
  );

/** Bus front, filled. */
const BUS_GLYPH =
  'M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM7 13V6h10v7H7z';

/**
 * Bus-stop badge: a rounded square in the accent colour with a bus glyph.
 * Solid shapes, not hairlines — at 30px a thin path turns to mush.
 */
function makeStopIcon(color: string, name: string, clickable: boolean): L.DivIcon {
  return L.divIcon({
    className: `quartier-stop-icon${clickable ? ' cursor-pointer' : ''}`,
    html: `<svg viewBox="0 0 30 30" width="34" height="34" role="img" aria-label="${escapeHtml(name)}"><rect x="1" y="1" width="28" height="28" rx="8" fill="${color}" stroke="white" stroke-width="2"/><path fill="white" d="${BUS_GLYPH}" transform="translate(4 4) scale(0.9)"/></svg>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/** A stop that can be tapped: enough to show it and to look up its lines. */
export type TappableStop = {
  id: number;
  name: string;
  lat: number;
  lon: number;
};

/** Stops drawn on the map as bus-stop badges, with their name on hover. */
export default function StopBadges({
  stops,
  onSelect,
}: {
  stops: MapStop[];
  onSelect?: (stop: TappableStop) => void;
}) {
  const { accentColor } = useAppearance();
  const t = useTranslations('Stops');
  const clickable = onSelect !== undefined;

  // Icons are built once per set of stops: a fresh icon object makes
  // react-leaflet replace the marker's DOM element on every render.
  const icons = useMemo(() => {
    const built = new Map<number, L.DivIcon>();
    for (const stop of stops) {
      built.set(
        stop.id,
        makeStopIcon(accentColor, stop.name || t('unnamed'), clickable),
      );
    }
    return built;
  }, [stops, accentColor, clickable, t]);

  return (
    <>
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          icon={icons.get(stop.id)}
          position={[stop.lat, stop.lon]}
          eventHandlers={
            onSelect ? { click: () => onSelect(stop) } : undefined
          }
        >
          <Tooltip direction="top" offset={[0, -14]}>
            {stop.name || t('unnamed')}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
