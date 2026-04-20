import { useEffect, useState } from "react";
import { getMediaMany, type Note, type MediaAttachment } from "@/lib/db";
import { Trash2, Image as ImageIcon, Music, Film, Paperclip } from "lucide-react";

const fmtDate = (t: number) => {
  const d = new Date(t);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};
const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const NoteCard = ({
  note,
  onOpen,
  onDelete,
}: {
  note: Note;
  onOpen: () => void;
  onDelete: () => void;
}) => {
  const [preview, setPreview] = useState<string>("");
  const [counts, setCounts] = useState({ img: 0, vid: 0, aud: 0, other: 0 });

  useEffect(() => {
    if (!note.mediaIds.length) return;
    let revoked: string | null = null;
    getMediaMany(note.mediaIds).then((m: MediaAttachment[]) => {
      const c = { img: 0, vid: 0, aud: 0, other: 0 };
      m.forEach((x) => {
        if (x.type.startsWith("image/")) c.img++;
        else if (x.type.startsWith("video/")) c.vid++;
        else if (x.type.startsWith("audio/")) c.aud++;
        else c.other++;
      });
      setCounts(c);
      const firstImg = m.find((x) => x.type.startsWith("image/"));
      if (firstImg) {
        const u = URL.createObjectURL(firstImg.blob);
        revoked = u;
        setPreview(u);
      }
    });
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, [note.mediaIds]);

  return (
    <article
      onClick={onOpen}
      className="note-card parchment relative rounded-sm cursor-pointer overflow-hidden group border border-ink/30"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-crimson-deep/95 text-gold-pale border border-gold-deep flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:scale-110"
        aria-label="Burn this scroll"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {preview && (
        <div className="relative h-24 overflow-hidden border-b border-ink/40">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
        </div>
      )}

      <div className="relative p-3 space-y-1.5">
        {/* Dateline */}
        <div className="flex items-center gap-1.5 text-[9px] font-display uppercase tracking-[0.2em] text-crimson border-b border-ink/30 pb-1">
          <span>{fmtDate(note.updatedAt)}</span>
          <span className="text-ink-faded">·</span>
          <span className="text-ink-faded">{fmtTime(note.updatedAt)}</span>
          {note.mediaIds.length > 0 && (
            <span className="ml-auto flex items-center gap-1.5 text-ink-faded">
              {counts.img > 0 && <span className="flex items-center gap-0.5"><ImageIcon className="w-2.5 h-2.5" />{counts.img}</span>}
              {counts.vid > 0 && <span className="flex items-center gap-0.5"><Film className="w-2.5 h-2.5" />{counts.vid}</span>}
              {counts.aud > 0 && <span className="flex items-center gap-0.5"><Music className="w-2.5 h-2.5" />{counts.aud}</span>}
              {counts.other > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-2.5 h-2.5" />{counts.other}</span>}
            </span>
          )}
        </div>

        <h3 className="font-display text-base text-ink leading-tight line-clamp-2 pr-6">
          {note.title}
        </h3>

        {note.body && (
          <p className="text-ink-faded leading-snug text-sm line-clamp-3 italic">
            {note.body}
          </p>
        )}
      </div>
    </article>
  );
};
