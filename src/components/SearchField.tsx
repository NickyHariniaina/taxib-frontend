/* eslint-disable react/set-state-in-effect -- field mirrors map/GPS/swap changes and async search results by design */
import { useEffect, useId, useRef, useState } from 'react';
import { searchPlaces, type Place } from '../lib/geocode';
import { useTranslations } from '../i18n';

type Props = {
  label: string;
  placeholder?: string;
  /** Current endpoint label (place name or coordinates). */
  value: string;
  onPick: (place: Place) => void;
  onClear: () => void;
  /** Transparent field for embedding inside a card; the label becomes sr-only. */
  bare?: boolean;
};

const DEBOUNCE_MS = 500;

/** Google-like autocomplete field: debounced search, dropdown, keyboard nav. */
export default function SearchField({
  label,
  placeholder,
  value,
  onPick,
  onClear,
  bare = false,
}: Props) {
  const t = useTranslations('Search');
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  // Keep the input in sync when the endpoint changes from the map/GPS/swap.
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text.trim().length < 3) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const places = await searchPlaces(text, { signal: ctrl.signal });
        setResults(places);
        setActive(0);
        setOpen(true);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setFailed(true);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [text]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const pick = (p: Place) => {
    onPick(p);
    setText(p.name);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <label
        htmlFor={listId}
        className={
          bare
            ? 'sr-only'
            : 'mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted'
        }
      >
        {label}
      </label>
      <div className={bare ? 'flex items-center gap-1' : 'flex gap-2'}>
        <input
          id={listId}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-list`}
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && results.length > 0) {
              e.preventDefault();
              setActive((a) => (a + 1) % results.length);
            } else if (e.key === 'ArrowUp' && results.length > 0) {
              e.preventDefault();
              setActive((a) => (a - 1 + results.length) % results.length);
            } else if (e.key === 'Enter' && open && results[active]) {
              e.preventDefault();
              pick(results[active]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          className={
            bare
              ? 'min-w-0 flex-1 rounded-lg bg-transparent px-1 py-3 text-sm text-ink outline-none placeholder:text-faint focus-visible:outline-none'
              : 'min-w-0 flex-1 rounded-xl bg-raised px-3 py-2.5 text-sm text-ink ring-1 ring-line outline-none placeholder:text-faint focus:ring-brand'
          }
        />
        {text && (
          <button
            type="button"
            onClick={() => {
              setText('');
              setResults([]);
              setOpen(false);
              onClear();
            }}
            title={t('clearField')}
            aria-label={t('clear', { label })}
            className={
              bare
                ? 'grid h-6 w-6 shrink-0 place-items-center rounded-full text-faint transition hover:bg-raised-strong hover:text-ink-strong active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
                : 'rounded-xl bg-raised px-3 text-ink ring-1 ring-line transition hover:bg-raised-strong hover:text-ink-strong hover:ring-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'
            }
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <ul
          id={`${listId}-list`}
          role="listbox"
          className="absolute inset-x-0 top-full z-[1350] mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-line bg-panel p-1 shadow-2xl"
        >
          {loading && <li className="px-3 py-2.5 text-[13px] text-muted">{t('searching')}</li>}
          {!loading && failed && (
            <li className="px-3 py-2.5 text-[13px] text-danger-ink">
              {t('failed')}
            </li>
          )}
          {!loading && !failed && results.length === 0 && (
            <li className="px-3 py-2.5 text-[13px] text-muted">
              {t('empty')}
            </li>
          )}
          {!loading &&
            !failed &&
            results.map((p, i) => (
              <li key={`${p.lat},${p.lon}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(p)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full rounded-lg px-3 py-2 text-left ${i === active ? 'bg-raised-strong' : ''}`}
                >
                  <span className="block text-[13px] font-semibold text-ink">{p.name}</span>
                  <small className="block truncate text-xs text-muted">{p.displayName}</small>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
