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
  Trash2,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";

const fmtFull = (t: number) => {
  const d = new Date(t);
  return d.toLocaleString([], {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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
        toast.error("Note not found");
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
    toast.success(`${added.length} ${added.length > 1 ? "files" : "file"} attached`);
  }, []);

  const handleAttach = (files: FileList | null) => {
    if (!files) return;
    void ingestFiles(Array.from(files));
  };

  // Paste: clipboard images (snipping tool) and copied files
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const dt = e.clipboardData;
      if (!dt) return;
      const out: File[] = [];
      if (dt.files && dt.files.length) {
        for (const f of Array.from(dt.files)) out.push(f);
      } else if (dt.items) {
        for (const item of Array.from(dt.items)) {
          if (item.kind !== "file") continue;
          const blob = item.getAsFile();
          if (!blob) continue;
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

  // Drag & drop
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
        toast.success(`Saved: ${created.title}`);
        setDirty(false);
        navigate(`/note/${created.id}`, { replace: true });
      } else {
        const updated = await updateNote(id!, { title, body, mediaIds });
        if (updated) setNote(updated);
        toast.success("Saved");
        setDirty(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    await deleteNote(note.id);
    toast.success("Deleted");
    navigate("/");
  };

  const handleBack = () => {
    if (dirty && !confirm("You have unsaved changes. Leave anyway?")) return;
    navigate("/");
  };

  // Shortcuts
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
      <div className="min-h-screen flex items-center justify-center mono text-xs text-muted-foreground tracking-widest">
        loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Floating glass header */}
      <header className="sticky top-0 z-30">
        <div className="container max-w-3xl mx-auto px-4 md:px-6 pt-4">
          <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2">
            <button
              onClick={handleBack}
              className="btn btn-ghost px-3 py-1.5 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex-1 text-center min-w-0">
              <div className="small-caps text-[10px] text-muted-foreground flex items-center justify-center gap-2">
                {isNew ? "New note" : "Editing"}
                {dirty && <span className="wax-dot" style={{ width: 6, height: 6, boxShadow: "none" }} />}
                {dirty && <span className="text-crimson normal-case tracking-normal">unsaved</span>}
              </div>
              {note && (
                <div className="mono text-[10px] text-muted-foreground/70 mt-0.5 truncate hidden sm:block">
                  Updated {fmtFull(note.updatedAt)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              {!isNew && note && (
                <a
                  href={`/note/${note.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full glass-subtle text-foreground hover:border-crimson/50 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {!isNew && (
                <button
                  onClick={handleDelete}
                  title="Delete"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full glass-subtle text-crimson hover:bg-crimson hover:text-background hover:border-crimson transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || (!dirty && !isNew)}
                className="btn btn-wax px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor canvas */}
      <main className="container max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div className="animate-fade-up space-y-6">
          {/* Title — borderless, big, magazine-like */}
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            placeholder="Untitled"
            className="w-full bg-transparent border-0 px-0 py-2 display-serif text-4xl md:text-5xl font-semibold text-foreground placeholder:text-muted-foreground/40 placeholder:font-normal focus:outline-none text-balance"
            autoFocus={isNew}
          />

          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-3 mono text-[11px] text-muted-foreground border-y border-border/50 py-2">
            <span>{wc} words</span>
            <span className="text-border">·</span>
            <span>{cc} chars</span>
            {media.length > 0 && (
              <>
                <span className="text-border">·</span>
                <span>{media.length} attachment{media.length > 1 ? "s" : ""}</span>
              </>
            )}
            <span className="ml-auto hidden sm:inline">⌘S save · ESC back · ⌘V paste</span>
          </div>

          {/* Body — clean canvas */}
          <textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); markDirty(); }}
            placeholder="Start writing…"
            className="w-full bg-transparent border-0 px-0 py-2 body-text text-lg leading-[1.75] text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none"
            style={{ minHeight: "520px" }}
          />

          {/* Attachments */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="small-caps text-[10px] text-muted-foreground flex items-center gap-2">
                <Paperclip className="w-3 h-3" />
                Attachments
                {media.length > 0 && <span className="mono normal-case tracking-normal text-muted-foreground/70">({media.length})</span>}
              </h3>
              <button
                onClick={() => fileRef.current?.click()}
                className="btn btn-ghost px-3 py-1.5 text-xs"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Add
              </button>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {media.map((m) => (
                  <MediaThumb key={m.id} media={m} onRemove={() => removeMedia(m.id)} />
                ))}
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-center mono text-[11px] text-muted-foreground py-8 rounded-xl border border-dashed border-border hover:border-crimson/50 hover:text-foreground transition"
              >
                drop files · paste images (⌘V) · or click to browse
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-background/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-strong rounded-2xl px-8 py-6 border-2 border-dashed border-crimson/60 text-center">
            <Paperclip className="w-8 h-8 text-crimson mx-auto mb-2" />
            <div className="small-caps text-xs text-foreground">
              Drop to attach
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteEditorPage;
