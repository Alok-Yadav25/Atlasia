import { SectionCard } from "@/components/place/section-card";
import { Badge } from "@/components/ui/badge";
import type { NotablePerson } from "@/types/place";
import { ExternalLink, Users } from "lucide-react";
import Image from "next/image";

interface PeopleSectionProps {
  people: NotablePerson[];
}

export function PeopleSection({ people }: PeopleSectionProps) {
  return (
    <SectionCard id="people" title="People who shaped the story" eyebrow="Born or associated" icon={Users} className="lg:col-span-7">
      {people.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {people.slice(0, 8).map((person) => (
            <a
              key={person.id}
              href={person.url ?? undefined}
              target={person.url ? "_blank" : undefined}
              rel={person.url ? "noreferrer" : undefined}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/65 bg-muted/25 p-3 transition hover:border-primary/30 hover:bg-muted/55"
            >
              <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {person.imageUrl ? (
                  <Image src={person.imageUrl} alt="" fill unoptimized sizes="44px" className="object-cover" />
                ) : (
                  person.name.split(" ").slice(0, 2).map((word) => word[0]).join("")
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-sm font-medium">{person.name}</h3>
                  {person.url && <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />}
                </div>
                <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">{person.occupation}</p>
                {person.party && <Badge variant="outline" className="mt-1.5 max-w-full truncate text-[9px]">{person.party}</Badge>}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Wikidata did not return matched politicians or artists for this exact birthplace.</p>
      )}
    </SectionCard>
  );
}
