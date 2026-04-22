import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteNote, listNotes, type Note } from "@/lib/db";
import { NoteCard } from "@/components/NoteCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Search, Feather, Lock, BookOpen, ScrollText, Quote } from "lucide-react";
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

const PROVERBS = [
  { la: "Verba volant, scripta manent.", en: "Spoken words fly; written words remain." },
  { la: "Littera scripta manet.", en: "The written letter endures." },
  { la: "Nulla dies sine linea.", en: "Not a day without a line." },
  { la: "Festina lente.", en: "Make haste, slowly." },
  { la: "Memoria minuitur nisi eam exerceas.", en: "Memory fades unless exercised." },
];

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

  const now = useMemo(() => new Date(), []);
  const proverb = useMemo(
    () => PROVERBS[now.getDate() % PROVERBS.length],
    [now],
  );

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

      {/* Hero — illuminated chronicle */}
      <section className="container max-w-6xl mx-auto px-5 md:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
          {/* Left: vellum chronicle */}
          <div className="vellum lg:col-span-8 p-5 md:p-7">
            {/* Dateline */}
            <div className="flex flex-wrap items-center justify-between gap-2 small-caps text-[10px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="wax-dot" />
                {LATIN_DAYS[now.getDay()]} · {now.getDate()} {LATIN_MONTHS[now.getMonth()]}
              </span>
              <span>Anno Domini · {toRoman(now.getFullYear())}</span>
            </div>
            <div className="gold-rule-thick my-3" />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_240px] gap-5 items-start">
              {/* Illuminated opening */}
              <div className="min-w-0">
                <p className="display-serif text-[15px] md:text-[16px] leading-[1.55] text-foreground drop-cap text-pretty">
                  {notes.length === 0
                    ? "Here beginneth thy private codex — a quiet place sealed within this very browser. No scribe, no server, no stranger reads what thou dost inscribe. Press ⌘N to set the first quill to vellum."
                    : `Welcome back, scribe. ${notes.length} ${notes.length === 1 ? "scroll lieth" : "scrolls lie"} kept under wax and key, ${stats.words.toLocaleString()} words inked in all. ${stats.todayCount > 0 ? `${stats.todayCount} ${stats.todayCount === 1 ? "scroll was" : "scrolls were"} touched this very day.` : "None hath been touched this day — perchance now?"}`}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <button onClick={() => navigate("/note/new")} className="btn btn-wax px-4 py-2 text-sm">
                    <Feather className="w-4 h-4" /> Inscribe new scroll
                    <kbd className="ml-1 mono text-[10px] px-1.5 py-0.5 rounded bg-background/20 border border-background/30">⌘N</kbd>
                  </button>
                  <span className="mono text-[11px] text-muted-foreground ml-1">
                    ⌘V paste · drag · drop relics
                  </span>
                </div>
              </div>

              {/* Vertical gold divider */}
              <div className="hidden md:block w-px self-stretch bg-gradient-to-b from-transparent via-gold-deep/40 to-transparent" />

              {/* Recent scrolls — manicule list */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 small-caps text-[10px] text-muted-foreground mb-2">
                  <ScrollText className="w-3 h-3 text-crimson" />
                  Recent scrolls
                </div>
                {notes.length === 0 ? (
                  <p className="body-text italic text-[13px] text-muted-foreground/70">
                    None yet inscribed.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {notes.slice(0, 4).map((n) => (
                      <li key={n.id} className="text-[13px] leading-snug truncate">
                        <span className="manicule">❦</span>
                        <Link
                          to={`/note/${n.id}`}
                          className="display-serif text-foreground hover:text-crimson transition-colors"
                          title={n.title}
                        >
                          {n.title || "Untitled"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer proverb */}
            <div className="gold-rule mt-5 mb-3" />
            <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <Quote className="w-3.5 h-3.5 text-gold-deep mt-0.5 shrink-0" />
              <p className="body-text italic leading-snug">
                <span className="text-foreground">{proverb.la}</span>
                <span className="mx-1.5 text-gold-deep">·</span>
                <span>{proverb.en}</span>
              </p>
            </div>
          </div>

          {/* Right: tight stat tiles */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 md:gap-4 grid-rows-2">
            <StatTile label="Scrolls" value={notes.length} roman />
            <StatTile label="Words" value={stats.words.toLocaleString()} />
            <StatTile label="Relics" value={stats.totalMedia} />
            <StatTile label="Today" value={stats.todayCount} accent roman />
          </div>
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

const StatTile = ({
  label,
  value,
  accent,
  roman,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  roman?: boolean;
}) => {
  const numeric = typeof value === "number" ? value : null;
  const showRoman = roman && numeric !== null && numeric > 0 && numeric < 4000;
  return (
    <div className="bento p-4 flex flex-col justify-between min-h-[88px]">
      <span className="small-caps text-[10px] text-muted-foreground">{label}</span>
      <div className="mt-2">
        <div className={`display-serif text-3xl md:text-4xl leading-none ${accent ? "text-crimson" : "text-foreground"}`}>
          {value}
        </div>
        {showRoman && (
          <div className="mono text-[10px] text-muted-foreground/70 mt-1.5 tracking-wider">
            {toRoman(numeric!)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
