import * as cheerio from "cheerio";

const UA_MOBILE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

const UA_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const PLATFORM_RULES = [
  {
    name: "bilibili",
    label: "Bilibili",
    patterns: [
      /https?:\/\/www\.bilibili\.com\/video\/(BV[A-Za-z0-9]+)/i,
      /https?:\/\/m\.bilibili\.com\/video\/(BV[A-Za-z0-9]+)/i,
      /https?:\/\/b23\.tv\/([A-Za-z0-9]+)/i,
      /https?:\/\/bilibili\.com\/video\/(BV[A-Za-z0-9]+)/i,
    ],
    referer: "https://www.bilibili.com/",
    shortLinkHosts: ["b23.tv"],
  },
  {
    name: "xiaohongshu",
    label: "小红书",
    patterns: [
      /https?:\/\/www\.xiaohongshu\.com\/[^/]+\/item\/[A-Za-z0-9]+/i,
      /https?:\/\/www\.xiaohongshu\.com\/explore\/[A-Za-z0-9]+/i,
      /https?:\/\/www\.xiaohongshu\.com\/discovery\/item\/([A-Za-z0-9]+)/i,
      /https?:\/\/xhslink\.com\/[A-Za-z0-9?&=/_-]+/i,
    ],
    referer: "https://www.xiaohongshu.com/",
    shortLinkHosts: ["xhslink.com"],
  },
  {
    name: "douyin",
    label: "抖音",
    patterns: [
      /https?:\/\/v\.douyin\.com\/[A-Za-z0-9]+\/?/i,
      /https?:\/\/www\.douyin\.com\/video\/\d+/i,
      /https?:\/\/www\.douyin\.com\/user\/[A-Za-z0-9_-]+\?modal_id=\d+/i,
      /https?:\/\/www\.iesdouyin\.com\/share\/video\/\d+/i,
    ],
    referer: "https://www.douyin.com/",
    shortLinkHosts: ["v.douyin.com"],
  },
  {
    name: "youtube",
    label: "YouTube",
    patterns: [
      /https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/youtu\.be\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.|m\.)?youtube\.com\/embed\/([A-Za-z0-9_-]+)/i,
    ],
    referer: "https://www.youtube.com/",
    shortLinkHosts: ["youtu.be"],
  },
  {
    name: "instagram",
    label: "Instagram",
    patterns: [
      /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?instagram\.com\/reels?\/([A-Za-z0-9_-]+)/i,
    ],
    referer: "https://www.instagram.com/",
    shortLinkHosts: [],
  },
  {
    name: "tiktok",
    label: "TikTok",
    patterns: [
      /https?:\/\/(?:www\.|m\.|vm\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
      /https?:\/\/(?:www\.|m\.|vm\.)?tiktok\.com\/t\/([A-Za-z0-9]+)/i,
      /https?:\/\/vm\.tiktok\.com\/([A-Za-z0-9]+)/i,
    ],
    referer: "https://www.tiktok.com/",
    shortLinkHosts: ["vm.tiktok.com"],
  },
  {
    name: "twitter",
    label: "Twitter / X",
    patterns: [/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/\w+\/status\/(\d+)/i],
    referer: "https://x.com/",
    shortLinkHosts: [],
  },
  {
    name: "facebook",
    label: "Facebook",
    patterns: [
      /https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/[\w.-]+\/videos\/[\w.-]+/i,
      /https?:\/\/(?:www\.)?facebook\.com\/watch\/?\?v=([\w.-]+)/i,
      /https?:\/\/fb\.watch\/([A-Za-z0-9_-]+)/i,
      /https?:\/\/(?:www\.)?facebook\.com\/reel\/([\w.-]+)/i,
    ],
    referer: "https://www.facebook.com/",
    shortLinkHosts: ["fb.watch"],
  },
  {
    name: "vimeo",
    label: "Vimeo",
    patterns: [
      /https?:\/\/(?:www\.|player\.)?vimeo\.com\/(\d+)/i,
      /https?:\/\/(?:www\.)?vimeo\.com\/channels\/[\w-]+\/(\d+)/i,
      /https?:\/\/(?:www\.)?vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/i,
    ],
    referer: "https://vimeo.com/",
    shortLinkHosts: [],
  },
  {
    name: "reddit",
    label: "Reddit",
    patterns: [
      /https?:\/\/v\.redd\.it\/([A-Za-z0-9]+)/i,
      /https?:\/\/(?:www\.)?reddit\.com\/r\/[\w-]+\/comments\/([A-Za-z0-9]+)/i,
      /https?:\/\/(?:www\.)?reddit\.com\/r\/[\w-]+\/s\/([A-Za-z0-9]+)/i,
    ],
    referer: "https://www.reddit.com/",
    shortLinkHosts: ["v.redd.it"],
  },
];

