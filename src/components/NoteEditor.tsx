import { useEffect, useRef, useState } from "react";
import { addMedia, createNote, getMediaMany, updateNote, type MediaAttachment, type Note } from "@/lib/db";
import { CornerFlourish, Ornament } from "./Ornament";
import { MediaThumb } from "./MediaThumb";
import { Paperclip, Save, X, Feather } from "lucide-react";
import { toast } from "sonner";

export const NoteEditor = ({
  note,
  onClose,
  onSaved,
}: {
  note: Note | null; // null => new
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-ink"
      style={{ background: "radial-gradient(ellipse at center, hsl(25 40% 12% / 0.7), hsl(25 40% 5% / 0.95))" }}
      onClick={onClose}
    >
      <div
        className="parchment relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-sm animate-page"
        onClick={(e) => e.stopPropagation()}
      >
        <CornerFlourish position="tl" />
        <CornerFlourish position="tr" />
        <CornerFlourish position="bl" />
        <CornerFlourish position="br" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-crimson-deep text-gold-pale border border-gold-deep flex items-center justify-center hover:scale-105 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-8 md:p-12 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 text-crimson">
              <Feather className="w-5 h-5" />
              <h2 className="font-display text-2xl tracking-widest uppercase">
                {note ? "Amend Thy Scroll" : "Pen a New Scroll"}
              </h2>
              <Feather className="w-5 h-5 -scale-x-100" />
            </div>
            <Ornament />
          </div>

          <div className="space-y-2">
            <label className="block font-display text-sm uppercase tracking-widest text-ink-faded">
              Heading
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank for Untitled..."
              className="w-full bg-parchment-light/60 border-b-2 border-gold-deep/70 px-3 py-2 text-2xl font-display text-ink placeholder:text-ink-faded/50 focus:outline-none focus:border-crimson focus:bg-parchment-light transition"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-display text-sm uppercase tracking-widest text-ink-faded">
              Body of the Note
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Inscribe thy thoughts here, by quill and candlelight..."
              className="w-full bg-parchment-light/60 border-2 border-gold-deep/40 rounded-sm px-4 py-3 text-lg leading-relaxed text-ink placeholder:text-ink-faded/50 focus:outline-none focus:border-crimson resize-y"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-display text-sm uppercase tracking-widest text-ink-faded">
                Affixed Relics
              </label>
              <button
                onClick={() => fileRef.current?.click()}
                className="btn-gilded px-4 py-2 rounded-sm text-sm flex items-center gap-2"
              >
                <Paperclip className="w-4 h-4" />
                Attach Media
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,application/pdf,.txt,.md"
                hidden
                onChange={(e) => {
                  handleAttach(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {media.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {media.map((m) => (
                  <MediaThumb key={m.id} media={m} onRemove={() => removeMedia(m.id)} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm italic text-ink-faded py-4 border border-dashed border-gold-deep/40 rounded-sm">
                No relics affixed to this scroll
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-ink px-8 py-3 rounded-sm flex items-center gap-3 text-base disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Sealing..." : note ? "Re-Seal Manuscript" : "Seal & Inscribe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
