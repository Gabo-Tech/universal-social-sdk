import axios from "axios";
import * as cheerio from "cheerio";

export interface CrawledDoc {
  url: string;
  title: string;
  text: string;
  endpointRows: Array<Record<string, string>>;
}

export const DOC_URLS = {
  x: [
    "https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets",
    "https://developer.x.com/en/docs/twitter-api/users/likes/api-reference/post-users-id-likes"
  ],
  facebook: [
    "https://developers.facebook.com/docs/graph-api/reference/page/feed/",
    "https://developers.facebook.com/docs/pages-api/getting-started/"
  ],
  instagram: [
    "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media",
    "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/"
  ],
  linkedin: [
    "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2025-10",
    "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api?view=li-lms-2025-06"
  ]
} as const;

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function extractTables($: cheerio.CheerioAPI): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  $("table").each((_, table) => {
    const headers: string[] = [];
    $(table)
      .find("thead th")
      .each((_, th) => {
        headers.push(cleanText($(th).text()));
      });

    $(table)
      .find("tbody tr")
      .each((_, tr) => {
        const row: Record<string, string> = {};
        $(tr)
          .find("td")
          .each((idx, td) => {
            const key = headers[idx] || `column_${idx + 1}`;
            row[key] = cleanText($(td).text());
          });
        if (Object.keys(row).length > 0) {
          rows.push(row);
        }
      });
  });
  return rows;
}

export async function crawlSingleDoc(url: string): Promise<CrawledDoc> {
  const response = await axios.get<string>(url, {
    timeout: 30_000,
    headers: {
      "User-Agent": "universal-social-sdk-doc-crawler/1.0"
    }
  });
  const $ = cheerio.load(response.data);
  const title = cleanText($("title").first().text()) || "Untitled";
  const text = cleanText($("main, article, body").text());
  const endpointRows = extractTables($);

  return {
    url,
    title,
    text: text.slice(0, 250_000),
    endpointRows
  };
}

export async function crawlAllDocs(): Promise<CrawledDoc[]> {
  const urls = [
    ...DOC_URLS.x,
    ...DOC_URLS.facebook,
    ...DOC_URLS.instagram,
    ...DOC_URLS.linkedin
  ];
  const results = await Promise.all(urls.map((url) => crawlSingleDoc(url)));
  return results;
}
