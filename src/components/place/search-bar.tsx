"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { cities } from "@/data/cities";
import { cn } from "@/lib/utils";
import type { CitySuggestion } from "@/types/place";
import { ArrowRight, LocateFixed, MapPin, Search } from "lucide-react";
import { motion } from "motion/react";
import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import useSWR from "swr";

async function suggestionFetcher(url: string): Promise<{ suggestions: CitySuggestion[] }> {
  const response = await fetch(url);
  if (!response.ok) return { suggestions: [] };
  return (await response.json()) as { suggestions: CitySuggestion[] };
}

interface SearchBarProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (value: string) => void;
  compact?: boolean;
  className?: string;
}

export function SearchBar({
  id,
  value,
  onValueChange,
  onSearch,
  compact = false,
  className,
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const normalized = value.trim().toLocaleLowerCase();
  const deferredQuery = useDeferredValue(value.trim());
  const { data } = useSWR(
    deferredQuery.length >= 2 ? `/api/suggest?q=${encodeURIComponent(deferredQuery)}` : null,
    suggestionFetcher,
    { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const localSuggestions = useMemo(() => {
    if (!normalized) return cities.slice(0, 7);
    return cities
      .map((city) => {
        const name = city.name.toLocaleLowerCase();
        const full = `${city.name}, ${city.country}`.toLocaleLowerCase();
        const score = name.startsWith(normalized) ? 0 : full.includes(normalized) ? 1 : 2;
        return { city, score };
      })
      .filter(({ score }) => score < 2)
      .sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name))
      .slice(0, 7)
      .map(({ city }) => city);
  }, [normalized]);
  const suggestions = useMemo(() => {
    const combined = normalized
      ? [...(data?.suggestions ?? []), ...localSuggestions]
      : localSuggestions;
    const seen = new Set<string>();
    return combined.filter((city) => {
      const key = `${city.name}-${city.countryCode}`.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }, [data?.suggestions, localSuggestions, normalized]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.trim().length < 2) return;
    setOpen(false);
    onSearch(value.trim());
  }

  return (
    <form
      className={cn("relative w-full", className)}
      onSubmit={submit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Search any city or place
      </label>
      <motion.div
        layout
        animate={{
          scale: focused ? 1.018 : 1,
          boxShadow: focused
            ? "0 26px 80px -28px color-mix(in oklab, var(--primary) 62%, transparent)"
            : "0 22px 60px -35px rgba(0,0,0,.8)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={cn(
          "group relative flex items-center overflow-hidden rounded-full border border-white/15 bg-black/28 p-1.5 shadow-2xl backdrop-blur-2xl transition focus-within:border-white/35 focus-within:ring-4 focus-within:ring-white/8",
          compact ? "min-h-10 p-1" : "min-h-15 sm:min-h-17"
        )}
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/12 to-transparent"
          animate={{ x: focused ? "420%" : "0%", opacity: focused ? [0, 1, 0] : 0 }}
          transition={{ duration: 1.15, ease: "easeInOut" }}
        />
        <Search
          className={cn("ml-3 shrink-0 text-white/70", compact ? "size-4" : "size-5")}
          aria-hidden="true"
        />
        <Input
          id={id}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
          aria-expanded={open}
          className={cn(
            "h-auto flex-1 border-0 bg-transparent text-white shadow-none placeholder:text-white/55 focus-visible:ring-0 dark:bg-transparent",
            compact ? "px-2 text-sm" : "px-3 text-base sm:text-lg"
          )}
          placeholder={compact ? (value ? "Search another place" : "Search a city or place") : "Where do you want to go?"}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => { setOpen(true); setFocused(true); }}
          onBlur={() => setFocused(false)}
        />
        <button
          type="submit"
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-white text-black transition hover:scale-[1.03] hover:bg-white/90 active:scale-95 disabled:opacity-40",
            compact ? "size-8" : "size-11 sm:size-13"
          )}
          disabled={value.trim().length < 2}
          aria-label="Explore this place"
        >
          {compact ? <ArrowRight className="size-4" /> : <LocateFixed className="size-5" />}
        </button>
      </motion.div>

      {open && (
        <Command
          id={`${id}-suggestions`}
          className="absolute top-[calc(100%+0.6rem)] z-50 overflow-hidden rounded-2xl border-white/10 bg-popover/96 text-popover-foreground shadow-2xl backdrop-blur-2xl"
          shouldFilter={false}
        >
          <CommandList className="max-h-80 p-1.5">
            <CommandEmpty className="px-4 py-5 text-left text-sm text-muted-foreground">
              No local suggestion—press Enter to search the world.
            </CommandEmpty>
            <CommandGroup heading={normalized ? "Matching cities and places" : "Popular destinations"}>
              {suggestions.map((city) => {
                const fullName = `${city.name}, ${city.country}`;
                return (
                  <CommandItem
                    key={`${city.name}-${city.countryCode}`}
                    value={fullName}
                    className="gap-3 rounded-xl px-3 py-3"
                    onSelect={() => {
                      onValueChange(fullName);
                      onSearch(fullName);
                      setOpen(false);
                    }}
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-primary/8 text-primary">
                      <MapPin className="size-3.5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium">{city.name}</span>
                      <span className="text-xs text-muted-foreground">{city.country}</span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      )}
    </form>
  );
}
