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

/**
 * Bus-stop badge: a rounded square in the accent colour with a solid bus
 * glyph. Solid shapes, not hairlines — at 30px a thin path turns to mush.
 */
function makeStopIcon(color: string, name: string): L.DivIcon {
  return L.divIcon({
    className: 'quartier-stop-icon',
    html: `<svg viewBox="0 0 30 30" width="30" height="30" role="img" aria-label="${escapeHtml(name)}"><rect x="1" y="1" width="28" height="28" rx="8" fill="${color}" stroke="white" stroke-width="2"/><rect x="10" y="7.5" width="10" height="12" rx="2" fill="white"/><rect x="11.5" y="9" width="7" height="4" rx="1" fill="${color}"/><circle cx="12.5" cy="20.5" r="1.7" fill="white"/><circle cx="17.5" cy="20.5" r="1.7" fill="white"/></svg>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** Stops drawn on the map as bus-stop badges, with their name on hover. */
export default function StopBadges({ stops }: { stops: MapStop[] }) {
  const { accentColor } = useAppearance();
  const t = useTranslations('Stops');

  return (
    <>
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          icon={makeStopIcon(accentColor, stop.name || t('unnamed'))}
          position={[stop.lat, stop.lon]}
        >
          <Tooltip direction="top" offset={[0, -14]}>
            {stop.name || t('unnamed')}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
