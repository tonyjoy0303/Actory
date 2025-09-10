import { glob } from "glob";
import fs from "fs/promises";

const files = await glob(["**/*.jsx", "!node_modules/**", "!dist/**", "!build/**"]);
let fixed = 0;

// Matches: const _jsxFileName = "";import * as React from "react" (optionally with spaces and semicolon)
const mergedPattern = /const\s+_jsxFileName\s*=\s*"";\s*import\s+\*\s+as\s+React\s+from\s+["']react["'];?/g;

for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  if (mergedPattern.test(src)) {
    const out = src.replace(mergedPattern, 'const _jsxFileName = "";');
    if (out !== src) {
      await fs.writeFile(file, out, "utf8");
      fixed++;
      console.log(`Fixed merged _jsxFileName/React import in: ${file}`);
    }
  }
}

console.log(`Done. Files fixed: ${fixed}`);
