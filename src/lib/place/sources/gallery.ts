import { searchCommonsPhotos } from "@/lib/place/sources/media";
import type { GalleryCategory, GalleryData, GalleryPhoto, PlacePhoto } from "@/types/features";

const categoryQueries: Array<{ category: GalleryCategory; suffix: string }> = [
  { category: "city", suffix: "cityscape travel" },
  { category: "architecture", suffix: "landmark architecture" },
  { category: "food", suffix: "cuisine food" },
  { category: "nature", suffix: "nature park wildlife" },
  { category: "culture", suffix: "culture festival street" },
];

function uniquePhotos(photos: GalleryPhoto[]): GalleryPhoto[] {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    if (seen.has(photo.url)) return false;
    seen.add(photo.url);
    return true;
  });
}

export async function fetchPlaceGallery(
  placeName: string,
  dishes: string[] = []
): Promise<GalleryData> {
  const categoryResults = await Promise.allSettled(
    categoryQueries.map(async ({ category, suffix }) => {
      const query = `"${placeName}" ${suffix}`;
      const photos = await searchCommonsPhotos(query, 8, 1400);
      return photos.map<GalleryPhoto>((photo) => ({ ...photo, category, query }));
    })
  );

  const photos = uniquePhotos(
    categoryResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
  ).slice(0, 30);

  const groups = Object.fromEntries(
    categoryQueries.map(({ category }) => [
      category,
      photos.filter((photo) => photo.category === category),
    ])
  ) as GalleryData["groups"];

  const dishResults = await Promise.allSettled(
    dishes.slice(0, 6).map(async (dish) => {
      const results = await searchCommonsPhotos(`${dish} ${placeName} food`, 4, 1100);
      return [dish, results.slice(0, 3)] as const;
    })
  );
  const dishPhotos = Object.fromEntries(
    dishResults.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
  ) as Record<string, PlacePhoto[]>;

  return {
    query: placeName,
    photos,
    groups,
    dishPhotos,
    note: "Images come from Wikimedia Commons and retain their source attribution.",
  };
}
