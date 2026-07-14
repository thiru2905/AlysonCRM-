import { toast } from "sonner";

/** Standard stub for buttons whose backend flow isn't built yet. */
export function notifySoon(label: string, description?: string) {
  toast(label, {
    description: description ?? "Coming soon — this action isn't wired up yet.",
  });
}

export function notifyDone(label: string, description?: string) {
  toast.success(label, { description });
}

export function copyLink(url: string = typeof window !== "undefined" ? window.location.href : "") {
  if (!url) return;
  navigator.clipboard?.writeText(url).then(
    () => toast.success("Link copied", { description: url }),
    () => toast.error("Couldn't copy link"),
  );
}

/** LocalStorage-backed favorites set. */
const FAV_KEY = "alyson.favorites.v1";
function readFavs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}
function writeFavs(s: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...s]));
}
export function isFavorite(id: string) {
  return readFavs().has(id);
}
export function toggleFavorite(id: string, label?: string): boolean {
  const s = readFavs();
  const on = !s.has(id);
  if (on) s.add(id);
  else s.delete(id);
  writeFavs(s);
  toast(on ? "Added to favorites" : "Removed from favorites", {
    description: label,
  });
  return on;
}
