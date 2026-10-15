import { mkdir, writeFile } from 'node:fs/promises';

const families = [
  ['Cormorant+Garamond:ital,wght@0,400..700;1,400..700', 'cormorant'],
  ['Manrope:wght@400..800', 'manrope'],
];
await mkdir('public/fonts', { recursive: true });
for (const [family, name] of families) {
  const response = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Font CSS failed: ${response.status}`);
  const css = await response.text();
  const latinFaces = [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(match => match[1]);
  if (!latinFaces.length) throw new Error(`No Latin font found for ${name}`);
  for (const face of latinFaces) {
    const fontUrl = face.match(/url\(([^)]+)\)/)?.[1];
    const italic = face.includes('font-style: italic');
    const result = await fetch(fontUrl, { signal: AbortSignal.timeout(20000) });
    if (!result.ok) throw new Error(`Font file failed: ${result.status}`);
    const filename = `${name}${italic ? '-italic' : ''}.woff2`;
    await writeFile(`public/fonts/${filename}`, Buffer.from(await result.arrayBuffer()));
    console.log(`Saved ${filename}`);
  }
}
