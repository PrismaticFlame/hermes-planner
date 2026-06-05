// note: token gets stored in local storage. dangerous but for an app that is not going to be 
// for all to use and just a local, self-hosted friends app, its a SIMPLE starting point. 
// might be worth revisiting
// TODO?

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");
export const setToken = (t: string) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

async function request(path: string, options: RequestInit = {}) {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed: ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
}

// auth
export const register = (email: string, display_name: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, display_name, password }) });

export async function login(email: string, password: string) {
    const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setToken(data.access_token);
    return data;
}

// items
export interface Item {
    id: string, kind: "task" | "event" | "outing"; title: string;
    description: string | null; status: string | null;
    start_at: string | null; end_at: string | null;
    meta: Record<string, unknown>; created_by: string;
    created_at: string; updated_at: string;
}

export const listItems = (kind?: string): Promise<Item[]> =>
    request(`/items${kind ? `?kind=${kind}` : ""}`);
export const createItem = (item: { 
    kind: string, title: string; description?: string 
    status?: string; start_at?: string;
}): Promise<Item> => request("/items", { method: "POST", body: JSON.stringify(item) });
export const deleteItem = (id: string): Promise<null> =>
    request(`/items/${id}`, { method: "DELETE" });