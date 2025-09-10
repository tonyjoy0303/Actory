import { glob } from "glob";
import fs from "fs/promises";

const files = await glob(["**/*.jsx", "!node_modules/**", "!dist/**", "!build/**"]);
let cleaned = 0;

const hasNamespaceImport = (src) => /(^|\n)\s*import\s+\*\s+as\s+React\s+from\s+['\"]react['\"];?/i.test(src);
const defaultImportPattern = /(^|\n)\s*import\s+React\s+from\s+['\"]react['\"];?\s*(\r?\n)?/i;

for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  if (hasNamespaceImport(src) && defaultImportPattern.test(src)) {
    const out = src.replace(defaultImportPattern, (m, leadingNewline) => leadingNewline || "");
    if (out !== src) {
      await fs.writeFile(file, out, "utf8");
      cleaned++;
      console.log(`Removed duplicate default React import in: ${file}`);
    }
  }
}

console.log(`Done. Files cleaned: ${cleaned}`);
