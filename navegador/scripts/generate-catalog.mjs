import { readdir, readFile, access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const output = path.resolve(scriptDir, '../src/lib/catalog.json');
const repoUrl = 'https://github.com/Diego2326/planificacion-computacion-2027';
const levels = [
  { folder: 'Primaria', label: 'Primaria' },
  { folder: 'Basico', label: 'Básico' },
  { folder: 'Bachillerato', label: 'Bachillerato' },
];
const bimestreNames = ['Bimestre I', 'Bimestre II', 'Bimestre III', 'Bimestre IV'];

function githubUrl(relativePath, raw = false) {
  const encoded = relativePath.split(path.sep).map(encodeURIComponent).join('/');
  return raw
    ? `https://raw.githubusercontent.com/Diego2326/planificacion-computacion-2027/main/${encoded}`
    : `${repoUrl}/blob/main/${encoded}`;
}

function getUnitTitle(markdown, bimestreIndex) {
  const lines = markdown.split(/\r?\n/);
  const heading = lines.find((line) => /^##\s+Bimestre\s/.test(line) &&
    new RegExp(`Bimestre\\s+(?:${['I', 'II', 'III', 'IV'][bimestreIndex]}|${bimestreIndex + 1})\\b`, 'i').test(line));
  const inline = heading?.match(/^##\s+Bimestre\s+[^—–-]+\s*[—–-]\s*(.+)$/);
  if (inline?.[1]) return inline[1].trim();
  const start = heading ? lines.indexOf(heading) : -1;
  if (start >= 0) {
    for (const line of lines.slice(start + 1)) {
      if (line.startsWith('## ')) break;
      const subheading = line.match(/^###\s+(.+)$/);
      if (subheading) return subheading[1].trim();
    }
  }
  return bimestreNames[bimestreIndex];
}

async function exists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

const grades = [];
for (const level of levels) {
  const levelPath = path.join(repoRoot, level.folder);
  const dirs = (await readdir(levelPath, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

  for (const slug of dirs) {
    const gradeDir = path.join(levelPath, slug);
    const id = `${level.folder.toLowerCase()}-${slug}`;
    const planFiles = [];
    for (let b = 1; b <= 4; b += 1) {
      const bimester = `B${b}`;
      const markdownPath = path.join(gradeDir, `${bimester}.md`);
      const markdown = await readFile(markdownPath, 'utf8');
      const sheets = [...markdown.matchAll(/- \[Hoja (\d+): (.*?) \(PDF\)\]\(([^)]+\.pdf)\)/g)]
        .map((match) => {
          const relativePdf = path.normalize(path.join(level.folder, slug, match[3]));
          return {
            number: Number(match[1]),
            title: match[2].trim(),
            url: githubUrl(relativePdf, true),
          };
        });
      const relativePlan = path.join(level.folder, slug, `${bimester}.md`);
      planFiles.push({
        id: `${id}-${bimester.toLowerCase()}`,
        code: bimester,
        label: bimestreNames[b - 1],
        title: getUnitTitle(markdown, b - 1),
        planUrl: githubUrl(relativePlan),
        sheets,
      });
    }

    const sampleMarkdown = await readFile(path.join(gradeDir, 'B1.md'), 'utf8');
    const gradeMatch = sampleMarkdown.match(/^#\s+.*?—\s+(.+?)\s+—\s+(?:Bimestre|B[1-4])\b/m);
    const label = gradeMatch?.[1]?.trim() ?? slug.replaceAll('_', ' ');
    const yearPdfPath = path.join('Materiales_para_imprimir', level.folder, slug, `Anual_${slug}_2027.pdf`);
    const htmlPath = path.join('Materiales_para_imprimir', level.folder, slug, `Editable_${slug}_2027.html`);
    const planningDocx = path.join(gradeDir, `Planificacion_${slug}_2027.docx`);
    const sheetCount = planFiles.reduce((sum, b) => sum + b.sheets.length, 0);

    grades.push({
      id,
      label,
      level: level.label,
      levelKey: level.folder,
      bimesters: planFiles,
      sheetCount,
      yearPdfUrl: await exists(path.join(repoRoot, yearPdfPath)) ? githubUrl(yearPdfPath, true) : null,
      htmlUrl: await exists(path.join(repoRoot, htmlPath)) ? githubUrl(htmlPath) : null,
      planningDocxUrl: await exists(path.join(gradeDir, planningDocx)) ? githubUrl(path.join(level.folder, slug, path.basename(planningDocx)), true) : null,
    });
  }
}

await writeFile(output, `${JSON.stringify({ levels: levels.map(({ folder, label }) => ({ key: folder, label })), grades }, null, 2)}\n`);
console.log(`Generated catalogue: ${grades.length} grades, ${grades.reduce((n, g) => n + g.bimesters.length, 0)} bimesters, ${grades.reduce((n, g) => n + g.sheetCount, 0)} individual sheets.`);
