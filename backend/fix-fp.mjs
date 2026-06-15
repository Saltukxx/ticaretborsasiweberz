import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const baseDir = "C:\\Users\\satog\\OneDrive\\Desktop\\ticaretborsasi\\backend\\src\\modules";

function walk(dir) {
  const results = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) results.push(...walk(full));
    else if (name.endsWith(".routes.ts")) results.push(full);
  }
  return results;
}

const files = walk(baseDir);
let changed = 0;

for (const file of files) {
  const original = readFileSync(file, "utf8");
  if (!original.includes('from "fastify-plugin"')) continue;

  const lines = original.split("\n");

  // 1. Find the `export const NAME = fp(` line
  let fpIdx = -1;
  let pluginName = "";
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^export const (\w+) = fp\($/);
    if (m) { fpIdx = i; pluginName = m[1]; break; }
  }
  if (fpIdx === -1) { console.warn("SKIP (no match):", file); continue; }

  // Line fpIdx:     export const NAME = fp(
  // Line fpIdx+1:     async (fastify) => {      (2-space indent)
  // Body lines: fpIdx+2 .. N-4 (4-space indent)
  // Line N-3:       },
  // Line N-2:       { name: "..." },
  // Line N-1:     );
  // Line N:       (empty trailing newline)

  // Verify the next line is the async arrow
  const arrowLine = lines[fpIdx + 1];
  if (!arrowLine.match(/^\s+async \(fastify\) => \{$/)) {
    console.warn("SKIP (unexpected arrow line):", file, "|", arrowLine);
    continue;
  }

  // Find the closing: last non-empty line should be `)` or `);`
  // Work backwards from end to find `  },` then `  { name: ... },` then `);`
  let endIdx = lines.length - 1;
  while (endIdx >= 0 && lines[endIdx].trim() === "") endIdx--;
  // endIdx → `);`
  if (lines[endIdx].trim() !== ");") {
    console.warn("SKIP (last non-empty not `);`):", file, "|", lines[endIdx]);
    continue;
  }
  const nameLineIdx = endIdx - 1; // `  { name: "..." },`
  const closeBraceIdx = endIdx - 2; // `  },`

  if (!lines[nameLineIdx].trim().startsWith("{ name:")) {
    console.warn("SKIP (name line mismatch):", file, "|", lines[nameLineIdx]);
    continue;
  }
  if (lines[closeBraceIdx].trim() !== "},") {
    console.warn("SKIP (closing brace mismatch):", file, "|", lines[closeBraceIdx]);
    continue;
  }

  // Extract body lines (fpIdx+2 .. closeBraceIdx-1), dedent by 2 spaces
  const bodyLines = lines.slice(fpIdx + 2, closeBraceIdx).map((l) =>
    l.startsWith("  ") ? l.slice(2) : l
  );

  // Build new file lines
  const before = lines.slice(0, fpIdx);
  const after = lines.slice(endIdx + 1);

  const newLines = [
    ...before,
    `export async function ${pluginName}(fastify: FastifyInstance) {`,
    ...bodyLines,
    `}`,
    ...after,
  ];

  let newContent = newLines.join("\n");

  // Remove `import fp from "fastify-plugin";\n`
  newContent = newContent.replace(/^import fp from "fastify-plugin";\r?\n/m, "");

  // Add FastifyInstance to the fastify import if not already there
  if (!newContent.includes("FastifyInstance")) {
    if (newContent.match(/import type \{[^}]+\} from "fastify"/)) {
      // Add to existing type import
      newContent = newContent.replace(
        /import type \{ ([^}]+) \} from "fastify"/,
        (_, imports) => `import type { FastifyInstance, ${imports} } from "fastify"`
      );
    } else if (newContent.includes('from "fastify"')) {
      // There's a non-type import — add FastifyInstance as type import before it
      newContent = newContent.replace(
        /^(import (?:type )?\{[^}]+\} from "fastify".*)$/m,
        `import type { FastifyInstance } from "fastify";\n$1`
      );
    } else {
      // No fastify import at all — prepend
      newContent = `import type { FastifyInstance } from "fastify";\n` + newContent;
    }
  }

  writeFileSync(file, newContent);
  console.log("Fixed:", file.replace(baseDir, "").replace(/\\/g, "/"));
  changed++;
}

console.log(`\nDone. ${changed}/${files.length} files transformed.`);
