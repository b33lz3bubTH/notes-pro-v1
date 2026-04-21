import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addMedia,
  createNote,
  deleteNote,
  getMediaMany,
  getNote,
  updateNote,
  type MediaAttachment,
  type Note,
} from "@/lib/db";
import { MediaThumb } from "@/components/MediaThumb";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Paperclip,
  Save,
  ArrowLeft,
  Feather,
  Trash2,
  ExternalLink,
  ClipboardPaste,
} from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const fmtFull = (t: number) => {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`;
};

const extFromMime = (mime: string) => {
  if (!mime) return "bin";
  const sub = mime.split("/")[1] || "bin";
  return sub.split(";")[0].split("+")[0];
};

const NoteEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [loaded, setLoaded] = useState(isNew);
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load existing
  useEffect(() => {
    let cancelled = false;
    if (isNew) {
      setNote(null);
      setTitle("");
      setBody("");
      setMedia([]);
      setLoaded(true);
      setDirty(false);
      return;
    }
    (async () => {
      const n = await getNote(id!);
      if (cancelled) return;
      if (!n) {
        toast.error("Scroll not found");
        navigate("/", { replace: true });
        return;
      }
      setNote(n);
      setTitle(n.title);
      setBody(n.body);
      const m = n.mediaIds.length ? await getMediaMany(n.mediaIds) : [];
      if (cancelled) return;
      setMedia(m);
      setLoaded(true);
      setDirty(false);
    })();
    return () => { cancelled = true; };
  }, [id, isNew, navigate]);

  const markDirty = () => setDirty(true);

  const ingestFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const added: MediaAttachment[] = [];
    for (const f of files) {
      const m = await addMedia(f);
      added.push(m);
    }
    setMedia((prev) => [...prev, ...added]);
    setDirty(true);
    toast.success(
      `${added.length} ${added.length > 1 ? "relics" : "relic"} affixed`,
    );
  }, []);

  const handleAttach = (files: FileList | null) => {
    if (!files) return;
    void ingestFiles(Array.from(files));
  };

  // Paste handler — supports clipboard images (snipping tool, screenshot)
  // and copied files. Falls back silently if clipboard contains only text.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const dt = e.clipboardData;
      if (!dt) return;
      const out: File[] = [];
      // Files take priority (e.g. copied from file explorer)
      if (dt.files && dt.files.length) {
        for (const f of Array.from(dt.files)) out.push(f);
      } else if (dt.items) {
        for (const item of Array.from(dt.items)) {
          if (item.kind !== "file") continue;
          const blob = item.getAsFile();
          if (!blob) continue;
          // Snipping tool / screenshots arrive without a filename
          const named =
            blob.name && blob.name !== "image.png"
              ? blob
              : new File(
                  [blob],
                  `pasted-${Date.now()}.${extFromMime(blob.type)}`,
                  { type: blob.type || "image/png" },
                );
          out.push(named);
        }
      }
      if (!out.length) return;
      e.preventDefault();
      void ingestFiles(out);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [ingestFiles]);

  // Drag & drop on the page
  useEffect(() => {
    let depth = 0;
    const onEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      depth++;
      setDragOver(true);
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragOver(false);
    };
    const onOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      depth = 0;
      setDragOver(false);
      void ingestFiles(Array.from(e.dataTransfer.files));
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [ingestFiles]);

  const removeMedia = (mid: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== mid));
    markDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const mediaIds = media.map((m) => m.id);
      if (isNew) {
        const created = await createNote({ title, body, mediaIds });
        toast.success(`Inscribed: ${created.title}`);
        setDirty(false);
        navigate(`/note/${created.id}`, { replace: true });
      } else {
        const updated = await updateNote(id!, { title, body, mediaIds });
        if (updated) setNote(updated);
        toast.success("Manuscript preserved");
        setDirty(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    if (!confirm(`Cast "${note.title}" into the flames?`)) return;
    await deleteNote(note.id);
    toast.success("The scroll burns to ash");
    navigate("/");
  };

  const handleBack = () => {
    if (dirty && !confirm("Thou hast unsaved changes. Leave anyway?")) return;
    navigate("/");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") handleBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, media, dirty]);

  // Warn on tab close with unsaved
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const wc = body.trim() ? body.trim().split(/\s+/).length : 0;
  const cc = body.length;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-faded text-sm uppercase tracking-[0.3em]">
        Unfurling scroll...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b-2 border-ink/50 bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4 py-2 flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ink hover:text-crimson transition px-2 py-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Codex
          </button>

          <div className="flex-1 text-center text-[10px] uppercase tracking-[0.3em] text-ink-faded">
            <span className="flex items-center justify-center gap-2">
              <Feather className="w-3 h-3" />
              {isNew ? "New Scroll" : "Amend Scroll"}
              {dirty && <span className="text-crimson">· unsaved</span>}
            </span>
            {note && (
              <div className="text-[9px] tracking-[0.2em] text-ink-faded/70 mt-0.5 hidden sm:block">
                Updated {fmtFull(note.updatedAt)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {!isNew && note && (
              <a
                href={`/note/${note.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-ink/40 bg-parchment-light/60 text-ink hover:bg-parchment-dark hover:border-crimson transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {!isNew && (
              <button
                onClick={handleDelete}
                title="Burn this scroll"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-ink/40 bg-parchment-light/60 text-crimson hover:bg-crimson hover:text-gold-pale transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || (!dirty && !isNew)}
              className="btn-ink px-4 py-1.5 rounded-sm flex items-center gap-1.5 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Sealing..." : isNew ? "Seal" : "Re-Seal"}
            </button>
          </div>
        </div>
      </header>

      {/* Manuscript page */}
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div
          className="parchment rounded-sm p-6 md:p-10 animate-page space-y-5"
        >
          {/* Title */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-crimson mb-1">
              Heading
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              placeholder="Leave blank for an untitled scroll..."
              className="w-full bg-transparent border-0 border-b border-ink/40 px-0 py-2 text-3xl md:text-4xl font-semibold text-ink placeholder:text-ink-faded/50 placeholder:font-normal placeholder:italic placeholder:text-xl focus:outline-none focus:border-crimson transition"
              autoFocus={isNew}
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase tracking-[0.3em] text-crimson">
                Body of the Note
              </label>
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-faded">
                {wc} words · {cc} chars
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); markDirty(); }}
              placeholder="Inscribe thy thoughts here, by quill and candlelight..."
              className="w-full bg-parchment-light/60 border border-ink/30 rounded-[2px] px-4 py-3 text-lg leading-relaxed text-ink placeholder:text-ink-faded/50 focus:outline-none focus:border-crimson focus:bg-parchment-light/90 resize-y body-text transition"
              style={{ fontFamily: "'Cormorant Garamond', serif", minHeight: "420px" }}
            />
          </div>

          {/* Media */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <label className="text-[10px] uppercase tracking-[0.3em] text-crimson">
                Affixed Relics {media.length > 0 && <span className="text-ink-faded ml-1">({media.length})</span>}
              </label>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-ink-faded">
                  <ClipboardPaste className="w-3 h-3" />
                  Paste · Drop · Attach
                </span>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 bg-parchment-dark/60 border border-ink/40 rounded-sm hover:bg-parchment-dark hover:border-crimson text-ink flex items-center gap-1.5 transition"
                >
                  <Paperclip className="w-3 h-3" />
                  Attach
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,application/pdf,.txt,.md"
                hidden
                onChange={(e) => { handleAttach(e.target.files); e.target.value = ""; }}
              />
            </div>
            {media.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {media.map((m) => (
                  <MediaThumb key={m.id} media={m} onRemove={() => removeMedia(m.id)} />
                ))}
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-center text-sm italic text-ink-faded py-6 border border-dashed border-ink/30 rounded-[2px] hover:border-crimson hover:text-crimson transition body-text"
              >
                No relics affixed — click, drop a file, or paste an image (⌘V)
              </button>
            )}
          </div>

          <div className="text-center text-[10px] uppercase tracking-[0.3em] text-ink-faded pt-2 border-t border-ink/20">
            ⌘S to seal · ESC for the codex · ⌘V to paste images
          </div>
        </div>
      </main>

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="parchment px-8 py-6 rounded-sm border-2 border-dashed border-crimson text-center">
            <Paperclip className="w-8 h-8 text-crimson mx-auto mb-2" />
            <div className="text-sm uppercase tracking-[0.3em] text-ink">
              Release to affix as a relic
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditorPage;
