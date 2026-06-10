import { type Item } from "../api";

export const KIND_COLOR: Record<Item["kind"], string> = {
  task: "var(--color-cyan)", event: "var(--color-magenta)", outing: "var(--color-gold)",
};

export function ItemCard({
  item, onDelete, showKind = true, showTime = false,
}: {
  item: Item; onDelete: (id: string) => void; showKind?: boolean; showTime?: boolean;
}) {
  const accent = KIND_COLOR[item.kind];
  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
         style={{ borderLeft: `3px solid ${accent}` }}>
      {showKind && (
        <span className="rounded-md px-2 py-0.5 text-xs font-semibold capitalize"
              style={{ background: `color-mix(in srgb, ${accent} 22%, transparent)`, color: accent }}>
          {item.kind}
        </span>
      )}
      {showTime && item.start_at && (
        <span className="text-sm text-white/50">
          {new Date(item.start_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </span>
      )}
      <span className="flex-1 text-base text-white/90">{item.title}</span>
      <span className="hidden text-xs text-white/40 sm:inline">{item.creator.display_name}</span>
      <button onClick={() => onDelete(item.id)} aria-label="Delete"
              className="text-white/30 opacity-0 transition hover:text-white/90 group-hover:opacity-100">×</button>
    </div>
  );
}