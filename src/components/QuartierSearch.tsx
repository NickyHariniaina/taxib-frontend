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
import { useTranslations } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (neighborhood: Neighborhood) => void;
  selectedId: number | null;
  /** Removes the current selection from the map. */
  onClear: () => void;
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
          className="rounded bg-brand/40 px-0.5 font-semibold text-ink-strong"
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
  onClear,
}: Props) {
  const t = useTranslations('Quartier');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  // Fetch once; the dialog keeps the list cached between openings.
  useEffect(() => {
    const controller = new AbortController();

    getNeighborhoods(controller.signal)
      .then(setNeighborhoods)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setFailed(true);
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
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      dialogId="quartier-dialog"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-ink-strong">
            {t('title')}
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted">
            {loading
              ? t('loading')
              : t('total', { count: neighborhoods.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-raised text-ink ring-1 ring-line transition hover:ring-brand active:scale-95"
        >
          ✕
        </button>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint"
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
            placeholder={t('placeholder')}
            className="w-full rounded-xl bg-raised py-3 pr-9 pl-9 text-[15px] text-ink ring-1 ring-line outline-none placeholder:text-faint focus:ring-2 focus:ring-brand"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActive(0);
              }}
              title={t('clear')}
              aria-label={t('clear')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 shrink-0 place-items-center rounded-lg bg-raised text-muted ring-1 ring-line transition hover:text-ink-strong hover:ring-brand active:scale-95"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {failed && (
          <p className="px-2 py-3 text-center text-[13px] text-danger-ink">
            {t('error')}
          </p>
        )}

        {loading && neighborhoods.length === 0 && (
          <div className="space-y-2 px-2 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded-lg bg-raised ring-1 ring-line"
              />
            ))}
          </div>
        )}

        {!loading && !failed && visible.length === 0 && (
          <div className="px-2 py-6 text-center">
            <span
              aria-hidden="true"
              className="mb-2 block text-2xl text-ghost"
            >
              ⌕
            </span>
            <p className="px-4 py-3 text-center text-[13px] text-faint">
              {t('empty')}
            </p>
          </div>
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
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${selected
                      ? 'bg-brand/15 text-brand ring-1 ring-brand/40'
                      : index === active
                        ? 'bg-raised-strong text-ink-strong'
                        : 'text-ink hover:bg-raised'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {highlightName(item.name, highlight)}
                    </span>
                    {selected && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={t('remove')}
                        title={t('remove')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClear();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onClear();
                          }
                        }}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-brand transition hover:bg-raised-strong active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        ✕
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {results.length > MAX_RESULTS && (
          <p className="px-2 pt-3 text-center text-[11px] text-ghost">
            {t('more', { count: results.length - MAX_RESULTS })}
          </p>
        )}
      </div>
    </Modal>
  );
}
