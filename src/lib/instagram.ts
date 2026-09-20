/**
 * Instagram URL Parser and Multi-Strategy Metadata Extractor
 * Optimized for Cloud Environments (Vercel / AWS Lambda) and Local Environments
 */

export interface ExtractedMeta {
  shortcode: string | null;
  normalizedUrl: string;
  creator?: string;
  caption?: string;
  thumbnail?: string;
}

export function parseInstagramUrl(rawUrl: string): { isValid: boolean; normalizedUrl: string; shortcode: string | null } {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return { isValid: false, normalizedUrl: '', shortcode: null };
    }

    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.includes('instagram.com') && !hostname.includes('instagr.am')) {
      return { isValid: false, normalizedUrl: '', shortcode: null };
    }

    // Match /reel/CODE, /reels/CODE, or /p/CODE
    const pathname = parsed.pathname;
    const match = pathname.match(/\/(reel|reels|p|share\/reel)\/([A-Za-z0-9_-]+)/);

    if (match && match[2]) {
      const shortcode = match[2];
      const normalizedUrl = `https://www.instagram.com/reel/${shortcode}/`;
      return { isValid: true, normalizedUrl, shortcode };
    }

    if (pathname.length > 3) {
      return { isValid: true, normalizedUrl: trimmed.split('?')[0], shortcode: null };
    }

    return { isValid: false, normalizedUrl: '', shortcode: null };
  } catch {
    return { isValid: false, normalizedUrl: '', shortcode: null };
  }
}

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x201c;/g, '“')
    .replace(/&#x201d;/g, '”')
    .replace(/&#x2192;/g, '→')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function isValidCreator(creator: string | undefined): boolean {
  if (!creator) return false;
  const lower = creator.toLowerCase().replace(/^@/, '').trim();
  const invalidNames = ['instagram', 'login', 'signup', 'accounts', 'explore', 'reels', 'p', 'reel', ''];
  return !invalidNames.includes(lower);
}

function parseFromOgTags(html: string): { creator?: string; caption?: string; thumbnail?: string } {
  let creator: string | undefined;
  let caption: string | undefined;
  let thumbnail: string | undefined;

  const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i) ||
                    html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);

  const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([\s\S]*?)["']/i);

  const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([\s\S]*?)["']/i);
  if (imgMatch && imgMatch[1]) {
    thumbnail = imgMatch[1].replace(/&amp;/g, '&');
  }

  const rawDesc = descMatch && descMatch[1] ? descMatch[1] : '';
  const rawTitle = titleMatch && titleMatch[1] ? titleMatch[1] : '';

  // 1. Extract creator username from description
  if (rawDesc) {
    const authorMatch = rawDesc.match(/-\s*([A-Za-z0-9._]+)\s+(?:on|pada)\s+/i);
    if (authorMatch && authorMatch[1] && isValidCreator(authorMatch[1])) {
      creator = `@${authorMatch[1]}`;
    }

    const captionQuotes = rawDesc.match(/:\s*(?:&quot;|"|“)([\s\S]*?)(?:&quot;|"|”)\.?\s*$/i) ||
                          rawDesc.match(/:\s*(?:&quot;|"|“)([\s\S]*)/i);
    if (captionQuotes && captionQuotes[1]) {
      caption = cleanHtmlEntities(captionQuotes[1]);
    }
  }

  // 2. Creator and caption fallback from title
  if (rawTitle) {
    if (!creator) {
      const titleAuthor = rawTitle.match(/^([^:]+)\s+(?:on Instagram|di Instagram):/i);
      if (titleAuthor && titleAuthor[1]) {
        const candidate = titleAuthor[1].trim();
        if (isValidCreator(candidate)) {
          creator = candidate.startsWith('@') ? candidate : `@${candidate.replace(/\s+/g, '_').toLowerCase()}`;
        }
      }
    }

    if (!caption) {
      const titleCaption = rawTitle.match(/:\s*(?:&quot;|"|“)([\s\S]*?)(?:&quot;|"|”)?\.?\s*$/i);
      if (titleCaption && titleCaption[1]) {
        caption = cleanHtmlEntities(titleCaption[1]);
      }
    }
  }

  return { creator, caption, thumbnail };
}

export async function fetchInstagramMetadata(url: string): Promise<ExtractedMeta> {
  const parsed = parseInstagramUrl(url);
  const result: ExtractedMeta = {
    shortcode: parsed.shortcode,
    normalizedUrl: parsed.normalizedUrl || url,
  };

  const targetUrl = parsed.shortcode
    ? `https://www.instagram.com/reel/${parsed.shortcode}/`
    : result.normalizedUrl;

  // Strategy 1: Official Public Instagram API v1 oEmbed Endpoint (Most reliable from Vercel/Cloud IPs)
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(targetUrl)}`;
    const oembedRes = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.author_name && isValidCreator(data.author_name)) {
        result.creator = `@${data.author_name.replace(/^@/, '')}`;
      }
      if (data.title && typeof data.title === 'string') {
        result.caption = cleanHtmlEntities(data.title);
      }
      if (data.thumbnail_url) {
        result.thumbnail = data.thumbnail_url;
      }

      if (result.creator && result.caption && result.caption.length > 10) {
        return result;
      }
    }
  } catch (err) {
    console.warn('[Instagram Metadata] Strategy 1 (oEmbed v1) failed:', err);
  }

  // Strategy 2: Mobile Safari User-Agent
  try {
    const mobileRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (mobileRes.ok) {
      const html = await mobileRes.text();
      const og = parseFromOgTags(html);
      if (isValidCreator(og.creator)) result.creator = og.creator;
      if (og.caption && og.caption.length > 10) result.caption = og.caption;
      if (og.thumbnail) result.thumbnail = og.thumbnail;

      if (result.creator && result.caption) {
        return result;
      }
    }
  } catch (err) {
    console.warn('[Instagram Metadata] Strategy 2 (Mobile UA) failed:', err);
  }

  // Strategy 3: Facebook / WhatsApp Crawler User-Agent
  try {
    const crawlerRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });

    if (crawlerRes.ok) {
      const html = await crawlerRes.text();
      const og = parseFromOgTags(html);
      if (!result.creator && isValidCreator(og.creator)) result.creator = og.creator;
      if (!result.caption && og.caption && og.caption.length > 10) result.caption = og.caption;
      if (!result.thumbnail && og.thumbnail) result.thumbnail = og.thumbnail;
    }
  } catch (err) {
    console.warn('[Instagram Metadata] Strategy 3 (Facebook Crawler) failed:', err);
  }

  return result;
}
