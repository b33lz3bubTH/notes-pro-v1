import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMediaMany, type Note, type MediaAttachment } from "@/lib/db";
import { Trash2, Image as ImageIcon, Music, Film, Paperclip, Quote } from "lucide-react";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (t: number) => {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};
const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export const NoteCard = ({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: () => void;
}) => {
  const [preview, setPreview] = useState<string>("");
  const [counts, setCounts] = useState({ img: 0, vid: 0, aud: 0, other: 0 });

  useEffect(() => {
    if (!note.mediaIds.length) {
      setPreview("");
      setCounts({ img: 0, vid: 0, aud: 0, other: 0 });
      return;
    }
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

  const wc = wordCount(note.body);
  const totalRelics = note.mediaIds.length;

  return (
    <Link
      to={`/note/${note.id}`}
      className="group relative block bg-parchment-light/70 border border-ink/40 rounded-[2px] overflow-hidden hover:border-crimson hover:shadow-[0_8px_24px_-8px_hsl(var(--ink)/0.5)] hover:-translate-y-0.5 transition-all duration-200 no-underline"
      style={{ backgroundImage: "var(--paper-texture)" }}
      title="Click to open · double-click or middle-click to open in new tab"
    >
      {/* Top dateline strip */}
      <div className="flex items-center justify-between px-3 py-1 bg-ink text-gold-pale text-[10px] uppercase tracking-[0.2em]">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-crimson" />
          {fmtDate(note.updatedAt)} · {fmtTime(note.updatedAt)}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="opacity-60 hover:opacity-100 hover:text-crimson transition"
          aria-label="Delete scroll"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {preview && (
        <div className="relative h-28 overflow-hidden border-b border-ink/40">
          <img src={preview} alt="" className="w-full h-full object-cover sepia-[0.25] contrast-105 dark:sepia-0 dark:grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-parchment-light/60 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-3 space-y-2">
        <h3 className="text-base leading-tight text-ink font-semibold line-clamp-2 tracking-wide">
          {note.title}
        </h3>

        {note.body ? (
          <div className="relative pl-3 border-l-2 border-crimson/50">
            <Quote className="absolute -left-1 -top-1 w-2.5 h-2.5 text-crimson bg-parchment-light" />
            <p className="text-[13px] leading-snug text-ink-faded italic line-clamp-3 body-text">
              {note.body}
            </p>
          </div>
        ) : (
          <p className="text-[12px] italic text-ink-faded/60 body-text">
            — no inscription —
          </p>
        )}

        <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-ink/30 text-[10px] uppercase tracking-[0.15em] text-ink-faded">
          <span>{wc} {wc === 1 ? "word" : "words"}</span>
          {totalRelics > 0 && (
            <span className="flex items-center gap-1.5 text-crimson">
              {counts.img > 0 && <span className="flex items-center gap-0.5"><ImageIcon className="w-2.5 h-2.5" />{counts.img}</span>}
              {counts.vid > 0 && <span className="flex items-center gap-0.5"><Film className="w-2.5 h-2.5" />{counts.vid}</span>}
              {counts.aud > 0 && <span className="flex items-center gap-0.5"><Music className="w-2.5 h-2.5" />{counts.aud}</span>}
              {counts.other > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-2.5 h-2.5" />{counts.other}</span>}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
