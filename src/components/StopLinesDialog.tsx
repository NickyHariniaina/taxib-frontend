/* eslint-disable react/set-state-in-effect -- fetching the catalog when the dialog opens */
import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import LineList from './LineList';
import { fetchLinesAtStop, groupByNumber, type BusLineVariant } from '../lib/lines';
import type { TappableStop } from './StopBadges';
import { useTranslations } from '../i18n';

type Props = {
  stop: TappableStop | null;
  onClose: () => void;
  /** Called with the variant the user picked. */
  onSelect: (variant: BusLineVariant) => void;
  onSetOrigin: () => void;
  onSetDest: () => void;
};

/** The lines serving a stop, with the stop's own trip actions. */
export default function StopLinesDialog({
  stop,
  onClose,
  onSelect,
  onSetOrigin,
  onSetDest,
}: Props) {
  const t = useTranslations('Lines');
  const [variants, setVariants] = useState<BusLineVariant[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!stop) return;
    const ctrl = new AbortController();
    setVariants(null);
    setFailed(false);
    fetchLinesAtStop(stop.id, ctrl.signal)
      .then(setVariants)
      .catch(() => {
        if (!ctrl.signal.aborted) setFailed(true);
      });
    return () => ctrl.abort();
  }, [stop]);

  const groups = useMemo(() => groupByNumber(variants ?? []), [variants]);

  return (
    <Modal
      open={stop !== null}
      onClose={onClose}
      title={stop ? t('atStop', { name: stop.name }) : t('title')}
      dialogId="stop-lines-dialog"
    >
      {stop && (
        <div className="flex gap-2 border-b border-line px-4 py-3">
          <button
            type="button"
            onClick={onSetOrigin}
            className="flex-1 rounded-xl bg-raised px-3 py-2 text-[12px] font-semibold text-ink transition hover:bg-raised-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t('setOrigin')}
          </button>
          <button
            type="button"
            onClick={onSetDest}
            className="flex-1 rounded-xl bg-raised px-3 py-2 text-[12px] font-semibold text-ink transition hover:bg-raised-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t('setDest')}
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {failed ? (
          <p className="px-2 py-6 text-center text-[13px] text-red-300">
            {t('failed')}
          </p>
        ) : variants === null ? (
          <div className="space-y-2 px-1">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-raised ring-1 ring-line"
              />
            ))}
          </div>
        ) : variants.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-faint">
            {t('none')}
          </p>
        ) : (
          <LineList groups={groups} onSelect={onSelect} />
        )}
      </div>
    </Modal>
  );
}
