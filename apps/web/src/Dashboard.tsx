import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listItems, createItem, deleteItem, clearToken, type Item } from "./api";
import { useRealtime } from "./useRealtime";
import { ListView } from "./views/ListView";
import { BoardView } from "./views/BoardView";
import { CalendarView } from "./views/CalendarView";

type View = "list" | "board" | "calendar";

export function Dashboard({ onLogout }: { onLogout: () => void }) {
    const qc = useQueryClient();
    const [title, setTitle] = useState("");
    const [kind, setKind] = useState("task");
    const [when, setWhen] = useState("");
    const [view, setView] = useState<View>("list");

    useRealtime();

    const { data: items = [], isLoading } = useQuery<Item[]>({
        queryKey: ["items"],
        queryFn: () => listItems(),
    });

    const create = useMutation({
        mutationFn: createItem,
        onMutate: async (newItem) => {
            await qc.cancelQueries({ queryKey: ["items"] });   // stop races
            const previous = qc.getQueryData<Item[]>(["items"]);  //snapshot for rollback
            const optimistic: Item = {
                id: `temp-${Date.now()}`,
                kind: newItem.kind as Item["kind"],
                title: newItem.title,
                description: newItem.description ?? null,
                status: null, start_at: newItem.start_at ?? null, end_at: null,
                meta: {}, created_by: "me",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            qc.setQueryData<Item[]>(["items"], (old = []) => [optimistic, ...old]);
            return { previous };
        },
        onError: (_err, _newItem, context) => {
            if (context?.previous) qc.setQueryData(["items"], context.previous);  //roll back
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ["items"] }),    // resync
    });

    const remove = useMutation({
        mutationFn: deleteItem,
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: ["items"] });
            const previous = qc.getQueryData<Item[]>(["items"]);
            qc.setQueryData<Item[]>(["items"], (old = []) => old.filter((i) => i.id !== id))
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) qc.setQueryData(["items"], context.previous);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ["items"] }),
    });

    function add() {
        if (!title.trim()) return;
        create.mutate({ kind, title, start_at: when ? new Date(when).toISOString() : undefined });
        setTitle("");
        setWhen("");
    }

    if (isLoading) return <p>Loading...</p>;

    return (
        <div>
            <button onClick={() => { clearToken(); onLogout(); }}>Log out</button>
            <h2>Dashboard</h2>

            <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="task">Task</option>
                <option value="event">Event</option>
                <option value="outing">Outing</option>
            </select>
            <input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            <button onClick={add}>Add</button>

            <div style={{ margin: "1rem 0" }}>
                <button onClick={() => setView("list")} disabled={view === "list"}>List</button>
                <button onClick={() => setView("board")} disabled={view === "board"}>Board</button>
                <button onClick={() => setView("calendar")} disabled={view === "calendar"}>Calendar</button>
            </div>

            {view === "list" && <ListView items={items} onDelete={remove.mutate} />}
            {view === "board" && <BoardView items={items} onDelete={remove.mutate} />}
            {view === "calendar" && <CalendarView items={items} onDelete={remove.mutate} />}
        </div>
    );
}