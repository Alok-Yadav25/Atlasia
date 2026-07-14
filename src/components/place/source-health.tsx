import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SourceStatus } from "@/types/place";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";

interface SourceHealthProps {
  sources: Record<string, SourceStatus>;
}

export function SourceHealth({ sources }: SourceHealthProps) {
  const entries = Object.entries(sources);
  const online = entries.filter(([, source]) => source.state === "ok").length;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Data pulse</p>
        <p className="mt-1 text-sm"><span className="font-mono font-medium">{online}/{entries.length}</span> sources contributed to this view</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, source]) => {
          const Icon = source.state === "ok" ? CircleCheck : source.state === "unconfigured" ? CircleDashed : CircleX;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="bg-card/45 text-[10px] text-muted-foreground">
                  <Icon className={source.state === "ok" ? "text-emerald-500" : source.state === "error" ? "text-rose-500" : "text-amber-500"} />
                  {source.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                <p>{source.message ?? "Source responded successfully."}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </section>
  );
}
