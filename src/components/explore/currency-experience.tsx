"use client";

import { FeaturePageShell } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PlaceData } from "@/types/place";
import { ArrowDownUp, ArrowRight, Calculator, LoaderCircle, RefreshCw } from "lucide-react";
import { useState, type FormEvent } from "react";

const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "CNY", "AUD", "CAD", "CHF", "SGD", "AED", "THB", "BRL", "MXN", "KRW", "ZAR", "TRY", "IDR", "MYR", "NZD"];

interface Conversion {
  rate: number;
  result: number;
  updatedAt: string | null;
}

function Converter({ data }: { data: PlaceData }) {
  const local = data.currency?.code ?? "EUR";
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState(local);
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function convert(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/currency?from=${from}&to=${to}&amount=${encodeURIComponent(amount)}`);
      const body = (await response.json()) as Conversion & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Conversion failed");
      setConversion(body);
    } catch (reason) {
      setConversion(null);
      setError(reason instanceof Error ? reason.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <Card className="overflow-hidden border-primary/15 bg-card/75">
        <CardContent className="p-6 sm:p-8">
          <Badge variant="outline"><Calculator className="size-3" /> Live converter</Badge>
          <form onSubmit={convert} className="mt-7 space-y-5">
            <div><label htmlFor="currency-amount" className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Amount</label><Input id="currency-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 h-14 text-2xl font-semibold" /></div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <CurrencySelect label="From" value={from} onChange={setFrom} extra={local} />
              <Button type="button" size="icon" variant="outline" onClick={() => { setFrom(to); setTo(from); setConversion(null); }} aria-label="Swap currencies"><ArrowDownUp className="size-4" /></Button>
              <CurrencySelect label="To" value={to} onChange={setTo} extra={local} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Convert</Button>
          </form>
          {error && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
      <Card className="flex min-h-80 items-center bg-[radial-gradient(circle_at_top,var(--weather-glow,rgba(56,189,248,.14)),transparent_60%),var(--card)]">
        <CardContent className="w-full p-8 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{amount || "0"} {from}</p>
          <ArrowRight className="mx-auto my-6 size-6 text-primary" />
          <p className="font-mono text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{conversion ? conversion.result.toLocaleString("en", { maximumFractionDigits: 2 }) : "—"}</p>
          <p className="mt-3 text-lg text-muted-foreground">{to}</p>
          {conversion && <p className="mt-8 text-xs leading-5 text-muted-foreground">1 {from} = {conversion.rate.toLocaleString("en", { maximumFractionDigits: 5 })} {to}. Indicative market rate; card and cash providers may differ.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function CurrencySelect({ label, value, onChange, extra }: { label: string; value: string; onChange: (value: string) => void; extra: string }) {
  const options = Array.from(new Set([extra, ...currencies]));
  return <label className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">{options.map((code) => <option key={code}>{code}</option>)}</select></label>;
}

export function CurrencyExperience() {
  return <FeaturePageShell eyebrow="Money tools" title={(place) => `Make the numbers work in ${place}`} description="Convert into the destination currency with a current keyless market-rate fallback and a clear reminder that your actual card or cash rate can differ.">{(data) => <Converter key={data.currency?.code ?? data.overview.name} data={data} />}</FeaturePageShell>;
}
