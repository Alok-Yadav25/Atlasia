import { SectionCard } from "@/components/place/section-card";
import type { VideoItem } from "@/types/place";
import { Clapperboard, Play } from "lucide-react";
import Image from "next/image";

interface VideosSectionProps {
  videos: VideoItem[];
  configured: boolean;
}

export function VideosSection({ videos, configured }: VideosSectionProps) {
  return (
    <SectionCard title="Watch before you wander" eyebrow="Travel videos" icon={Clapperboard} className="lg:col-span-7">
      {videos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {videos.slice(0, 4).map((video) => (
            <a key={video.id} href={video.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border/65 bg-muted/25">
              <div className="relative aspect-video overflow-hidden">
                <Image src={video.thumbnailUrl} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 360px" className="object-cover transition duration-900 ease-out group-hover:scale-[1.14]" />
                <span className="absolute inset-0 grid place-items-center bg-black/15 transition group-hover:bg-black/30">
                  <span className="grid size-10 place-items-center rounded-full bg-white text-black shadow-xl"><Play className="ml-0.5 size-4 fill-current" /></span>
                </span>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-5">{video.title}</h3>
                <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{video.channel}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/55 p-4">
          <p className="text-sm font-medium">{configured ? "No travel videos matched" : "Video guides are one key away"}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{configured ? "Try another destination." : "Add YOUTUBE_API_KEY to enable place-specific video discovery."}</p>
        </div>
      )}
    </SectionCard>
  );
}
