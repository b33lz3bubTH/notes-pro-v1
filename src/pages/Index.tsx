import { useEffect, useMemo, useState } from "react";
import { deleteNote, listNotes, type Note } from "@/lib/db";
import { NoteCard } from "@/components/NoteCard";
import { NoteEditor } from "@/components/NoteEditor";
import { Ornament, FleurDeLis } from "@/components/Ornament";
import { Plus, Search, Shield, Scroll } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const refresh = async () => {
    setLoading(true);
    const all = await listNotes();
    setNotes(all);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const handleDelete = async (n: Note) => {
    if (!confirm(`Cast "${n.title}" into the flames?`)) return;
    await deleteNote(n.id);
    toast.success("The scroll burns to ash");
    refresh();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative border-b-2 border-gold-deep/40 bg-gradient-to-b from-ink/8 to-transparent">
        <div className="container max-w-7xl mx-auto px-6 py-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-crimson">
            <FleurDeLis className="w-8 h-8" />
            <div className="wax-seal animate-seal">
              <Scroll className="w-6 h-6" />
            </div>
            <FleurDeLis className="w-8 h-8" />
          </div>
          <h1 className="blackletter text-6xl md:text-7xl text-ink leading-none tracking-wide">
            The Scribe's Codex
          </h1>
          <p className="font-display text-sm md:text-base uppercase tracking-[0.4em] text-ink-faded">
            A Private Repository of Thoughts &amp; Relics
          </p>
          <Ornament className="max-w-xl mx-auto" />
          <p className="font-serif italic text-ink-faded max-w-2xl mx-auto text-lg flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-forest" />
            Thy words remain within thine own vault — sealed by browser, seen by none
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="container max-w-7xl mx-auto px-6 py-8">
        <div className="gilded-frame flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faded pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Seek among the scrolls..."
              className="w-full bg-parchment-light/80 border-2 border-gold-deep/50 rounded-sm pl-11 pr-4 py-3 text-lg font-serif text-ink placeholder:text-ink-faded/60 focus:outline-none focus:border-crimson"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="btn-ink px-6 py-3 rounded-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            New Scroll
          </button>
        </div>
      </div>

      {/* Notes grid */}
      <main className="container max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <p className="text-center font-display tracking-widest text-ink-faded py-20">
            Unfurling thy scrolls...
          </p>
        ) : filtered.length === 0 ? (
          <div className="parchment max-w-2xl mx-auto rounded-sm p-12 text-center space-y-6 relative">
            <div className="flex justify-center">
              <Scroll className="w-16 h-16 text-crimson/70" />
            </div>
            <h2 className="font-display text-3xl text-ink">
              {query ? "No scroll matches thy query" : "Thy codex lies empty"}
            </h2>
            <p className="font-serif text-lg italic text-ink-faded">
              {query
                ? "Seek with different words, good scribe."
                : "Take up thy quill and inscribe thy first thought."}
            </p>
            {!query && (
              <button
                onClick={() => setCreating(true)}
                className="btn-gilded px-6 py-3 rounded-sm inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Begin the First Scroll
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onOpen={() => setEditing(n)}
                onDelete={() => handleDelete(n)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t-2 border-gold-deep/40 py-8 text-center">
        <Ornament className="max-w-md mx-auto mb-3" />
        <p className="font-display text-xs uppercase tracking-[0.3em] text-ink-faded">
          Anno Domini · Stored within thy Browser · {new Date().getFullYear()}
        </p>
      </footer>

      {(creating || editing) && (
        <NoteEditor
          note={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default Index;
