import { useEffect, useState } from "react";
import { FileText, Music, Film, File as FileIcon, X } from "lucide-react";
import type { MediaAttachment } from "@/lib/db";

export const MediaThumb = ({
  media,
  onRemove,
}: {
  media: MediaAttachment;
  onRemove?: () => void;
}) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const u = URL.createObjectURL(media.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [media.blob]);

  const isImage = media.type.startsWith("image/");
  const isVideo = media.type.startsWith("video/");
  const isAudio = media.type.startsWith("audio/");

  return (
    <div className="group relative rounded-sm overflow-hidden border-2 border-gold-deep/60 bg-parchment-dark/40 shadow-md">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-crimson-deep text-gold-pale opacity-0 group-hover:opacity-100 transition flex items-center justify-center border border-gold-deep"
          aria-label="Remove attachment"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {isImage && url && (
        <img src={url} alt={media.name} className="w-full h-32 object-cover" />
      )}
      {isVideo && url && (
        <video src={url} className="w-full h-32 object-cover" controls={!onRemove} muted />
      )}
      {isAudio && url && (
        <div className="p-3 h-32 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-parchment-light to-parchment-dark">
          <Music className="w-8 h-8 text-crimson" />
          <audio src={url} controls className="w-full" />
        </div>
      )}
      {!isImage && !isVideo && !isAudio && (
        <a
          href={url}
          download={media.name}
          className="p-3 h-32 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-parchment-light to-parchment-dark hover:bg-parchment-dark transition"
        >
          <FileIcon className="w-10 h-10 text-ink-faded" />
          <span className="text-xs font-display text-ink-faded">Download</span>
        </a>
      )}
      <div className="px-2 py-1 bg-ink/85 text-gold-pale text-xs font-display truncate">
        {media.name}
      </div>
    </div>
  );
};
