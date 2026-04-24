import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteNote, listNotes, type Note } from "@/lib/db";
import { NoteCard } from "@/components/NoteCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Search, Feather, Lock, BookOpen, ScrollText, Image as ImageIcon, Clock, ArrowDownAZ, ArrowDownWideNarrow } from "lucide-react";
import { toast } from "sonner";
import { lockVault } from "@/lib/vault";

const ROMAN = [
  ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
  ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
  ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1],
] as const;
const toRoman = (n: number) => {
  let s = ""; let v = n;
  for (const [sym, val] of ROMAN) { while (v >= (val as number)) { s += sym; v -= val as number; } }
  return s;
};
const LATIN_MONTHS = [
  "Ianuarius","Februarius","Martius","Aprilis","Maius","Iunius",
  "Iulius","Augustus","September","October","November","December",
];
const LATIN_DAYS = ["Dies Solis","Dies Lunae","Dies Martis","Dies Mercurii","Dies Iovis","Dies Veneris","Dies Saturni"];

type SortMode = "recent" | "oldest" | "title" | "largest";

const Index = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [filter, setFilter] = useState<"all" | "withMedia" | "today">("all");

  const refresh = async () => {
    setLoading(true);
    const all = await listNotes();
    setNotes(all);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

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

  const stats = useMemo(() => {
    const totalMedia = notes.reduce((acc, n) => acc + n.mediaIds.length, 0);
    const words = notes.reduce(
      (acc, n) => acc + (n.body.trim() ? n.body.trim().split(/\s+/).length : 0), 0,
    );
    const today = new Date().setHours(0, 0, 0, 0);
    const todayCount = notes.filter((n) => n.updatedAt >= today).length;
    const lastTouched = notes[0]?.updatedAt ?? null;
    return { totalMedia, words, todayCount, lastTouched };
  }, [notes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = new Date().setHours(0, 0, 0, 0);
    let arr = notes.filter((n) => {
      if (filter === "withMedia" && n.mediaIds.length === 0) return false;
      if (filter === "today" && n.updatedAt < today) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    });
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case "oldest": return a.updatedAt - b.updatedAt;
        case "title": return a.title.localeCompare(b.title);
        case "largest": return b.body.length - a.body.length;
        default: return b.updatedAt - a.updatedAt;
      }
    });
    return arr;
  }, [notes, query, sort, filter]);

  const handleDelete = async (n: Note) => {
    if (!confirm(`Delete "${n.title}"? This cannot be undone.`)) return;
    await deleteNote(n.id);
    toast.success("Note deleted");
    refresh();
  };

  const now = useMemo(() => new Date(), []);
  const relativeLast = (t: number | null) => {
    if (!t) return "—";
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-6xl mx-auto px-5 md:px-8 pt-5 pb-6 w-full">
        {/* === MASTHEAD — single dense band === */}
        <div className="masthead px-5 md:px-7 py-4">
          {/* top dateline strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 small-caps text-[9px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="wax-dot" />
              {LATIN_DAYS[now.getDay()]} · {now.getDate()} {LATIN_MONTHS[now.getMonth()]} · A.D. {toRoman(now.getFullYear())}
            </span>
            <span className="hidden sm:inline">Vol. {toRoman(Math.max(1, notes.length))} · No. {toRoman(now.getDate())}</span>
          </div>

          <div className="double-rule my-3" />

          {/* main row: title + search + actions */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 shrink-0 group"
              aria-label="The Codex"
            >
              <span className="wax-seal shrink-0" style={{ width: "2.4rem", height: "2.4rem" }}>
                <Feather className="w-4 h-4" />
              </span>
              <span className="hidden sm:flex flex-col items-start leading-none">
                <span className="blackletter text-[26px] md:text-[30px] text-foreground tracking-wide">The&nbsp;Codex</span>
                <span className="small-caps text-[9px] text-muted-foreground mt-1">Privatum · Localis · Tuum</span>
              </span>
            </button>

            <div className="relative flex-1 min-w-0 max-w-xl mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="global-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the codex…"
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
                <span className="hidden sm:inline">Inscribe</span>
                <kbd className="hidden md:inline-flex ml-1 mono text-[9px] px-1.5 py-0.5 rounded bg-background/20 border border-background/30">⌘N</kbd>
              </button>
            </div>
          </div>

          <div className="gold-rule my-3" />

          {/* bottom stats strip — useful, dense */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground">
            <span className="stat-inline">
              <ScrollText className="w-3.5 h-3.5 text-crimson" />
              <span className="num">{notes.length}</span>
              <span className="lbl">Scrolls · {toRoman(Math.max(1, notes.length))}</span>
            </span>
            <span className="stat-inline">
              <BookOpen className="w-3.5 h-3.5 text-gold-deep" />
              <span className="num">{stats.words.toLocaleString()}</span>
              <span className="lbl">Words</span>
            </span>
            <span className="stat-inline">
              <ImageIcon className="w-3.5 h-3.5 text-gold-deep" />
              <span className="num">{stats.totalMedia}</span>
              <span className="lbl">Relics</span>
            </span>
            <span className="stat-inline">
              <Feather className="w-3.5 h-3.5 text-crimson" />
              <span className="num">{stats.todayCount}</span>
              <span className="lbl">Hodie · Today</span>
            </span>
            <span className="stat-inline ml-auto">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="lbl">Last inscribed</span>
              <span className="num text-[0.95rem]">{relativeLast(stats.lastTouched)}</span>
            </span>
          </div>
        </div>

        {/* === FILTER + SORT BAR === */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => setFilter("all")} className={`chip ${filter === "all" ? "chip-active" : ""}`}>All</button>
            <button onClick={() => setFilter("today")} className={`chip ${filter === "today" ? "chip-active" : ""}`}>Hodie</button>
            <button onClick={() => setFilter("withMedia")} className={`chip ${filter === "withMedia" ? "chip-active" : ""}`}>With relics</button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="small-caps text-[9px] text-muted-foreground mr-1 hidden sm:inline">Sort</span>
            <button onClick={() => setSort("recent")} className={`chip ${sort === "recent" ? "chip-active" : ""}`}>
              <Clock className="w-3 h-3" /> Recent
            </button>
            <button onClick={() => setSort("oldest")} className={`chip ${sort === "oldest" ? "chip-active" : ""}`}>
              Oldest
            </button>
            <button onClick={() => setSort("title")} className={`chip ${sort === "title" ? "chip-active" : ""}`}>
              <ArrowDownAZ className="w-3 h-3" /> Title
            </button>
            <button onClick={() => setSort("largest")} className={`chip ${sort === "largest" ? "chip-active" : ""}`}>
              <ArrowDownWideNarrow className="w-3 h-3" /> Longest
            </button>
          </div>
        </div>

        {/* === NOTES GRID === */}
        <main className="flex-1">
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
          ) : visible.length === 0 ? (
            <div className="bento max-w-xl mx-auto p-10 text-center space-y-4 mt-8">
              <div className="mx-auto wax-seal animate-seal">
                <Feather className="w-4 h-4" />
              </div>
              <h3 className="display-serif text-2xl text-foreground">
                {query ? "Nothing matches that search" : notes.length === 0 ? "Thy codex lieth empty" : "No scrolls match this filter"}
              </h3>
              <p className="body-text text-muted-foreground">
                {query
                  ? "Try a different word, or clear the search to see everything."
                  : notes.length === 0
                  ? "Press ⌘N to inscribe the first scroll. Paste a screenshot. Drop a file. Everything stays on this device."
                  : "Adjust the filters above, or inscribe a new scroll."}
              </p>
              {!query && notes.length === 0 && (
                <button
                  onClick={() => navigate("/note/new")}
                  className="btn btn-wax px-5 py-2.5 text-sm mx-auto"
                >
                  <Feather className="w-4 h-4" />
                  Inscribe the first scroll
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((n) => (
                <NoteCard key={n.id} note={n} onDelete={() => handleDelete(n)} />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="mt-auto border-t border-border/50">
        <div className="container max-w-6xl mx-auto px-5 md:px-8 py-4 flex flex-wrap items-center justify-between gap-2 mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="wax-dot" />
            Encrypted in your browser
          </span>
          <span className="hidden sm:inline">⌘K search · ⌘N new · ⌘V paste · ⌘S save</span>
          <span>The Codex · Anno Domini MMXXVI</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
