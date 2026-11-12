/* eslint-disable react/set-state-in-effect -- fetching the catalog when the dialog opens */
import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import LineList from './LineList';
import {
  fetchLines,
  filterGroups,
  groupByNumber,
  type BusLineVariant,
} from '../lib/lines';
import { useTranslations } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with the variant the user picked. */
  onSelect: (variant: BusLineVariant) => void;
};

/** Catalogue of every bus line, searchable by number or name. */
export default function LineDialog({ open, onClose, onSelect }: Props) {
  const t = useTranslations('Lines');
  const [variants, setVariants] = useState<BusLineVariant[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setVariants(null);
    setFailed(false);
    setQuery('');
    fetchLines(ctrl.signal)
      .then(setVariants)
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [open]);

  const groups = useMemo(
    () => filterGroups(groupByNumber(variants ?? []), query),
    [variants, query],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      dialogId="lines-dialog"
    >
      <div className="border-b border-line px-4 pb-3">
        <input
          data-autofocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className="w-full rounded-xl bg-raised px-3 py-2.5 text-[14px] text-ink ring-1 ring-line outline-none placeholder:text-faint focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {failed ? (
          <p className="px-2 py-6 text-center text-[13px] text-red-300">
            {t('failed')}
          </p>
        ) : variants === null ? (
          <div className="space-y-2 px-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-raised ring-1 ring-line"
              />
            ))}
          </div>
        ) : (
          <LineList groups={groups} onSelect={onSelect} />
        )}
      </div>
    </Modal>
  );
}
