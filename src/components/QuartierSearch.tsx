/* eslint-disable react/set-state-in-effect -- dialog resets its query when it opens and loads neighborhoods from the API */
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Modal from './Modal';
import { getNeighborhoods, type Neighborhood } from '../lib/neighborhoods';
import { searchByName } from '../lib/fuzzy';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (neighborhood: Neighborhood) => void;
  selectedId: number | null;
};

const MAX_RESULTS = 60;

/** Splits the name so the matched characters can be highlighted. */
function highlightName(name: string, highlight: number[]): ReactNode[] {
  if (highlight.length === 0) return [name];

  const marked = new Set(highlight);
  const parts: ReactNode[] = [];
  let buffer = '';
  let bufferMarked = marked.has(0);

  const flush = (index: number) => {
    if (buffer === '') return;
    parts.push(
      bufferMarked ? (
        <mark
          key={index}
          className="rounded bg-[#FC3D32]/30 px-0.5 font-semibold text-white"
        >
          {buffer}
        </mark>
      ) : (
        <span key={index}>{buffer}</span>
      ),
    );
    buffer = '';
  };

  for (let i = 0; i < name.length; i += 1) {
    const isMarked = marked.has(i);
    if (isMarked !== bufferMarked) {
      flush(parts.length);
      bufferMarked = isMarked;
    }
    buffer += name[i];
  }
  flush(parts.length);

  return parts;
}

/**
 * Quartier picker shown in a dialog: fuzzy search over the neighborhoods
 * served by the API, with the matched characters highlighted.
 */
export default function QuartierSearch({
  open,
  onClose,
  onSelect,
  selectedId,
}: Props) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  // Fetch once; the dialog keeps the list cached between openings.
  useEffect(() => {
    const controller = new AbortController();

    getNeighborhoods(controller.signal)
      .then(setNeighborhoods)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Impossible de charger les quartiers. Vérifiez la connexion.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  // Fresh search every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
  }, [open]);

  const results = useMemo(
    () => searchByName(query, neighborhoods),
    [query, neighborhoods],
  );

  const visible = results.slice(0, MAX_RESULTS);
  const activeId = `quartier-option-${visible[active]?.item.id ?? 'none'}`;

  const pick = (neighborhood: Neighborhood) => {
    onSelect(neighborhood);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Chercher un quartier">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-white">
            Chercher un quartier
          </h2>
          <p className="mt-0.5 truncate text-xs text-stone-400">
            {loading
              ? 'Chargement des quartiers…'
              : `${neighborhoods.length} quartier${
                  neighborhoods.length > 1 ? 's' : ''
                } · Antananarivo`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-stone-300 ring-1 ring-white/10 transition hover:ring-[#FC3D32] active:scale-95"
        >
          ✕
        </button>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-500"
          >
            ⌕
          </span>
          <input
            data-autofocus
            role="combobox"
            aria-expanded={visible.length > 0}
            aria-controls="quartier-list"
            aria-activedescendant={visible[active] ? activeId : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && visible.length > 0) {
                e.preventDefault();
                setActive((a) => (a + 1) % visible.length);
              } else if (e.key === 'ArrowUp' && visible.length > 0) {
                e.preventDefault();
                setActive((a) => (a - 1 + visible.length) % visible.length);
              } else if (e.key === 'Enter' && visible[active]) {
                e.preventDefault();
                pick(visible[active].item);
              }
            }}
            placeholder="Chercher un quartier… ex. Ivandry"
            className="w-full rounded-xl bg-white/5 py-3 pr-3 pl-9 text-[15px] text-stone-100 ring-1 ring-white/10 outline-none placeholder:text-stone-500 focus:ring-2 focus:ring-[#FC3D32]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {error && (
          <p className="px-2 py-3 text-center text-[13px] text-red-300">{error}</p>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="px-2 py-6 text-center text-[13px] text-stone-500">
            No quartier trouvé. Essayez un nom plus court.
          </p>
        )}

        {visible.length > 0 && (
          <ul id="quartier-list" role="listbox" className="space-y-0.5">
            {visible.map(({ item, highlight }, index) => {
              const selected = selectedId === item.id;

              return (
                <li
                  key={item.id}
                  id={`quartier-option-${item.id}`}
                  role="option"
                  aria-selected={index === active}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(item)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      index === active
                        ? 'bg-white/10 text-white'
                        : 'text-stone-300 hover:bg-white/5'
                    } ${selected ? 'ring-1 ring-[#FC3D32]/40' : ''}`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {highlightName(item.name, highlight)}
                    </span>
                    {selected && (
                      <span className="shrink-0 text-xs text-[#FC3D32]">
                        ●
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {results.length > MAX_RESULTS && (
          <p className="px-2 pt-3 text-center text-[11px] text-stone-600">
            {results.length - MAX_RESULTS} de plus — tapez plus pour affiner.
          </p>
        )}
      </div>
    </Modal>
  );
}
