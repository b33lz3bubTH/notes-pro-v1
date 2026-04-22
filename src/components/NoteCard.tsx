import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMediaMany, type Note, type MediaAttachment } from "@/lib/db";
import { Trash2, Image as ImageIcon, Music, Film, Paperclip } from "lucide-react";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (t: number) => {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};
const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

const relativeTime = (t: number) => {
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${fmtDate(t)}`;
};

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
      className="bento group flex flex-col p-0 no-underline animate-fade-up"
      title="Click to open · middle-click for new tab"
    >
      {preview && (
        <div className="relative h-36 overflow-hidden rounded-t-2xl">
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
          {totalRelics > 1 && (
            <span className="absolute top-2 right-2 mono text-[10px] px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-md border border-border/60 text-foreground">
              +{totalRelics - 1}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <div className="flex items-center justify-between text-[10px] mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="wax-dot" style={{ width: 6, height: 6, boxShadow: "none" }} />
            {fmtDate(note.updatedAt)} · {fmtTime(note.updatedAt)}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 hover:text-crimson transition-opacity"
            aria-label="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="display-serif text-lg leading-snug text-foreground line-clamp-2 text-balance">
          {note.title}
        </h3>

        {note.body ? (
          <p className="body-text text-[14px] leading-relaxed text-muted-foreground line-clamp-3">
            {note.body}
          </p>
        ) : (
          <p className="body-text text-[13px] italic text-muted-foreground/60">
            no inscription yet
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50">
          <span className="mono">{wc} {wc === 1 ? "word" : "words"} · {relativeTime(note.updatedAt)}</span>
          {totalRelics > 0 && (
            <span className="flex items-center gap-2 text-crimson/80">
              {counts.img > 0 && <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" />{counts.img}</span>}
              {counts.vid > 0 && <span className="flex items-center gap-0.5"><Film className="w-3 h-3" />{counts.vid}</span>}
              {counts.aud > 0 && <span className="flex items-center gap-0.5"><Music className="w-3 h-3" />{counts.aud}</span>}
              {counts.other > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{counts.other}</span>}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
