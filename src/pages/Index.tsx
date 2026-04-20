import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteNote, listNotes, type Note } from "@/lib/db";
import { NoteCard } from "@/components/NoteCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Search, Shield, Scroll, Feather, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fortunes = [
  "A raven brings tidings from distant shores.",
  "Beware the ides — but rejoice in thy ink.",
  "He who inscribeth wisely, remembereth long.",
  "The quill is mightier than the broadsword.",
  "Fortune favours the diligent scribe.",
  "By candlelight, truth findeth its parchment.",
];

const Index = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(new Date());

  const refresh = async () => {
    setLoading(true);
    const all = await listNotes();
    setNotes(all);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const handleDelete = async (n: Note) => {
    if (!confirm(`Cast "${n.title}" into the flames?`)) return;
    await deleteNote(n.id);
    toast.success("The scroll burns to ash");
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

  const fortune = useMemo(
    () => fortunes[now.getDate() % fortunes.length],
    [now],
  );
  const hour = now.getHours();
  const period =
    hour < 6 ? { label: "Matins", icon: Moon }
    : hour < 12 ? { label: "Prime", icon: Sun }
    : hour < 18 ? { label: "Sext", icon: Sun }
    : { label: "Vespers", icon: Moon };
  const PeriodIcon = period.icon;

  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return (
    <div className="min-h-screen">
      {/* Newspaper masthead */}
      <header className="border-b-4 border-double border-ink/70">
        <div className="container max-w-7xl mx-auto px-4 pt-4 pb-2">
          {/* Top strip: date | fortune | theme toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-ink-faded border-b border-ink/30 pb-2 mb-3">
            <span className="flex items-center gap-1.5">
              <PeriodIcon className="w-3.5 h-3.5" />
              {period.label} · {dateStr}
            </span>
            <span className="hidden md:inline italic body-text normal-case tracking-normal text-sm text-crimson">
              "{fortune}"
            </span>
            <ThemeToggle />
          </div>

          {/* Title block */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-crimson text-[10px] uppercase tracking-[0.4em] mb-1">
              <span>· Vol. I ·</span>
              <span>No. {notes.length || "I"}</span>
              <span>· Est. MMXXV ·</span>
            </div>
            <h1 className="blackletter text-5xl md:text-7xl text-ink leading-none">
              The Scribe's Codex
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2 text-[10px] uppercase tracking-[0.35em] text-ink-faded">
              <span className="flex-1 h-px bg-ink/40" />
              <span className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-forest" />
                Privatus · Offline · Sealed by Browser
              </span>
              <span className="flex-1 h-px bg-ink/40" />
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-px mt-3 bg-ink/30 border border-ink/30 text-center">
            <Stat label="Scrolls" value={notes.length} />
            <Stat label="Words" value={stats.words.toLocaleString()} />
            <Stat label="Relics" value={stats.totalMedia} />
            <Stat label="This Day" value={stats.todayCount} />
            <Stat label="Hour" value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b-2 border-ink/40 bg-parchment-dark/30">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faded pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Seek among the scrolls..."
              className="w-full bg-parchment-light/80 border border-ink/40 rounded-sm pl-9 pr-3 py-2 text-ink placeholder:text-ink-faded/60 focus:outline-none focus:border-crimson"
            />
          </div>
          <button
            onClick={() => navigate("/note/new")}
            className="btn-ink px-5 py-2 rounded-sm flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Scroll
          </button>
        </div>
      </div>

      {/* Notes grid */}
      <main className="container max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-end justify-between border-b-2 border-ink/40 pb-1 mb-4">
          <h2 className="blackletter text-2xl md:text-3xl text-ink leading-none">
            {query ? "Search Results" : "Today's Chronicle"}
          </h2>
          <span className="text-[10px] uppercase tracking-[0.3em] text-ink-faded pb-1">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {loading ? (
          <p className="text-center tracking-widest text-ink-faded py-16 text-sm uppercase">
            Unfurling thy scrolls...
          </p>
        ) : filtered.length === 0 ? (
          <div className="parchment max-w-xl mx-auto rounded-sm p-8 text-center space-y-4 relative">
            <Scroll className="w-12 h-12 text-crimson/70 mx-auto" />
            <h3 className="text-2xl text-ink">
              {query ? "No scroll matcheth thy query" : "Thy codex lieth empty"}
            </h3>
            <p className="italic text-ink-faded body-text">
              {query
                ? "Seek with different words, good scribe."
                : "Take up thy quill and inscribe thy first thought."}
            </p>
            {!query && (
              <button
                onClick={() => navigate("/note/new")}
                className="btn-gilded px-5 py-2 rounded-sm inline-flex items-center gap-2 text-sm"
              >
                <Feather className="w-4 h-4" />
                Begin the First Scroll
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onDelete={() => handleDelete(n)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t-4 border-double border-ink/70 mt-6">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.3em] text-ink-faded">
          <span>Printed by Quill &amp; Candlelight</span>
          <span className="text-crimson">· Soli Deo Gloria ·</span>
          <span>Stored within thy Browser</span>
        </div>
      </footer>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-parchment-light/80 px-2 py-2">
    <div className="text-lg md:text-xl text-crimson leading-none">{value}</div>
    <div className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-ink-faded mt-1">
      {label}
    </div>
  </div>
);

export default Index;
