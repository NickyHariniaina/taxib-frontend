import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

type Step = {
  /** Value of the `data-tour` attribute of the element to highlight. */
  target: string;
  title: string;
  body: string;
  /** Force the card to one side; otherwise it picks the roomier side. */
  placement?: 'above' | 'below';
};

const STEPS: Step[] = [
  {
    target: 'menu',
    title: 'Le menu',
    body: 'Ouvrez le menu pour choisir votre départ et votre arrivée, ou revoir ce tutoriel.',
  },
  {
    target: 'trip',
    title: 'Votre trajet',
    body: 'Le départ et l’arrivée restent visibles ici. Touchez pour rouvrir la recherche.',
  },
  {
    target: 'gps',
    title: 'Votre position',
    body: 'Un appui utilise le GPS et place votre position comme point de départ.',
  },
  {
    target: 'quartier',
    title: 'Les quartiers',
    body: 'Cherchez un quartier par son nom, même mal orthographié. Sur la carte, le premier tap pose le départ, le suivant l’arrivée.',
    placement: 'above',
  },
];

const CARD_MAX_W = 340;
const GAP = 14;
const EDGE = 12;
const SPOT_PAD = 6;

type Props = {
  /** Skipped or dismissed: the caller forgets it. */
  onClose: () => void;
  /** Last step reached: the caller remembers it. */
  onFinish: () => void;
};

function tooltipStyle(rect: DOMRect | null, step: Step): CSSProperties {
  const width = Math.min(CARD_MAX_W, window.innerWidth - EDGE * 2);
  const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const left = Math.min(
    Math.max(centerX, EDGE + width / 2),
    window.innerWidth - EDGE - width / 2,
  );

  if (!rect) {
    return {
      top: window.innerHeight / 2,
      left,
      width,
      transform: 'translate(-50%, -50%)',
    };
  }

  const above =
    step.placement === 'above' ||
    (step.placement === undefined && rect.top > window.innerHeight * 0.6);

  if (above) {
    return {
      top: Math.max(rect.top - GAP, EDGE),
      left,
      width,
      transform: 'translate(-50%, -100%)',
    };
  }

  return {
    top: Math.min(rect.top + rect.height + GAP, window.innerHeight - EDGE),
    left,
    width,
    transform: 'translateX(-50%)',
  };
}

/**
 * Guided spotlight tour over the map screen. The overlay blocks the UI, so the
 * only ways forward are the card controls (mouse, keyboard or screen reader).
 */
export default function Tour({ onClose, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  // Keep the latest callbacks without re-binding the keyboard listener.
  const latest = useRef({ onClose, onFinish });
  useEffect(() => {
    latest.current = { onClose, onFinish };
  });

  // Track the highlighted element: initial measure, then resize/scroll.
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.target]);

  // Move focus to the card so the step is announced.
  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        latest.current.onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (index === STEPS.length - 1) latest.current.onFinish();
        else setIndex(index + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(Math.max(0, index - 1));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index]);

  const next = () => (last ? onFinish() : setIndex(index + 1));
  const back = () => setIndex(Math.max(0, index - 1));

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const card = cardRef.current;
    if (!card) return;
    const focusables = Array.from(
      card.querySelectorAll<HTMLElement>('button:not([disabled])'),
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const lastButton = focusables[focusables.length - 1];
    if (document.activeElement === card) {
      e.preventDefault();
      (e.shiftKey ? lastButton : first).focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastButton.focus();
    } else if (!e.shiftKey && document.activeElement === lastButton) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      {/* Blocks the app behind the tour. */}
      <div aria-hidden="true" className="fixed inset-0 z-[1499]" />

      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[1500] rounded-2xl ring-2 ring-[#FC3D32] shadow-[0_0_0_9999px_rgba(12,10,9,0.72)] transition-[top,left,width,height] duration-300 ease-out motion-reduce:transition-none"
          style={{
            top: rect.top - SPOT_PAD,
            left: rect.left - SPOT_PAD,
            width: rect.width + SPOT_PAD * 2,
            height: rect.height + SPOT_PAD * 2,
          }}
        />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        onKeyDown={trapTab}
        style={tooltipStyle(rect, step)}
        className="fixed z-[1502] rounded-2xl border border-white/10 bg-stone-900/95 p-4 shadow-2xl backdrop-blur-xl outline-none animate-[cardIn_220ms_ease-out] motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s.target}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-[#FC3D32]' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </span>
          <span className="font-mono text-[11px] text-stone-500">
            {index + 1}/{STEPS.length}
          </span>
        </div>

        <h3
          id="tour-step-title"
          className="mt-3 text-[15px] font-bold tracking-tight text-white"
        >
          {step.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-stone-400">
          {step.body}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={back}
              aria-label="Étape précédente"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-stone-300 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
            >
              ←
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg px-2.5 py-2 text-[12px] font-semibold text-stone-400 transition hover:text-white"
          >
            Passer
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-gradient-to-br from-[#FC3D32] to-[#c22a22] px-4 py-2 text-[13px] font-extrabold text-white shadow-lg transition active:scale-95"
          >
            {last ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </>
  );
}
