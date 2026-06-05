import { type Item } from "../api";

const KINDS: Item["kind"][] = ["task", "event", "outing"];
const LABELS: Record<Item["kind"], string> = { task: "Tasks", event: "Events", outing: "Outings"};

export function BoardView({ items, onDelete }: { items: Item[]; onDelete: (id: string) => void }) {
    return (
        <div style={{display: "flex", gap: "1rem" }}>
            {KINDS.map((k) => {
                const column = items.filter((i) => i.kind === k);
                return (
                    <div key={k} style={{ flex: 1, border: "1px solid #ccc", padding: "0.5rem" }}>
                        <h3>{LABELS[k]} ({column.length})</h3>
                        {column.map((item) => (
                            <div key={item.id}>
                                {item.title}
                                <button onClick={() => onDelete(item.id)}>x</button>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}