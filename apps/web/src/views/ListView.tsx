import { type Item } from "../api";

export function ListView({ items, onDelete }: { items: Item[]; onDelete: (id: string) => void}) {
    return (
        <ul>
            {items.map((item) => (
                <li key={item.id}>
                    [{item.kind}] {item.title}
                    <button onClick={() => onDelete(item.id)}>x</button>
                </li>
            ))}
        </ul>
    );
}