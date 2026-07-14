import { SectionCard } from "@/components/place/section-card";
import type { CurrencyData } from "@/types/place";
import { ArrowLeftRight } from "lucide-react";

interface CurrencySectionProps {
  currency: CurrencyData | null;
}

export function CurrencySection({ currency }: CurrencySectionProps) {
  return (
    <SectionCard title="Money map" eyebrow="Currency" icon={ArrowLeftRight} className="lg:col-span-4">
      {currency ? (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-4xl font-semibold tracking-tight">{currency.symbol}</p>
              <p className="mt-2 text-sm font-medium">{currency.name}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">{currency.code}</span>
          </div>
          <div className="mt-6 rounded-xl bg-muted/55 p-4">
            <p className="text-xs text-muted-foreground">1 USD is approximately</p>
            <p className="mt-1 font-mono text-xl font-semibold">
              {currency.rateFromUsd ? `${currency.rateFromUsd.toLocaleString("en", { maximumFractionDigits: 3 })} ${currency.code}` : "Rate unavailable"}
            </p>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Indicative rate. Your bank or card may use a different rate.</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Currency data is not available for this place.</p>
      )}
    </SectionCard>
  );
}
