import { transform } from "sucrase";
import { glob } from "glob";
import fs from "fs/promises";
import path from "path";

// Convert all TSX files across the project, excluding build/output/vendor dirs
const files = await glob(["**/*.tsx", "!node_modules/**", "!dist/**", "!build/**"], { dot: false });

if (files.length === 0) {
  console.log("No .tsx files found.");
  process.exit(0);
}

for (const file of files) {
  const code = await fs.readFile(file, "utf8");
  // Remove TypeScript types and keep JSX
  let out = transform(code, { transforms: ["typescript", "jsx"] }).code;
  // Rewrite any import specifiers that end with .tsx to .jsx
  out = out.replace(/(from\s+['\"])([^'\"]+?)\.tsx(['\"])/g, "$1$2.jsx$3");
  const outPath = file.replace(/\.tsx$/, ".jsx");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, out, "utf8");
  await fs.unlink(file);
  console.log(`Converted: ${file} -> ${outPath}`);
}

console.log("TSX -> JSX conversion complete.");
