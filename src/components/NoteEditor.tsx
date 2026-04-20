import { useEffect, useRef, useState } from "react";
import { addMedia, createNote, getMediaMany, updateNote, type MediaAttachment, type Note } from "@/lib/db";
import { MediaThumb } from "./MediaThumb";
import { Paperclip, Save, X, Feather, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const NoteEditor = ({
  note,
  onClose,
  onSaved,
}: {
  note: Note | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [media, setMedia] = useState<MediaAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note?.mediaIds.length) {
      getMediaMany(note.mediaIds).then(setMedia);
    } else {
      setMedia([]);
    }
  }, [note]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, media]);

  const handleAttach = async (files: FileList | null) => {
    if (!files) return;
    const added: MediaAttachment[] = [];
    for (const f of Array.from(files)) {
      const m = await addMedia(f);
      added.push(m);
    }
    setMedia((prev) => [...prev, ...added]);
    toast.success(`${added.length} relic${added.length > 1 ? "s" : ""} affixed`);
  };

  const removeMedia = (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const mediaIds = media.map((m) => m.id);
      if (note) {
        await updateNote(note.id, { title, body, mediaIds });
        toast.success("Manuscript preserved");
      } else {
        const created = await createNote({ title, body, mediaIds });
        toast.success(`Inscribed: ${created.title}`);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const wc = body.trim() ? body.trim().split(/\s+/).length : 0;
  const cc = body.length;
  const now = new Date();
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 animate-ink"
      style={{ background: "radial-gradient(ellipse at center, hsl(25 40% 12% / 0.75), hsl(25 40% 5% / 0.95))" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[94vh] flex flex-col rounded-[2px] bg-parchment-light border-2 border-ink/60 shadow-[0_30px_80px_-20px_hsl(25_40%_5%/0.9)] animate-page overflow-hidden"
        style={{ backgroundImage: "var(--paper-texture)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar — like a manuscript header */}
        <div className="flex items-center justify-between px-4 py-2 bg-ink text-gold-pale border-b-2 border-gold-deep">
          <div className="flex items-center gap-2">
            <Feather className="w-3.5 h-3.5 text-gold" />
            <span className="text-[11px] uppercase tracking-[0.3em]">
              {note ? "Amend Scroll" : "New Scroll"}
            </span>
            <span className="text-ink-faded text-[10px] hidden sm:inline">·</span>
            <span className="text-[10px] tracking-widest text-gold-pale/70 hidden sm:inline">
              {dateStr}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-crimson-deep transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Heading */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-crimson mb-1">
              Heading
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank for an untitled scroll..."
              className="w-full bg-transparent border-0 border-b border-ink/40 px-0 py-1.5 text-2xl font-semibold text-ink placeholder:text-ink-faded/50 placeholder:font-normal placeholder:italic placeholder:text-base focus:outline-none focus:border-crimson transition"
              autoFocus={!note}
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
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Inscribe thy thoughts here, by quill and candlelight..."
              className="w-full bg-parchment/40 border border-ink/30 rounded-[2px] px-3 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-faded/50 focus:outline-none focus:border-crimson focus:bg-parchment-light/80 resize-y body-text transition"
              style={{ fontFamily: "'Cormorant Garamond', serif", minHeight: "180px" }}
            />
          </div>

          {/* Media */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-crimson">
                Affixed Relics {media.length > 0 && <span className="text-ink-faded ml-1">({media.length})</span>}
              </label>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 bg-parchment-dark/60 border border-ink/40 rounded-sm hover:bg-parchment-dark hover:border-crimson text-ink flex items-center gap-1.5 transition"
              >
                <Paperclip className="w-3 h-3" />
                Attach
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {media.map((m) => (
                  <MediaThumb key={m.id} media={m} onRemove={() => removeMedia(m.id)} />
                ))}
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-center text-xs italic text-ink-faded py-4 border border-dashed border-ink/30 rounded-[2px] hover:border-crimson hover:text-crimson transition body-text"
              >
                No relics affixed — click to attach images, audio, video or files
              </button>
            )}
          </div>
        </div>

        {/* Footer — sticky action bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t-2 border-ink/40 bg-parchment-dark/40">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-faded hidden sm:inline">
            ⌘S to seal · ESC to close
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="text-[11px] uppercase tracking-[0.2em] px-4 py-2 border border-ink/40 rounded-sm text-ink hover:bg-parchment-dark transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-ink px-5 py-2 rounded-sm flex items-center gap-2 text-[11px] disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Sealing..." : note ? "Re-Seal" : "Seal & Inscribe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
