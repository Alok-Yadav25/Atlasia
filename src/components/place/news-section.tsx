import { SectionCard } from "@/components/place/section-card";
import type { NewsItem } from "@/types/place";
import { ArrowUpRight, Newspaper } from "lucide-react";

interface NewsSectionProps {
  news: NewsItem[];
  configured: boolean;
}

export function NewsSection({ news, configured }: NewsSectionProps) {
  return (
    <SectionCard id="live" title="What the city is talking about" eyebrow="Recent news" icon={Newspaper} className="lg:col-span-7">
      {news.length > 0 ? (
        <div className="divide-y divide-border/65">
          {news.slice(0, 5).map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-primary uppercase">{item.source}</p>
                <h3 className="mt-1.5 text-sm font-medium leading-5 group-hover:underline">{item.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/55 p-4">
          <p className="text-sm font-medium">{configured ? "No matching headlines right now" : "News is ready to connect"}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{configured ? "The rest of the guide remains live." : "Add GNEWS_API_KEY to surface current headlines without exposing the key to the browser."}</p>
        </div>
      )}
    </SectionCard>
  );
}
