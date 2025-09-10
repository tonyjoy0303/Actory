import { glob } from "glob";
import fs from "fs/promises";

const files = await glob(["**/*.jsx", "!node_modules/**", "!dist/**", "!build/**"]);
let updated = 0;

const hasDefaultImport = (src) => /(^|\n)\s*import\s+React\s+from\s+['\"]react['\"];?/i.test(src);
const hasNamespaceImport = (src) => /(^|\n)\s*import\s+\*\s+as\s+React\s+from\s+['\"]react['\"];?/i.test(src);

for (const file of files) {
  const src = await fs.readFile(file, "utf8");

  // Only patch files that use React.createElement and have NO React import at all
  if (
    src.includes("React.createElement") &&
    !hasDefaultImport(src) &&
    !hasNamespaceImport(src)
  ) {
    const out = `import React from 'react'\n${src}`;
    await fs.writeFile(file, out, "utf8");
    updated++;
    console.log(`Added React import to: ${file}`);
  }
}

console.log(`Done. Files updated: ${updated}`);
