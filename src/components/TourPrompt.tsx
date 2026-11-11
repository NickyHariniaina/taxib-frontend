import Modal from './Modal';
import { useTranslations } from '../i18n';

type Props = {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
};

/** First-visit welcome: offers the guided tour or lets the user skip it. */
export default function TourPrompt({ open, onStart, onSkip }: Props) {
  const t = useTranslations('TourPrompt');
  return (
    <Modal
      open={open}
      onClose={onSkip}
      title={t('title')}
      dialogId="tour-dialog"
    >
      <div className="px-6 pt-7 pb-5 text-center">
        <img
          src="/logo.png"
          alt=""
          width={56}
          height={56}
          className="mx-auto h-14 w-14 rounded-2xl shadow-xl"
        />
        <h2 className="mt-4 text-lg font-bold tracking-tight text-ink-strong">
          {t('title')}
        </h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-[13px] leading-relaxed text-muted">
          {t('body')}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          data-autofocus
          type="button"
          onClick={onStart}
          className="rounded-xl bg-gradient-to-br from-brand to-brand-deep px-4 py-3 text-sm font-extrabold text-ink-strong shadow-xl transition active:scale-[0.99]"
        >
          {t('start')}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-muted transition hover:text-ink-strong"
        >
          {t('skip')}
        </button>
      </div>
    </Modal>
  );
}
