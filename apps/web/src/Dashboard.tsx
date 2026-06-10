import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listItems, createItem, deleteItem, clearToken, type Item } from "./api";
import { useRealtime } from "./useRealtime";
import { ListView } from "./views/ListView";
import { BoardView } from "./views/BoardView";
import { CalendarView } from "./views/CalendarView";
import logo from "./assets/hermes_logo_white.png";

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
                meta: {}, 
                created_by: "me",
                creator: { id: "me", display_name: "You" },
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
        <div className="min-h-screen px-4 py-6 md:px-8">
            <header className="mx-auto mb-6 flex max-w-5x1 flex-wrap items-center justify-between gap-3">
                <img src={logo} alt="Hermes" className="h-40" />

                <nav className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
                    {(["list", "board", "calendar"] as const).map((v) => (
                        <button key={v} onClick={() => setView(v)}
                          className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${
                            view === v ? "bg-white/15 text-white" : "text-white/60 hover:text-white"}`}>
                        {v}
                    </button>
                    ))}
                </nav>

                <button onClick={() => { clearToken(); onLogout(); }}
                    className="btn-ghost">Log out</button>
            </header>

            <main className="glass mx-auto max-w-5x1 p-6">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    {/* <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
                        <option value="task">Task</option>
                        <option value="event">Event</option>
                        <option value="outing">Outing</option>
                    </select> */}
                    <input className="field min-w-[12rem] flex-1" placeholder="What's the plan?"
                           value={title} onChange={(e) => setTitle(e.target.value)} />
                    <input className="field" type="datetime-local" value={when}
                           onChange={(e) => setWhen(e.target.value)} />
                    <button className="btn" onClick={add}>Add</button>
                </div>

                {view === "list" && <ListView items={items} onDelete={remove.mutate} />}
                {view === "board" && <BoardView items={items} onDelete={remove.mutate} />}
                {view === "calendar" && <CalendarView items={items} onDelete={remove.mutate} />}
            </main>
        </div>
    );
}