function detectPlatform(input) {
  for (const rule of PLATFORM_RULES) {
    for (const pattern of rule.patterns) {
      const match = input.match(pattern);
      if (match) {
        return { platform: rule, url: match[0] };
      }
    }
  }
  return null;
}

async function resolveShortUrl(shareUrl, platform) {
  const referer = platform.referer;
  try {
    const response = await fetch(shareUrl, {
      redirect: "manual",
      headers: { "User-Agent": UA_MOBILE, Referer: referer },
    });
    const location = response.headers.get("location");
    if (location) return location.replace(/\\\//g, "/");
    if (response.status === 301 || response.status === 302) {
      return shareUrl;
    }
    return shareUrl;
  } catch {
    try {
      const response = await fetch(shareUrl, {
        redirect: "follow",
        headers: { "User-Agent": UA_MOBILE, Referer: referer },
      });
      return response.url || shareUrl;
    } catch {
      throw new Error("无法解析该链接");
    }
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOembedMetadata(oembedUrl, referer) {
  try {
    const res = await fetchWithTimeout(oembedUrl, {
      headers: { "User-Agent": UA_DESKTOP, Referer: referer },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || "",
        authorName: data.author_name || data.author_url || "",
        coverUrl: data.thumbnail_url || "",
      };
    }
  } catch (e) {
    console.error("oEmbed fetch failed:", e.message);
  }
  return { title: "", authorName: "", coverUrl: "" };
}

// ==================== Bilibili ====================

async function extractBilibili(inputUrl) {
  const bvidMatch = inputUrl.match(/BV[A-Za-z0-9]+/i);
  if (!bvidMatch) throw new Error("未识别到有效的 Bilibili 视频ID");
  const bvid = bvidMatch[0];

  const infoRes = await fetchWithTimeout(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    {
      headers: {
        "User-Agent": UA_DESKTOP,
        Referer: "https://www.bilibili.com/",
      },
    },
  );
  const infoData = await infoRes.json();
  const info = infoData?.data;
  if (!info) throw new Error("获取B站视频信息失败");

  let videoUrl = "";

  try {
    const playRes = await fetchWithTimeout(
      `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${info.cid}&qn=80&fnval=1&fourk=1`,
      {
        headers: {
          "User-Agent": UA_DESKTOP,
          Referer: "https://www.bilibili.com/",
        },
      },
    );
    const playData = await playRes.json();
    const durl = playData?.data?.durl;
    if (durl?.length > 0) {
      const best = durl[durl.length - 1];
      videoUrl = best.url || durl[0].url || "";
    }
  } catch (e) {
    console.error("Bilibili durl failed:", e.message);
  }

  if (!videoUrl) {
    try {
      const playRes = await fetchWithTimeout(
        `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${info.cid}&qn=80&fnval=16&fourk=1`,
        {
          headers: {
            "User-Agent": UA_DESKTOP,
            Referer: "https://www.bilibili.com/",
          },
        },
      );
      const playData = await playRes.json();
      const videos = playData?.data?.dash?.video || [];
      if (videos.length > 0) {
        videoUrl =
          videos[videos.length - 1].baseUrl ||
          videos[videos.length - 1].base_url ||
          "";
      }
    } catch (e) {
      console.error("Bilibili dash failed:", e.message);
    }
  }

  return {
    videoUrl,
    coverUrl: info.pic || "",
    title: info.title || "B站视频",
    authorName: info.owner?.name || "",
    platform: "bilibili",
  };
}

// ==================== 小红书 ====================

async function extractXiaohongshu(pageUrl) {
  try {
    const response = await fetchWithTimeout(pageUrl, {
      headers: {
        "User-Agent": UA_DESKTOP,
        Referer: "https://www.xiaohongshu.com/",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    let videoUrl = "";
    let coverUrl = "";
    let title = "";
    let authorName = "";

    const videoMatch = html.match(
      /https?:\/\/[^"'\s]*?\.(?:mp4|mov)[^"'\s]*/gi,
    );
    if (videoMatch && videoMatch.length > 0) {
      const urls = videoMatch.filter((u) => u.length > 50);
      if (urls.length > 0) videoUrl = urls[0].replace(/\\\\/g, "\\");
    }

    const titleMatch = html.match(
      /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
    );
    if (titleMatch) title = titleMatch[1];

    const authorMatch = html.match(/nickname"\s*:\s*"([^"]+)"/i);
    if (authorMatch) authorName = authorMatch[1];

    const coverMatch = html.match(/og:image"\s*content="([^"]+)"/i);
    if (coverMatch) coverUrl = coverMatch[1];

    if (!videoUrl) {
      const scriptTags = $("script").toArray();
      for (const script of scriptTags) {
        const content = $(script).html() || "";
        const m = content.match(/https?:\/\/[^"'\s]*?\.(?:mp4|mov)[^"'\s]*/gi);
        if (m) {
          const urls = m.filter((u) => u.length > 50);
          if (urls.length > 0) {
            videoUrl = urls[0].replace(/\\\\/g, "\\");
            break;
          }
        }
      }
    }

    if (!videoUrl) {
      return {
        videoUrl: "",
        coverUrl,
        title: title || "小红书笔记",
        authorName,
        pageUrl,
        needIframe: true,
        platform: "xiaohongshu",
        note: "无法直接提取视频地址，请通过页面链接查看",
      };
    }

    return {
      videoUrl,
      coverUrl,
      title: title || "小红书笔记",
      authorName,
      platform: "xiaohongshu",
    };
  } catch (err) {
    throw new Error("小红书视频信息提取失败: " + err.message);
  }
}

// ==================== 抖音 ====================

function extractDouyinFromData(data) {
  try {
    const findVideoData = (obj, depth = 0) => {
      if (!obj || typeof obj !== "object" || depth > 15) return null;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const r = findVideoData(item, depth + 1);
          if (r) return r;
        }
        return null;
      }
      for (const key of Object.keys(obj)) {
        if (key === "video" && obj[key]?.playAddr) {
          const pa = obj[key].playAddr;
          const url = Array.isArray(pa) ? pa[0]?.src : pa?.url_list?.[0];
          if (url)
            return {
              videoUrl: url.replace(/\\\\/g, "\\"),
              title: obj.desc || "抖音视频",
              coverUrl: (obj.video?.cover?.url_list || [])[0] || "",
              authorName: obj.author?.nickname || "",
            };
        }
        if (key === "video" && obj[key]?.downloadAddr) {
          const da = obj[key].downloadAddr;
          const url = Array.isArray(da) ? da[0]?.src : da?.url_list?.[0];
          if (url)
            return {
              videoUrl: url.replace(/\\\\/g, "\\"),
              title: obj.desc || "抖音视频",
              coverUrl: (obj.video?.cover?.url_list || [])[0] || "",
              authorName: obj.author?.nickname || "",
            };
        }
        const r = findVideoData(obj[key], depth + 1);
        if (r) return r;
      }
      return null;
    };
    return findVideoData(data);
  } catch {
    return null;
  }
}

async function extractDouyin(pageUrl) {
  try {
    const response = await fetchWithTimeout(pageUrl, {
      headers: {
        "User-Agent": UA_MOBILE,
        Referer: "https://www.douyin.com/",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    let videoData = null;

    const scriptTags = $("script").toArray();
    for (const script of scriptTags) {
      const content = $(script).html() || "";
      const patterns = [
        /<script[^>]*id="RENDER_DATA"[^>]*>(.*?)<\/script>/s,
        /window\._ROUTER_DATA\s*=\s*({.*?});?\s*<\/script>/s,
        /self\.__pace_f\.push\(\[1,"(.*?)"\]\)/s,
      ];
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          try {
            const dataStr = match[1];
            let decoded;
            try {
              decoded = decodeURIComponent(dataStr);
            } catch {
              decoded = dataStr;
            }
            const data = JSON.parse(decoded);
            if (data) {
              videoData = extractDouyinFromData(data);
              if (videoData) break;
            }
          } catch {}
        }
      }
      if (videoData) break;
    }

    if (!videoData) {
      const videoMatch = html.match(
        /https?:\/\/[^"'\s]*?\.(?:mp4|mov)[^"'\s]*/gi,
      );
      if (videoMatch && videoMatch.length > 0) {
        const urls = videoMatch.filter((u) => u.length > 50);
        if (urls.length > 0) {
          videoData = {
            videoUrl: urls[0].replace(/\\\\/g, "\\"),
            coverUrl: "",
            title: "抖音视频",
            authorName: "",
          };
        }
      }
    }

    if (!videoData) {
      for (const pattern of [
        /"video":\s*\{[^}]*"play_addr":\s*\{[^}]*"url_list":\s*\["([^"]+)"/s,
        /"playAddr":\s*\[\{"src":"([^"]+)"/s,
        /"downloadAddr":\s*\[\{"src":"([^"]+)"/s,
        /"bit_rate":[\s\S]*?"play_addr":[\s\S]*?"url_list":\s*\["([^"]+)"/s,
      ]) {
        const match = html.match(pattern);
        if (match) {
          videoData = {
            videoUrl: match[1].replace(/\\\\/g, "\\"),
            coverUrl: "",
            title: "抖音视频",
            authorName: "",
          };
          break;
        }
      }
    }

    if (!videoData || !videoData.videoUrl) {
      return {
        videoUrl: "",
        coverUrl: "",
        title: "抖音视频",
        authorName: "",
        pageUrl,
        needIframe: true,
        platform: "douyin",
        note: "无法直接提取视频地址，请确认链接有效",
      };
    }
    return { ...videoData, platform: "douyin" };
  } catch (err) {
    throw new Error("视频信息提取失败: " + err.message);
  }
}

// ==================== YouTube ====================

async function extractYoutube(pageUrl) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(pageUrl)}&format=json`;
  const meta = await fetchOembedMetadata(oembedUrl, "https://www.youtube.com/");

  return {
    videoUrl: "",
    coverUrl: meta.coverUrl,
    title: meta.title || "YouTube Video",
    authorName: meta.authorName,
    pageUrl,
    needIframe: true,
    platform: "youtube",
    note: "YouTube videos cannot be directly downloaded. Click below to view on YouTube.",
  };
}

// ==================== Instagram ====================

async function extractInstagram(pageUrl) {
  const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(pageUrl)}`;
  const meta = await fetchOembedMetadata(
    oembedUrl,
    "https://www.instagram.com/",
  );

  return {
    videoUrl: "",
    coverUrl: meta.coverUrl,
    title: meta.title || "Instagram Post",
    authorName: meta.authorName,
    pageUrl,
    needIframe: true,
    platform: "instagram",
    note: "Instagram content requires authentication. Click below to view the original post.",
  };
}

// ==================== TikTok ====================

function extractTiktokJson(html, keys) {
  for (const key of keys) {
    const pattern = new RegExp(
      `<script[^>]*id="${key}"[^>]*>([\\s\\S]*?)</script>`,
      "i",
    );
    const match = html.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        try {
          const chunks = [];
          const chunkRe = new RegExp(
            `<script[^>]*${key}[^>]*>([\\s\\S]*?)</script>`,
            "gi",
          );
          let cm;
          while ((cm = chunkRe.exec(html)) !== null) {
            chunks.push(cm[1]);
          }
          const joined = chunks.join("");
          return JSON.parse(joined);
        } catch {}
      }
    }
  }
  return null;
}

function findTiktokVideoData(obj, depth = 0) {
  if (!obj || depth > 12) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findTiktokVideoData(item, depth + 1);
      if (r) return r;
    }
    return null;
  }
  if (typeof obj === "object") {
    if (obj.playAddr) {
      const url =
        typeof obj.playAddr === "string"
          ? obj.playAddr
          : obj.playAddr?.url_list?.[0] || obj.playAddr?.UrlList?.[0] || "";
      if (url) return { videoUrl: url, type: "playAddr" };
    }
    if (obj.downloadAddr) {
      const url =
        typeof obj.downloadAddr === "string"
          ? obj.downloadAddr
          : obj.downloadAddr?.url_list?.[0] ||
            obj.downloadAddr?.UrlList?.[0] ||
            "";
      if (url) return { videoUrl: url, type: "downloadAddr" };
    }
    if (obj.bitRateInfo && Array.isArray(obj.bitRateInfo)) {
      const sorted = [...obj.bitRateInfo].sort(
        (a, b) => (b.bit_rate || 0) - (a.bit_rate || 0),
      );
      if (sorted.length > 0) {
        const best = sorted[0];
        const url =
          best.PlayAddr?.UrlList?.[0] ||
          best.playAddr?.url_list?.[0] ||
          best.PlayAddr?.url_list?.[0] ||
          "";
        if (url) return { videoUrl: url, type: "bitRateInfo" };
      }
    }
    for (const key of Object.keys(obj)) {
      if (
        key === "video" ||
        key === "itemInfo" ||
        key === "itemList" ||
        key === "item"
      ) {
        const r = findTiktokVideoData(obj[key], depth + 1);
        if (r) return r;
      }
    }
    for (const key of Object.keys(obj)) {
      const r = findTiktokVideoData(obj[key], depth + 1);
      if (r) return r;
    }
  }
  return null;
}

function parseTiktokUrl(pageUrl) {
  const videoMatch = pageUrl.match(/\/video\/(\d+)/i);
  const userMatch = pageUrl.match(/@([\w.-]+)/i);
  return {
    videoId: videoMatch ? videoMatch[1] : null,
    username: userMatch ? userMatch[1] : null,
  };
}

async function extractTiktok(pageUrl) {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(pageUrl)}`;
  const meta = await fetchOembedMetadata(oembedUrl, "https://www.tiktok.com/");

  const fetchPage = async (ua, referer) => {
    try {
      const res = await fetchWithTimeout(
        pageUrl,
        {
          headers: {
            "User-Agent": ua,
            Referer: referer,
            "Accept-Language": "en-US,en;q=0.9",
          },
        },
        12000,
      );
      return res.ok ? await res.text() : "";
    } catch (e) {
      console.error(`TikTok fetch failed:`, e.message);
      return "";
    }
  };

  const cleanVideoUrl = (url) => {
    let cleaned = url
      .replace(/\\\\/g, "\\")
      .replace(/\\\//g, "/")
      .replace(/\\u002F/g, "/");
    try {
      cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (_, c) =>
        String.fromCharCode(parseInt(c, 16)),
      );
    } catch {}
    return cleaned;
  };

  let html = await fetchPage(UA_MOBILE, "https://www.tiktok.com/");

  if (html) {
    const jsonData = extractTiktokJson(html, [
      "__UNIVERSAL_DATA__",
      "SIGI_STATE",
      "__NEXT_DATA__",
    ]);
    if (jsonData) {
      const videoData = findTiktokVideoData(jsonData);
      if (videoData?.videoUrl) {
        return {
          videoUrl: cleanVideoUrl(videoData.videoUrl),
          coverUrl: meta.coverUrl,
          title: meta.title || "TikTok Video",
          authorName: meta.authorName,
          platform: "tiktok",
        };
      }
    }
  }

  if (html) {
    const patterns = [
      /"playAddr"\s*:\s*(?:"([^"]+)"|'([^']+)')/i,
      /"downloadAddr"\s*:\s*(?:"([^"]+)"|'([^']+)')/i,
      /"play_addr"\s*:\s*\{[^}]*"url_list"\s*:\s*\["([^"]+)"/is,
      /"download_addr"\s*:\s*\{[^}]*"url_list"\s*:\s*\["([^"]+)"/is,
      /"(?:playAddr|downloadAddr)":"(https?:\\?\/\\?\/[^"]+)"/gi,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const raw = match[1] || match[2];
        if (raw && raw.startsWith("http")) {
          return {
            videoUrl: cleanVideoUrl(raw),
            coverUrl: meta.coverUrl,
            title: meta.title || "TikTok Video",
            authorName: meta.authorName,
            platform: "tiktok",
          };
        }
      }
    }

    const mp4Matches = html.match(/https?:\/\/[^"'\s<>]*?\.mp4[^"'\s<>]*/gi);
    if (mp4Matches) {
      const validMp4s = mp4Matches.filter(
        (u) =>
          u.includes("tiktok") &&
          !u.includes("icon") &&
          !u.includes("avatar") &&
          !u.includes("watermark"),
      );
      if (validMp4s.length > 0) {
        return {
          videoUrl: cleanVideoUrl(validMp4s[0]),
          coverUrl: meta.coverUrl,
          title: meta.title || "TikTok Video",
          authorName: meta.authorName,
          platform: "tiktok",
        };
      }
    }
  }

  html = await fetchPage(UA_DESKTOP, "https://www.tiktok.com/");
  if (html) {
    const jsonData = extractTiktokJson(html, [
      "__UNIVERSAL_DATA__",
      "SIGI_STATE",
      "__NEXT_DATA__",
    ]);
    if (jsonData) {
      const videoData = findTiktokVideoData(jsonData);
      if (videoData?.videoUrl) {
        return {
          videoUrl: cleanVideoUrl(videoData.videoUrl),
          coverUrl: meta.coverUrl,
          title: meta.title || "TikTok Video",
          authorName: meta.authorName,
          platform: "tiktok",
        };
      }
    }
  }

  const { videoId } = parseTiktokUrl(pageUrl);
  if (videoId) {
    const directUrl = `https://www.tiktok.com/@/video/${videoId}`;
    try {
      const res = await fetchWithTimeout(directUrl, {
        headers: {
          "User-Agent": UA_MOBILE,
          Referer: "https://www.tiktok.com/",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      const h = await res.text();
      const jsonData = extractTiktokJson(h, [
        "__UNIVERSAL_DATA__",
        "SIGI_STATE",
      ]);
      if (jsonData) {
        const videoData = findTiktokVideoData(jsonData);
        if (videoData?.videoUrl) {
          return {
            videoUrl: cleanVideoUrl(videoData.videoUrl),
            coverUrl: meta.coverUrl,
            title: meta.title || "TikTok Video",
            authorName: meta.authorName,
            platform: "tiktok",
          };
        }
      }
    } catch (e) {
      console.error("TikTok direct page fetch failed:", e.message);
    }
  }

  return {
    videoUrl: "",
    coverUrl: meta.coverUrl,
    title: meta.title || "TikTok Video",
    authorName: meta.authorName,
    pageUrl,
    needIframe: true,
    platform: "tiktok",
    note: "Could not extract direct video URL. Click below to view on TikTok.",
  };
}

// ==================== Twitter / X ====================

async function extractTwitter(pageUrl) {
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(pageUrl)}`;
  const meta = await fetchOembedMetadata(oembedUrl, "https://x.com/");

  return {
    videoUrl: "",
    coverUrl: meta.coverUrl,
    title: meta.title || "Twitter / X Post",
    authorName: meta.authorName,
    pageUrl,
    needIframe: true,
    platform: "twitter",
    note: "Twitter/X videos require authentication. Click below to view the original post.",
  };
}

// ==================== Facebook ====================

async function extractFacebook(pageUrl) {
  const oembedUrl = `https://www.facebook.com/plugins/video/oembed.json/?url=${encodeURIComponent(pageUrl)}`;
  const meta = await fetchOembedMetadata(
    oembedUrl,
    "https://www.facebook.com/",
  );

  return {
    videoUrl: "",
    coverUrl: meta.coverUrl,
    title: meta.title || "Facebook Video",
    authorName: meta.authorName,
    pageUrl,
    needIframe: true,
    platform: "facebook",
    note: "Facebook videos require authentication. Click below to view on Facebook.",
  };
}

// ==================== Vimeo ====================

async function extractVimeo(pageUrl) {
  const videoId = (pageUrl.match(
    /vimeo\.com\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)/i,
  ) || [])[1];
  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`;
  const meta = await fetchOembedMetadata(oembedUrl, "https://vimeo.com/");

  if (videoId) {
    try {
      const configRes = await fetchWithTimeout(
        `https://player.vimeo.com/video/${videoId}/config`,
        {
          headers: {
            "User-Agent": UA_DESKTOP,
            Referer: "https://vimeo.com/",
          },
        },
      );
      const configData = await configRes.json();
      const files = configData?.request?.files;
      if (files) {
        const progressive = files.progressive || [];
        if (progressive.length > 0) {
          const best = progressive[progressive.length - 1];
          return {
            videoUrl: best.url,
            coverUrl: meta.coverUrl || configData?.video?.thumbs?.base || "",
            title: meta.title || configData?.video?.title || "Vimeo Video",
            authorName: meta.authorName || configData?.video?.owner?.name || "",
            platform: "vimeo",
          };
        }
      }
    } catch (e) {
      console.error("Vimeo config fetch failed:", e.message);
    }
  }

  return {
    videoUrl: "",
    coverUrl: meta.coverUrl,
    title: meta.title || "Vimeo Video",
    authorName: meta.authorName,
    pageUrl,
    needIframe: true,
    platform: "vimeo",
    note: "Could not extract direct video URL. Click below to view on Vimeo.",
  };
}

// ==================== Reddit ====================

async function extractReddit(pageUrl) {
  try {
    if (pageUrl.includes("v.redd.it")) {
      return {
        videoUrl: "",
        coverUrl: "",
        title: "Reddit Video",
        authorName: "",
        pageUrl,
        needIframe: true,
        platform: "reddit",
        note: "Click below to view the Reddit post.",
      };
    }

    const baseUrl = pageUrl.split("?")[0];
    const jsonUrl = baseUrl.endsWith("/")
      ? baseUrl + ".json"
      : baseUrl + "/.json";

    const res = await fetchWithTimeout(jsonUrl, {
      headers: { "User-Agent": UA_DESKTOP },
    });
    const postData = await res.json();

    let videoUrl = "";
    let fallbackUrl = "";
    let title = "Reddit Post";
    let authorName = "";

    function findVideo(obj, depth = 0) {
      if (!obj || depth > 10) return;
      if (typeof obj === "object") {
        if (obj.media?.reddit_video?.fallback_url) {
          fallbackUrl = obj.media.reddit_video.fallback_url;
        }
        if (obj.secure_media?.reddit_video?.fallback_url) {
          fallbackUrl = obj.secure_media.reddit_video.fallback_url;
        }
        if (obj.url_overridden_by_dest) {
          const dest = obj.url_overridden_by_dest;
          if (dest.includes("v.redd.it") || dest.includes(".mp4")) {
            videoUrl = dest;
          }
        }
        if (obj.title) title = obj.title;
        if (obj.author) authorName = obj.author;
      }
      if (typeof obj === "object" && obj !== null) {
        for (const key of Object.keys(obj)) {
          findVideo(obj[key], depth + 1);
        }
      }
    }

    findVideo(postData);

    return {
      videoUrl: fallbackUrl || videoUrl || "",
      coverUrl: "",
      title,
      authorName,
      platform: "reddit",
      ...(fallbackUrl || videoUrl
        ? {}
        : {
            pageUrl,
            needIframe: true,
            note: "Could not extract direct video URL. Click below to view on Reddit.",
          }),
    };
  } catch (e) {
    console.error("Reddit fetch failed:", e.message);
  }

  return {
    videoUrl: "",
    coverUrl: "",
    title: "Reddit Post",
    authorName: "",
    pageUrl,
    needIframe: true,
    platform: "reddit",
    note: "Click below to view the Reddit post.",
  };
}

// ==================== 主处理函数 ====================

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const { url } = body;
    if (!url || !url.trim()) {
      return json({ code: 400, msg: "请输入视频页面链接" });
    }

    const detected = detectPlatform(url.trim());
    if (!detected) {
      return json({
        code: 400,
        msg: "未识别到支持的视频链接。目前支持：B站(bilibili)、小红书、抖音、以及国外主流平台(YouTube/Instagram/TikTok/Facebook/Vimeo/Reddit)。请检查链接格式。",
      });
    }

    const { platform, url: shareUrl } = detected;

    let pageUrl = shareUrl;
    if (platform.shortLinkHosts.some((host) => shareUrl.includes(host))) {
      try {
        pageUrl = await resolveShortUrl(shareUrl, platform);
      } catch {
        return json({ code: 400, msg: "短链接解析失败，请确认链接是否有效" });
      }
    }

    let videoInfo;
    if (platform.name === "bilibili") {
      videoInfo = await extractBilibili(pageUrl);
    } else if (platform.name === "xiaohongshu") {
      videoInfo = await extractXiaohongshu(pageUrl);
    } else if (platform.name === "youtube") {
      videoInfo = await extractYoutube(pageUrl);
    } else if (platform.name === "instagram") {
      videoInfo = await extractInstagram(pageUrl);
    } else if (platform.name === "tiktok") {
      videoInfo = await extractTiktok(pageUrl);
    } else if (platform.name === "twitter") {
      videoInfo = await extractTwitter(pageUrl);
    } else if (platform.name === "facebook") {
      videoInfo = await extractFacebook(pageUrl);
    } else if (platform.name === "vimeo") {
      videoInfo = await extractVimeo(pageUrl);
    } else if (platform.name === "reddit") {
      videoInfo = await extractReddit(pageUrl);
    } else {
      videoInfo = await extractDouyin(pageUrl);
    }

    let proxyUrl = null;
    if (videoInfo.videoUrl) {
      let decodedUrl = videoInfo.videoUrl;
      try {
        decodedUrl = decodedUrl.replace(/\\u([0-9a-fA-F]{4})/g, (_, c) =>
          String.fromCharCode(parseInt(c, 16)),
        );
        decodedUrl = decodeURIComponent(decodedUrl);
      } catch {}
      proxyUrl = `/api/video/proxy?url=${encodeURIComponent(decodedUrl)}&platform=${platform.name}`;
    }

    const hadVideoUrl = !!videoInfo.videoUrl;

    return json({
      code: 200,
      msg: hadVideoUrl
        ? "解析成功，已提取到视频地址"
        : "已识别平台，但未能提取到直接视频地址",
      data: {
        ...videoInfo,
        videoUrl: proxyUrl || videoInfo.videoUrl,
        originShareUrl: shareUrl,
        resolvedPageUrl: pageUrl,
        platform: platform.name,
        platformLabel: platform.label,
      },
    });
  } catch (err) {
    console.error("解析失败:", err);
    return json({ code: 500, msg: err.message || "视频解析失败，请稍后重试" });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
