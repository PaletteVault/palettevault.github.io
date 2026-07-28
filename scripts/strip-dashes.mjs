/**
 * ============================================================================
 *  REMOVE EM AND EN DASHES FROM THE SOURCE
 * ============================================================================
 *
 *  A blind swap of "—" for "-" produces bad punctuation, because the em dash
 *  is doing three different jobs in this codebase and each one wants a
 *  different replacement:
 *
 *    1. A parenthetical break     "white with a hint of yellow — warm, soft"
 *       becomes a comma. This is by far the most common case.
 *    2. A title separator         "Ivory Color — Hex Code #FFFFF0"
 *       becomes a comma too, since these are already comma-heavy lists.
 *    3. A dash inside a range     rarely, an en dash between numbers
 *       becomes a plain hyphen with no spaces.
 *
 *  The rules below are ordered from most specific to least, and the script
 *  refuses to finish if any dash survives, so a case nobody anticipated stops
 *  the run instead of shipping half-converted text.
 *
 *  SKIPPED FILES
 *
 *  build-llms.mjs contains the dash characters on purpose: it is the
 *  sanitiser that maps them to ASCII for a plain-text file that browsers read
 *  as Windows-1252. Stripping the dashes there would delete the very mapping
 *  that prevents mojibake, which is a bug this project has already had once.
 * ============================================================================
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.argv[2] ?? '.';
const DRY = process.argv.includes('--dry');

const EXTENSIONS = new Set(['.astro', '.md', '.js', '.mjs', '.ts', '.css', '.json']);

/** Files whose dash characters are load-bearing. */
const SKIP = [
  'scripts/build-llms.mjs',
  'scripts/strip-dashes.mjs',
  'node_modules',
  'dist',
  '.astro',
  '.git',
];

const RULES = [
  // A range between digits: "10–20" keeps a bare hyphen.
  [/(\d)\s*[—–]\s*(\d)/g, '$1-$2'],

  // Spaced dash used as a parenthetical or separator. A comma reads naturally
  // in every instance of this that appears in the copy.
  [/\s+[—–]\s+/g, ', '],

  // Dash at the very start of a line, used as a bullet or an aside.
  [/^(\s*)[—–]\s+/gm, '$1- '],

  // Anything left: an unspaced dash between words, "light—dark".
  [/\s*[—–]\s*/g, ', '],
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full).split('\\').join('/');
    if (SKIP.some((s) => rel === s || rel.startsWith(`${s}/`) || entry === s)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

let changedFiles = 0;
let changedMarks = 0;

for (const file of walk(ROOT)) {
  const original = readFileSync(file, 'utf8');
  if (!/[—–]/.test(original)) continue;

  const before = (original.match(/[—–]/g) ?? []).length;
  let text = original;
  for (const [pattern, replacement] of RULES) text = text.replace(pattern, replacement);

  /*
   * Tidy the artefacts the substitutions leave behind.
   *
   * These rules are deliberately narrow, and one of them used to not be.
   *
   * A rule mapping a comma followed by whitespace and a full stop down to just
   * the full stop was meant to clean up "foo, ." after a substitution. It also
   * matched the comma that separates an object property from a spread on the
   * next line, deleting it and welding the property value directly onto the
   * three dots. That is a syntax error, and it silently mangled five files
   * across src/ and scripts/ before the build caught the first one.
   *
   * Two lessons, both paid for:
   *
   *   A punctuation cleanup running over source code cannot assume a dot ends
   *   a sentence. Nothing here may touch a character that carries meaning in
   *   JavaScript. Whitespace and doubled commas only.
   *
   *   The first search for damage covered src/ alone, so the copy in
   *   scripts/generate-palettes.mjs survived another round. Look everywhere
   *   the tool wrote, not everywhere the symptom appeared.
   */
  text = text
    .replace(/, ,/g, ',')
    .replace(/ ,/g, ',');

  /*
   * A dash that ended a line inside a block comment merged that line with the
   * next one, leaving a stray `*` in the middle. Split it back apart.
   */
  text = text.replace(/^(\s*\*.*?), \* (.*)$/gm, (_, head, tail, offset, whole) => {
    const indent = (whole.slice(0, offset).match(/(^|\n)(\s*)$/) ?? ['', '', ''])[2];
    return `${head}\n${indent}* ${tail}`;
  });

  const after = (text.match(/[—–]/g) ?? []).length;
  if (after !== 0) {
    console.error(`  UNCONVERTED in ${file}: ${after} dash(es) survived`);
    process.exitCode = 1;
    continue;
  }

  changedFiles += 1;
  changedMarks += before;
  if (!DRY) writeFileSync(file, text, 'utf8');
  console.log(`  ${DRY ? 'would fix' : 'fixed'}  ${before.toString().padStart(3)}  ${relative(ROOT, file)}`);
}

console.log(`\n  ${DRY ? 'would change' : 'changed'} ${changedMarks} marks across ${changedFiles} files`);
