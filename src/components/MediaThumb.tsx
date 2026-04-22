import { useEffect, useState } from "react";
import { Music, File as FileIcon, X } from "lucide-react";
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
    <div className="group relative rounded-xl overflow-hidden border border-border/60 bg-surface-2 shadow-sm transition hover:border-crimson/50 hover:shadow-md">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-background/80 backdrop-blur-md text-foreground opacity-0 group-hover:opacity-100 transition flex items-center justify-center border border-border hover:bg-crimson hover:text-background hover:border-crimson"
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
        <div className="p-3 h-32 flex flex-col items-center justify-center gap-2">
          <Music className="w-7 h-7 text-crimson" />
          <audio src={url} controls className="w-full" />
        </div>
      )}
      {!isImage && !isVideo && !isAudio && (
        <a
          href={url}
          download={media.name}
          className="p-3 h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <FileIcon className="w-9 h-9" />
          <span className="mono text-[10px]">Download</span>
        </a>
      )}
      <div className="px-2.5 py-1.5 bg-background/60 backdrop-blur-md text-foreground text-[11px] mono truncate border-t border-border/60">
        {media.name}
      </div>
    </div>
  );
};
