import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const source = "https://download.geonames.org/export/dump/cities15000.zip";
const temp = await mkdtemp(join(tmpdir(), "place-explorer-geonames-"));
const archive = join(temp, "cities15000.zip");

try {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`GeoNames download failed with ${response.status}`);
  await writeFile(archive, Buffer.from(await response.arrayBuffer()));

  const tsv = execFileSync("unzip", ["-p", archive, "cities15000.txt"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const cities = tsv
    .trim()
    .split("\n")
    .map((line) => {
      const fields = line.split("\t");
      return [
        fields[1],
        fields[2],
        fields[8],
        Number(fields[4]),
        Number(fields[5]),
        Number(fields[14] || 0),
      ];
    });

  await writeFile(
    new URL("../src/data/geonames.generated.json", import.meta.url),
    JSON.stringify(cities)
  );
  console.log(`Wrote ${cities.length.toLocaleString()} GeoNames cities.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
