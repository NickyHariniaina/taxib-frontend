
import { useEffect, useMemo, useState } from 'react';
import { getNeighborhoods, type Neighborhood } from '../lib/neighborhoods';

type Props = {
  selectedId: number | null;
  onSelect: (neighborhood: Neighborhood) => void;
};

export default function NeighborhoodBrowser({
  selectedId,
  onSelect,
}: Props) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getNeighborhoods(controller.signal)
      .then(setNeighborhoods)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Impossible de charger les quartiers.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const filtered = useMemo(
    () =>
      neighborhoods.filter((n) =>
        n.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [neighborhoods, search],
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Neighborhoods</h2>
        <span className="text-xs text-stone-500">
          {neighborhoods.length}
        </span>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search a neighborhood..."
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-stone-500 focus:border-[#FC3D32]"
      />

      {loading && (
        <p className="text-xs text-stone-400">Loading neighborhoods...</p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {filtered.map((neighborhood) => {
            const selected = selectedId === neighborhood.id;

            return (
              <button
                key={neighborhood.id}
                type="button"
                onClick={() => onSelect(neighborhood)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selected
                    ? 'bg-[#FC3D32]/15 text-[#FC3D32] ring-1 ring-[#FC3D32]/40'
                    : 'text-stone-300 hover:bg-white/5'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{neighborhood.name}</span>
                  {selected && <span>●</span>}
                </span>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-3 text-center text-xs text-stone-500">
              No neighborhood found.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

