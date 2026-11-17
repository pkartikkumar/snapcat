import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

const ROUTES = [
  {
    slug: 'compress',
    title: 'Free Image Compressor down to 5 KB & 20 KB — SnapCat',
    description:
      'Compress JPG, PNG, SVG, or WebP images down to exact targets like 5 KB, 20 KB, and 50 KB for government exam forms. 100% client-side with zero uploads.',
    h1: 'Compress IMAGE — Reduce Photo Size Down to 5 KB & 20 KB',
    body: 'Reduce JPG, PNG, SVG, and WebP file sizes locally inside your browser without uploading sensitive ID cards or photos to any server. Ideal for SSC, UPSC, passport, and visa portals.',
  },
  {
    slug: 'resize',
    title: 'Bulk Image Resizer with Exact Dimensions — SnapCat',
    description:
      'Resize images in bulk by exact pixel width and height or percentage scale directly in your browser. Fast, free, and 100% private.',
    h1: 'Resize IMAGE — Bulk Pixel & Percentage Image Resizer',
    body: 'Define exact pixel dimensions or scale multiple photos by percentage simultaneously inside your browser with zero quality degradation and zero server uploads.',
  },
  {
    slug: 'transparent',
    title: 'In-Browser AI Background Remover & Cutout — SnapCat',
    description:
      'Remove photo backgrounds automatically using local WebAssembly AI, color keyer, and studio backdrops. Free transparent PNG maker with zero uploads.',
    h1: 'Transparent PNG — Free In-Browser AI Background Remover',
    body: 'Erase image backgrounds automatically using local browser AI, apply solid passport photo backdrops, and export high-resolution transparent PNGs with zero server tracking.',
  },
  {
    slug: 'convert',
    title: 'Fast Image Converter (JPG, PNG, WebP, HEIC) — SnapCat',
    description:
      'Batch convert images between WebP, PNG, JPG, and HEIC formats with custom compression quality 100% locally in your browser.',
    h1: 'Convert Format — Bulk WebP, PNG, JPG & HEIC Image Converter',
    body: 'Convert photos between modern WebP, transparent PNG, JPEG, and Apple HEIC formats in bulk directly on your device hardware.',
  },
  {
    slug: 'pdf',
    title: 'Convert Photos & Documents to A4 PDF — SnapCat',
    description:
      'Combine multiple JPG and PNG images into a clean, print-ready A4 PDF document locally in your browser. Zero uploads, instant download.',
    h1: 'Images to PDF — Combine Multiple Photos into Printable A4 PDF',
    body: 'Merge scanned certificates, mark sheets, and photos into a single ordered A4 PDF document directly in your browser without uploading private files.',
  },
  {
    slug: 'editor',
    title: 'Free Online Image Cropper & Aspect Ratio Tool — SnapCat',
    description:
      'Crop, rotate, flip, and adjust photo aspect ratios for documents and social media locally in your browser with zero uploads.',
    h1: 'Crop & Edit — Free Online Photo Cropper & Aspect Ratio Editor',
    body: 'Precision crop and rotate images to exact aspect ratios for official application forms, ID cards, and social posts 100% privately in your browser.',
  },
  {
    slug: 'html-to-image',
    title: 'HTML and Webpage Snapshot to High-Res Image — SnapCat',
    description:
      'Convert raw HTML/CSS code or webpage layouts into crisp high-DPI PNG or JPG images directly inside your browser.',
    h1: 'HTML to IMAGE — Convert HTML/CSS & Webpages to High-DPI PNG or JPG',
    body: 'Render clean HTML and CSS snippets or web layouts into high-resolution PNG and JPEG graphics instantaneously inside your browser.',
  },
  {
    slug: 'watermark',
    title: 'Batch Watermark Photos with Text or Logo — SnapCat',
    description:
      'Protect your photos and documents by stamping custom text or logo watermarks in bulk locally in your browser.',
    h1: 'Watermark IMAGE — Stamp Custom Text or Logo Over Photos in Seconds',
    body: 'Add custom typography, opacity, rotation, and tiled or positioned watermarks across multiple images locally without uploading to third-party servers.',
  },
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const baseHtml = fs.readFileSync(templatePath, 'utf-8');

for (const route of ROUTES) {
  const url = `https://www.snapcat.in/${route.slug}`;
  const safeTitle = escapeHtml(route.title);
  const safeDesc = escapeHtml(route.description);

  let pageHtml = baseHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(
      /<meta name="title" content="[^"]*"\s*\/>/,
      `<meta name="title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${safeDesc}" />`
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${url}" />`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${url}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta name="twitter:url" content="[^"]*"\s*\/>/,
      `<meta name="twitter:url" content="${url}" />`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${safeDesc}" />`
    )
    .replace(
      /<div id="root">[\s\S]*?<\/div>\s*<script type="module"/,
      `<div id="root">
      <main>
        <h1>${escapeHtml(route.h1)}</h1>
        <p>${escapeHtml(route.body)}</p>
        <nav aria-label="All SnapCat Tools">
          <a href="/">All Tools</a> |
          ${ROUTES.map((r) => `<a href="/${r.slug}">${escapeHtml(r.slug)}</a>`).join(' | ')}
        </nav>
      </main>
    </div>
    <script type="module"`
    );

  const routeDir = path.join(distDir, route.slug);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), pageHtml, 'utf-8');
  console.log(`Pre-rendered: /${route.slug}/index.html`);
}