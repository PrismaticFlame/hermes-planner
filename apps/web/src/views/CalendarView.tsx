import { type Item } from "../api";

const dayKey = (iso: string) => 
    new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export function CalendarView({ items, onDelete }: { items: Item[]; onDelete: (id: string) => void }) {
    const dated = items.filter((i) => i.start_at)
        .sort((a, b) => a.start_at!.localeCompare(b.start_at!));
    const undated = items.filter((i) => !i.start_at);

    const groups: Record<string, Item[]> = {};
    for (const item of dated) (groups[dayKey(item.start_at!)] ??= []).push(item);

    return (
        <div>
            {Object.entries(groups).map(([day, dayItems]) => (
                <div key={day}>
                    <h3>{day}</h3>
                    {dayItems.map((item) => (
                        <div key={item.id}>
                            {new Date(item.start_at!).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            {" - "}[{item.kind}] {item.title}
                            <button onClick={() => onDelete(item.id)}>x</button>
                        </div>
                    ))}
                </div>
            ))}
            {undated.length > 0 && (
                <div>
                    <h3>No date</h3>
                    {undated.map((item) => (
                        <div key={item.id}>
                            [{item.kind}] {item.title}
                            <button onClick={() => onDelete(item.id)}>x</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}