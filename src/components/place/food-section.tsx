import { SectionCard } from "@/components/place/section-card";
import type { FoodHighlight } from "@/types/place";
import { CookingPot } from "lucide-react";

interface FoodSectionProps {
  food: FoodHighlight[];
  placeName: string;
}

export function FoodSection({ food, placeName }: FoodSectionProps) {
  return (
    <SectionCard title="Eat like you mean it" eyebrow="Local flavour" icon={CookingPot} className="lg:col-span-5">
      {food.length > 0 ? (
        <div className="space-y-5">
          {food.slice(0, 5).map((item) => (
            <article key={item.id} className="border-l border-primary/35 pl-4">
              <h3 className="font-medium">{item.name}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description || `A local food experience associated with ${placeName}.`}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/55 p-4">
          <p className="text-sm font-medium">Ask Atlasia for a food trail</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Wikivoyage did not return a structured eat section for {placeName}.</p>
        </div>
      )}
    </SectionCard>
  );
}
