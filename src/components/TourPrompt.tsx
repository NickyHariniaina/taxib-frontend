import Modal from './Modal';

type Props = {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
};

/** First-visit welcome: offers the guided tour or lets the user skip it. */
export default function TourPrompt({ open, onStart, onSkip }: Props) {
  return (
    <Modal
      open={open}
      onClose={onSkip}
      title="Bienvenue sur taxib"
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
        <h2 className="mt-4 text-lg font-bold tracking-tight text-white">
          Bienvenue sur taxib
        </h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-[13px] leading-relaxed text-stone-400">
          Trouvez votre bus à Antananarivo en quelques secondes. On vous
          montre ? Quatre étapes, trente secondes.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          data-autofocus
          type="button"
          onClick={onStart}
          className="rounded-xl bg-gradient-to-br from-[#FC3D32] to-[#c22a22] px-4 py-3 text-sm font-extrabold text-white shadow-xl transition active:scale-[0.99]"
        >
          Commencer le tutoriel
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-stone-400 transition hover:text-white"
        >
          Passer, je connais l'app
        </button>
      </div>
    </Modal>
  );
}
