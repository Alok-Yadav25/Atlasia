"use client";

import { BrandMark } from "@/components/explore/brand-mark";
import { SearchBar } from "@/components/place/search-bar";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  BedDouble,
  BookOpenText,
  CalendarDays,
  HeartPulse,
  Images,
  Languages,
  Map,
  NotebookTabs,
  Plane,
  Scale,
  Soup,
  Sparkles,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const routes = [
  { href: "/", label: "Explore", icon: Map },
  { href: "/compare", label: "Compare", icon: Scale },
  { href: "/travel", label: "Travel", icon: Plane },
  { href: "/photos", label: "Photos", icon: Images },
  { href: "/traffic", label: "Traffic", icon: Gauge },
  { href: "/stay", label: "Stay", icon: BedDouble },
  { href: "/food", label: "Food", icon: Soup },
  { href: "/culture", label: "Movies & books", icon: BookOpenText },
  { href: "/essentials", label: "Essentials", icon: HeartPulse },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/events", label: "Events", icon: Sparkles },
  { href: "/stories", label: "Stories", icon: NotebookTabs },
  { href: "/translate", label: "Translate", icon: Languages },
  { href: "/currency", label: "Currency", icon: ArrowLeftRight },
];

interface FeatureNavProps {
  place: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  overlay?: boolean;
}

export function FeatureNav({
  place,
  searchValue,
  onSearchValueChange,
  onSearch,
  overlay = false,
}: FeatureNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalValue, setInternalValue] = useState(place);
  const value = searchValue ?? internalValue;
  const change = onSearchValueChange ?? setInternalValue;
  const submit = onSearch ?? ((next: string) => {
    setInternalValue(next);
    router.push(`${pathname}?place=${encodeURIComponent(next)}`);
  });

  return (
    <header className={cn(
      "z-50 border-b border-white/8 text-white backdrop-blur-2xl",
      overlay ? "fixed inset-x-0 top-0 bg-black/24" : "sticky top-0 bg-[#070a10]/88"
    )}>
      <div className="mx-auto flex h-16 max-w-[92rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={`/?place=${encodeURIComponent(place)}`} className="shrink-0">
          <BrandMark />
        </Link>
        <SearchBar
          id={`route-search-${pathname.replaceAll("/", "-") || "home"}`}
          compact
          value={value}
          onValueChange={change}
          onSearch={submit}
          className="mx-auto max-w-xl"
        />
      </div>
      <nav className="mx-auto flex max-w-[92rem] gap-1 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] sm:px-6 lg:px-8" aria-label="Explore tools">
        {routes.map((route) => {
          const Icon = route.icon;
          const active = pathname === route.href;
          const href = route.href === "/" ? `/?place=${encodeURIComponent(place)}` : `${route.href}?place=${encodeURIComponent(place)}`;
          return (
            <Link
              key={route.href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition",
                active ? "bg-white text-black" : "text-white/58 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className="size-3.5" /> {route.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
