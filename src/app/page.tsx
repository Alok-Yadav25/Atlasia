import { PlaceExplorer } from "@/components/place/place-explorer";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ place?: string | string[] }>;
}) {
  const value = (await searchParams).place;
  const initialPlace = typeof value === "string" && value.trim().length >= 2 ? value.trim() : null;
  return <PlaceExplorer initialPlace={initialPlace} />;
}
