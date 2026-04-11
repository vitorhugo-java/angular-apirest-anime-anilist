import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_SITE_URL = 'https://animeseason.hugojava.dev';
const API_BASE_URL = 'https://api.jikan.moe/v4/seasons/now';
const MAX_PAGES = 10;
const REQUEST_DELAY_MS = 400;

const siteUrl = normalizeSiteUrl(process.env.SITE_URL ?? DEFAULT_SITE_URL);
const publicDir = resolve(process.cwd(), 'public');
const sitemapPath = resolve(publicDir, 'sitemap.xml');
const robotsPath = resolve(publicDir, 'robots.txt');

function normalizeSiteUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function sleep(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function fetchSeasonPage(page) {
  const url = `${API_BASE_URL}?limit=25&page=${page}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'anime-season-sitemap-generator/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch season data. Status ${response.status} on page ${page}.`);
  }

  return response.json();
}

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildSitemap(urls) {
  const nowIso = new Date().toISOString();
  const entries = urls
    .map((url) => {
      return [
        '  <url>',
        `    <loc>${xmlEscape(url)}</loc>`,
        `    <lastmod>${nowIso}</lastmod>`,
        '    <changefreq>daily</changefreq>',
        '    <priority>0.7</priority>',
        '  </url>'
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    ''
  ].join('\n');
}

function buildRobotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n');
}

async function getCurrentSeasonAnimeIds() {
  const ids = new Set();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await fetchSeasonPage(page);

    for (const anime of payload.data ?? []) {
      if (typeof anime.mal_id === 'number') {
        ids.add(anime.mal_id);
      }
    }

    const hasNext = payload.pagination?.has_next_page === true;
    if (!hasNext) {
      break;
    }

    await sleep(REQUEST_DELAY_MS);
  }

  return [...ids].sort((a, b) => a - b);
}

async function main() {
  const animeIds = await getCurrentSeasonAnimeIds();
  const baseUrls = [siteUrl, `${siteUrl}/anime`];
  const animeUrls = animeIds.map((id) => `${siteUrl}/anime/${id}`);
  const sitemapXml = buildSitemap([...baseUrls, ...animeUrls]);
  const robotsTxt = buildRobotsTxt();

  await mkdir(publicDir, { recursive: true });
  await Promise.all([
    writeFile(sitemapPath, sitemapXml, 'utf8'),
    writeFile(robotsPath, robotsTxt, 'utf8')
  ]);

  console.log(`Generated sitemap with ${animeUrls.length} anime URLs.`);
  console.log(`Wrote: ${sitemapPath}`);
  console.log(`Wrote: ${robotsPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
