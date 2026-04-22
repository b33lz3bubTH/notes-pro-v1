import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteNote, listNotes, type Note } from "@/lib/db";
import { NoteCard } from "@/components/NoteCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Search, Feather, Lock, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { lockVault } from "@/lib/vault";

const Index = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const refresh = async () => {
    setLoading(true);
    const all = await listNotes();
    setNotes(all);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  // ⌘K focuses search; ⌘N creates a new note
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (meta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        navigate("/note/new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const handleDelete = async (n: Note) => {
    if (!confirm(`Delete "${n.title}"? This cannot be undone.`)) return;
    await deleteNote(n.id);
    toast.success("Note deleted");
    refresh();
  };

  const stats = useMemo(() => {
    const totalMedia = notes.reduce((acc, n) => acc + n.mediaIds.length, 0);
    const words = notes.reduce(
      (acc, n) => acc + (n.body.trim() ? n.body.trim().split(/\s+/).length : 0), 0,
    );
    const today = new Date().setHours(0, 0, 0, 0);
    const todayCount = notes.filter((n) => n.updatedAt >= today).length;
    return { totalMedia, words, todayCount };
  }, [notes]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating glass header */}
      <header className="sticky top-0 z-30">
        <div className="container max-w-6xl mx-auto px-5 md:px-8 pt-4">
          <div className="glass rounded-2xl px-4 md:px-5 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="wax-seal" style={{ width: "2rem", height: "2rem" }}>
                <Feather className="w-3.5 h-3.5" />
              </span>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="display-serif text-base text-foreground font-semibold">The Codex</span>
                <span className="mono text-[10px] text-muted-foreground">private · local · yours</span>
              </div>
            </div>

            <div className="relative flex-1 max-w-xl mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="global-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
                className="field pl-10 pr-14 py-2 rounded-full"
              />
              <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 mono text-[10px] px-1.5 py-0.5 rounded-md bg-surface-3 text-muted-foreground border border-border">
                ⌘K
              </kbd>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => lockVault()}
                title="Lock the codex"
                aria-label="Lock"
                className="w-9 h-9 inline-flex items-center justify-center rounded-full glass-subtle text-foreground hover:border-crimson/50 transition"
              >
                <Lock className="w-4 h-4" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => navigate("/note/new")}
                className="btn btn-wax px-4 py-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New note</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / stats bento */}
      <section className="container max-w-6xl mx-auto px-5 md:px-8 pt-6">
        <div className="grid grid-cols-12 gap-3 md:gap-4">
          <div className="bento col-span-12 md:col-span-7 p-6 md:p-7 flex flex-col justify-between min-h-[180px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-crimson" />
              <span className="small-caps text-[10px]">Liminal Codex</span>
            </div>
            <div>
              <h1 className="display-serif text-3xl md:text-4xl text-foreground leading-[1.1] text-balance mt-3">
                A quiet place for thinking,
                <span className="italic text-crimson"> sealed in your browser.</span>
              </h1>
              <p className="body-text text-muted-foreground mt-3 max-w-xl text-pretty">
                {notes.length === 0
                  ? "An empty page waiting for your first thought. Press ⌘N to begin."
                  : `${notes.length} note${notes.length === 1 ? "" : "s"} kept locally. Nothing leaves this device.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button onClick={() => navigate("/note/new")} className="btn btn-primary px-4 py-2 text-sm">
                <Plus className="w-4 h-4" /> New note
                <kbd className="ml-1 mono text-[10px] px-1.5 py-0.5 rounded bg-background/20 border border-background/30">⌘N</kbd>
              </button>
              <span className="mono text-[11px] text-muted-foreground ml-1">
                ⌘V to paste images · drag files anywhere
              </span>
            </div>
          </div>

          <StatTile className="col-span-6 md:col-span-5 md:col-start-8" label="Notes" value={notes.length} />
          <StatTile className="col-span-6 md:col-span-5 md:col-start-8" label="Words" value={stats.words.toLocaleString()} />
          <StatTile className="col-span-6 md:col-span-5 md:col-start-8" label="Media" value={stats.totalMedia} />
          <StatTile className="col-span-6 md:col-span-5 md:col-start-8" label="Today" value={stats.todayCount} accent />
        </div>
      </section>

      {/* Notes grid */}
      <main className="container max-w-6xl mx-auto px-5 md:px-8 py-8 flex-1 w-full">
        <div className="flex items-end justify-between mb-4">
          <h2 className="display-serif text-xl text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            {query ? `Results for "${query}"` : "Your notes"}
          </h2>
          <span className="mono text-[11px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "note" : "notes"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bento h-48 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bento max-w-xl mx-auto p-10 text-center space-y-4">
            <div className="mx-auto wax-seal animate-seal">
              <Feather className="w-4 h-4" />
            </div>
            <h3 className="display-serif text-2xl text-foreground">
              {query ? "Nothing matches that search" : "Your codex is empty"}
            </h3>
            <p className="body-text text-muted-foreground">
              {query
                ? "Try a different word, or clear the search to see everything."
                : "Start writing. Paste a screenshot. Drop a file. Everything stays on this device."}
            </p>
            {!query && (
              <button
                onClick={() => navigate("/note/new")}
                className="btn btn-wax px-5 py-2.5 text-sm mx-auto"
              >
                <Feather className="w-4 h-4" />
                Write the first note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((n) => (
              <NoteCard key={n.id} note={n} onDelete={() => handleDelete(n)} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-5 md:px-8 py-4 flex flex-wrap items-center justify-between gap-2 mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="wax-dot" />
            Encrypted in your browser
          </span>
          <span className="hidden sm:inline">⌘K search · ⌘N new · ⌘V paste · ⌘S save</span>
          <span>The Codex · MMXXVI</span>
        </div>
      </footer>
    </div>
  );
};

const StatTile = ({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) => (
  <div className="bento col-span-6 sm:col-span-3 md:col-span-5/3 lg:col-auto p-4 flex flex-col justify-between min-h-[88px] md:min-h-[180px]"
       style={{ gridColumn: "span 6 / span 6" }}>
    <span className="small-caps text-[10px] text-muted-foreground">{label}</span>
    <div className={`display-serif text-3xl md:text-4xl mt-2 ${accent ? "text-crimson" : "text-foreground"}`}>
      {value}
    </div>
  </div>
);

export default Index;
