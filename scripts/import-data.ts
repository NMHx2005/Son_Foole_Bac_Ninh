import path from "node:path";
import { importDirectory } from "../src/lib/import/importFiles";

async function main() {
  const directory = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), "data_mau");

  const summaries = await importDirectory(directory);

  if (summaries.length === 0) {
    console.log(`No Excel/CSV files found in ${directory}`);
    return;
  }

  summaries.forEach((summary) => {
    console.log(
      [
        summary.filename,
        `created=${summary.created}`,
        `updated=${summary.updated}`,
        `unchanged=${summary.unchanged}`,
        `duplicates=${summary.duplicates}`,
        `errors=${summary.errors}`,
      ].join(" | "),
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
