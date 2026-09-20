/**
 * Instagram URL Parser and Multi-Strategy Metadata Extractor
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

    // If it's a general instagram url
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

  // 1. Extract creator username from description:
  // e.g. "32K likes, 180 comments - narado_n on September 8, 2026: ..."
  // or "6,137 likes, 448 comments - elev8ted.path pada September 8, 2026: ..."
  if (rawDesc) {
    const authorMatch = rawDesc.match(/-\s*([A-Za-z0-9._]+)\s+(?:on|pada)\s+/i);
    if (authorMatch && authorMatch[1] && authorMatch[1].toLowerCase() !== 'instagram') {
      creator = `@${authorMatch[1]}`;
    }

    // Extract caption text from description (content between quotes or after ": ")
    const captionQuotes = rawDesc.match(/:\s*(?:&quot;|"|“)([\s\S]*?)(?:&quot;|"|”)\.?\s*$/i) ||
                          rawDesc.match(/:\s*(?:&quot;|"|“)([\s\S]*)/i);
    if (captionQuotes && captionQuotes[1]) {
      caption = cleanHtmlEntities(captionQuotes[1]);
    }
  }

  // 2. Creator and caption fallback from title
  // e.g. "Elevated Path di Instagram: "Want to make smarter decisions?..."
  if (rawTitle) {
    if (!creator) {
      const titleAuthor = rawTitle.match(/^([^:]+)\s+(?:on Instagram|di Instagram):/i);
      if (titleAuthor && titleAuthor[1]) {
        const cleaned = titleAuthor[1].trim();
        if (cleaned.toLowerCase() !== 'instagram') {
          creator = cleaned.startsWith('@') ? cleaned : `@${cleaned.replace(/\s+/g, '_').toLowerCase()}`;
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

  // Strategy 1: Mobile User-Agent (Most reliable for public reels metadata)
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
      if (og.creator) result.creator = og.creator;
      if (og.caption && og.caption.length > 10) result.caption = og.caption;
      if (og.thumbnail) result.thumbnail = og.thumbnail;

      // If we got both creator and caption, return immediately!
      if (result.creator && result.caption) {
        return result;
      }
    }
  } catch (err) {
    console.warn('Strategy 1 (Mobile UA) failed:', err);
  }

  // Strategy 2: Facebook / WhatsApp Crawler User-Agent
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
      if (!result.creator && og.creator) result.creator = og.creator;
      if (!result.caption && og.caption && og.caption.length > 10) result.caption = og.caption;
      if (!result.thumbnail && og.thumbnail) result.thumbnail = og.thumbnail;

      if (result.creator && result.caption) {
        return result;
      }
    }
  } catch (err) {
    console.warn('Strategy 2 (Facebook Crawler) failed:', err);
  }

  // Strategy 3: Embed endpoint fallback
  if (parsed.shortcode && (!result.creator || !result.caption)) {
    try {
      const embedUrl = `https://www.instagram.com/reel/${parsed.shortcode}/embed/captioned/`;
      const embedRes = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        cache: 'no-store',
      });

      if (embedRes.ok) {
        const html = await embedRes.text();
        const og = parseFromOgTags(html);
        if (!result.creator && og.creator) result.creator = og.creator;
        if (!result.caption && og.caption) result.caption = og.caption;
      }
    } catch (err) {
      console.warn('Strategy 3 (Embed) failed:', err);
    }
  }

  return result;
}
