import { glob } from "glob";
import fs from "fs/promises";

const files = await glob(["**/*.jsx", "!node_modules/**", "!dist/**", "!build/**"]);
let cleaned = 0;

const namespaceImportRegex = /import\s+\*\s+as\s+React\s+from\s+["']react["'];?/gi;

for (const file of files) {
  const src = await fs.readFile(file, "utf8");

  // Find all namespace import occurrences
  const matches = [...src.matchAll(namespaceImportRegex)];
  if (matches.length > 1) {
    // Keep the first occurrence; remove the rest
    let keepIndex = matches[0].index ?? 0;
    let out = src;

    // Remove subsequent matches from the end to avoid index shifts
    for (let i = matches.length - 1; i >= 1; i--) {
      const m = matches[i];
      const start = m.index ?? 0;
      const end = start + m[0].length;
      // Remove the import and any trailing newline/whitespace
      out = out.slice(0, start) + out.slice(end).replace(/^\s*\r?\n/, "");
    }

    if (out !== src) {
      await fs.writeFile(file, out, "utf8");
      cleaned++;
      console.log(`Removed duplicate React namespace imports in: ${file}`);
    }
  }
}

console.log(`Done. Files cleaned: ${cleaned}`);
