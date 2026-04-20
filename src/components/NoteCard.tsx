import { useEffect, useState } from "react";
import { getMediaMany, type Note, type MediaAttachment } from "@/lib/db";
import { Trash2, Image as ImageIcon, Music, Film, Paperclip } from "lucide-react";
import { CornerFlourish } from "./Ornament";

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [note.mediaIds]);

  return (
    <article
      onClick={onOpen}
      className="note-card parchment relative rounded-sm cursor-pointer overflow-hidden group"
    >
      <CornerFlourish position="tl" />
      <CornerFlourish position="tr" />
      <CornerFlourish position="bl" />
      <CornerFlourish position="br" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-crimson-deep/90 text-gold-pale border border-gold-deep flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:scale-110"
        aria-label="Burn this scroll"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {preview && (
        <div className="relative h-40 overflow-hidden border-b-2 border-gold-deep/50">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
        </div>
      )}

      <div className="relative p-6 space-y-3">
        <h3 className="font-display text-xl text-ink leading-tight line-clamp-2 pr-8">
          {note.title}
        </h3>

        {note.body && (
          <p className="text-ink-faded leading-relaxed text-base line-clamp-4 italic">
            {note.body}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gold-deep/30 text-xs font-display uppercase tracking-wider text-ink-faded">
          <span>{fmtDate(note.updatedAt)}</span>
          {note.mediaIds.length > 0 && (
            <div className="flex items-center gap-2 text-crimson">
              {counts.img > 0 && (
                <span className="flex items-center gap-0.5">
                  <ImageIcon className="w-3.5 h-3.5" /> {counts.img}
                </span>
              )}
              {counts.vid > 0 && (
                <span className="flex items-center gap-0.5">
                  <Film className="w-3.5 h-3.5" /> {counts.vid}
                </span>
              )}
              {counts.aud > 0 && (
                <span className="flex items-center gap-0.5">
                  <Music className="w-3.5 h-3.5" /> {counts.aud}
                </span>
              )}
              {counts.other > 0 && (
                <span className="flex items-center gap-0.5">
                  <Paperclip className="w-3.5 h-3.5" /> {counts.other}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
