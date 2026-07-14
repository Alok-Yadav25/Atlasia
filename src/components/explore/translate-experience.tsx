"use client";

import { FeaturePageShell } from "@/components/explore/feature-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { PlaceData } from "@/types/place";
import { Copy, Languages, LoaderCircle, MessageCircleMore, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

const languageCodes: Record<string, string> = { English: "en", French: "fr", Spanish: "es", German: "de", Hindi: "hi", Tamil: "ta", Italian: "it", Portuguese: "pt", Japanese: "ja", Korean: "ko", Chinese: "zh", Arabic: "ar", Dutch: "nl", Turkish: "tr", Thai: "th", Indonesian: "id", Malay: "ms", Vietnamese: "vi" };
const languageOptions = Object.entries(languageCodes);
const phraseSeeds = ["Hello", "Thank you", "Please", "How much is this?", "Where is the station?", "I need help"];

function TranslateBoard({ data }: { data: PlaceData }) {
  const destinationLanguage = useMemo(
    () => data.countryDetails.languages.find((language) => languageCodes[language] && languageCodes[language] !== "en")
      ?? data.countryDetails.languages.find((language) => languageCodes[language])
      ?? "French",
    [data.countryDetails.languages]
  );
  const [text, setText] = useState("Where is the nearest train station?");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState(languageCodes[destinationLanguage] ?? "fr");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [phraseResults, setPhraseResults] = useState<Record<string, string>>({});

  async function translateText(value: string) {
    const response = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value, from, to }) });
    const body = (await response.json()) as { translatedText?: string; error?: string };
    if (!response.ok || !body.translatedText) throw new Error(body.error ?? "Translation failed");
    return body.translatedText;
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    try { setResult(await translateText(text)); } catch (error) { toast.error(error instanceof Error ? error.message : "Translation failed"); } finally { setLoading(false); }
  }

  async function translatePhrase(phrase: string) {
    try { const translated = await translateText(phrase); setPhraseResults((current) => ({ ...current, [phrase]: translated })); } catch { toast.error("That phrase could not be translated right now."); }
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-card/75"><CardContent className="p-6"><div className="flex items-center justify-between"><Badge variant="outline"><Languages className="size-3" /> Translate</Badge><span className="text-xs text-muted-foreground">500 characters max</span></div><form onSubmit={submit} className="mt-5"><Textarea value={text} onChange={(event) => setText(event.target.value.slice(0, 500))} className="min-h-44 resize-none text-base leading-7" /><div className="mt-4 grid grid-cols-2 gap-3"><LanguageSelect label="From" value={from} onChange={setFrom} /><LanguageSelect label="To" value={to} onChange={setTo} /></div><Button className="mt-4 w-full" size="lg" disabled={loading || !text.trim()}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Translate</Button></form></CardContent></Card>
        <Card className="relative min-h-80 overflow-hidden bg-primary text-primary-foreground"><div className="absolute -right-20 -top-20 size-64 rounded-full border border-current/10" /><CardContent className="relative flex h-full min-h-80 flex-col p-7"><p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-60">Translation</p><p className="my-auto text-pretty text-3xl font-medium leading-tight">{result || "Your translated phrase will come to life here."}</p>{result && <Button variant="secondary" className="w-fit" onClick={() => { void navigator.clipboard.writeText(result); toast.success("Copied"); }}><Copy className="size-4" /> Copy</Button>}</CardContent></Card>
      </div>
      <section><p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Phrase cards</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Tap what you need</h2><p className="mt-2 text-sm text-muted-foreground">Languages reported for {data.overview.country}: {data.countryDetails.languages.join(", ") || "not listed"}.</p><div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{phraseSeeds.map((phrase) => <button key={phrase} onClick={() => void translatePhrase(phrase)} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-primary/30"><MessageCircleMore className="size-4 text-primary" /><p className="mt-4 font-medium">{phrase}</p><p className="mt-2 min-h-5 text-sm text-muted-foreground">{phraseResults[phrase] ?? "Tap to translate"}</p></button>)}</div></section>
      <p className="text-xs leading-5 text-muted-foreground">Machine translation can miss context, formality and local dialect. For medical, legal or emergency communication, use a qualified interpreter.</p>
    </div>
  );
}

function LanguageSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}<select className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={value} onChange={(event) => onChange(event.target.value)}>{languageOptions.map(([name, code]) => <option key={code} value={code}>{name}</option>)}</select></label>;
}

export function TranslateExperience() {
  return <FeaturePageShell eyebrow="Language bridge" title={(place) => `Say more in ${place}`} description="Translate short phrases and build a pocket set for transport, food and everyday help, with clear limits for high-stakes situations.">{(data) => <TranslateBoard key={data.overview.country} data={data} />}</FeaturePageShell>;
}
