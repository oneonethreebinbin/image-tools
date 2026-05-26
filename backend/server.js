const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UA_MOBILE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

const UA_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ==================== 平台检测与URL提取 ====================

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

/**
 * 检测平台并提取纯URL
 */
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

/**
 * 解析短链接，跟随重定向
 */
async function resolveShortUrl(shareUrl, platform) {
  const referer = platform.referer;
  try {
    const response = await axios.get(shareUrl, {
      maxRedirects: 0,
      validateStatus: (status) =>
        status === 301 || status === 302 || status === 307 || status === 308,
      headers: { "User-Agent": UA_MOBILE, Referer: referer },
      timeout: 10000,
    });
    const location = response.headers.location;
    if (location) return location.replace(/\\\//g, "/");
    return shareUrl;
  } catch (e) {
    // axios throws on redirect when maxRedirects:0 and validateStatus only allows 3xx
    // If we got a redirect response, the location is in the error response
    if (e.response?.headers?.location) {
      return e.response.headers.location.replace(/\\\//g, "/");
    }
    try {
      const response = await axios.get(shareUrl, {
        maxRedirects: 5,
        headers: { "User-Agent": UA_MOBILE, Referer: referer },
        timeout: 10000,
      });
      return response.request?.res?.responseUrl || shareUrl;
    } catch (err) {
      throw new Error("无法解析该链接，请确认链接是否有效");
    }
  }
}

// ==================== Bilibili 解析 ====================

async function extractBilibili(inputUrl) {
  const bvidMatch = inputUrl.match(/BV[A-Za-z0-9]+/i);
  if (!bvidMatch) throw new Error("未识别到有效的 Bilibili 视频ID");
  const bvid = bvidMatch[0];

  // 调用 Bilibili 公开API获取视频信息
  const infoRes = await axios.get(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    {
      headers: {
        "User-Agent": UA_DESKTOP,
        Referer: "https://www.bilibili.com/",
      },
      timeout: 10000,
    },
  );
  const info = infoRes.data?.data;
  if (!info) throw new Error("获取B站视频信息失败");

  // 获取播放地址
  // 策略1（主力）: fnval=1 获取 durl（音视频合并的单文件，可直接播放有声音）
  // 策略2（备用）: fnval=4048 获取 dash 流（音视频分离，仅作为最后手段）
  let videoUrl = "";

  try {
    const playRes = await axios.get(
      `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${info.cid}&qn=80&fnval=1&fourk=1`,
      {
        headers: {
          "User-Agent": UA_DESKTOP,
          Referer: "https://www.bilibili.com/",
        },
        timeout: 10000,
      },
    );
    const playData = playRes.data?.data;
    if (playData?.durl?.length > 0) {
      // 优先选最高质量的 durl（通常最后一个）
      const best = playData.durl[playData.durl.length - 1];
      videoUrl = best.url || playData.durl[0].url || "";
    }
  } catch (e) {
    console.error("Bilibili durl playurl failed:", e.message);
  }

  // 如果 durl 失败，尝试 dash
  if (!videoUrl) {
    try {
      const playRes = await axios.get(
        `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${info.cid}&qn=80&fnval=16&fourk=1`,
        {
          headers: {
            "User-Agent": UA_DESKTOP,
            Referer: "https://www.bilibili.com/",
          },
          timeout: 10000,
        },
      );
      const playData = playRes.data?.data;
      if (playData?.dash) {
        const videos = playData.dash.video || [];
        if (videos.length > 0) {
          videoUrl =
            videos[videos.length - 1].baseUrl ||
            videos[videos.length - 1].base_url ||
            "";
        }
      }
    } catch (e) {
      console.error("Bilibili dash playurl failed:", e.message);
    }
  }

  return {
    videoUrl,
    coverUrl: info.pic || "",
    title: info.title || "B站视频",
    authorName: info.owner?.name || "",
    duration: info.duration,
    platform: "bilibili",
  };
}

// ==================== 小红书解析 ====================

async function extractXiaohongshu(pageUrl) {
  const extractResult = {
    videoUrl: "",
    coverUrl: "",
    title: "",
    authorName: "",
  };

  // 策略1: 桌面端UA获取页面HTML
  try {
    const response = await axios.get(pageUrl, {
      headers: {
        "User-Agent": UA_DESKTOP,
        Referer: "https://www.xiaohongshu.com/",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      timeout: 15000,
      maxRedirects: 5,
    });
    const html = response.data;
    const found = tryParseXiaohongshuHtml(html);
    if (found) return found;
  } catch (e) {
    console.error("Xiaohongshu desktop fetch failed:", e.message);
  }

  // 策略2: 移动端UA重试
  try {
    const response = await axios.get(pageUrl, {
      headers: {
        "User-Agent": UA_MOBILE,
        Referer: "https://www.xiaohongshu.com/",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      timeout: 15000,
      maxRedirects: 5,
    });
    const html = response.data;
    const found = tryParseXiaohongshuHtml(html);
    if (found) return found;
  } catch (e) {
    console.error("Xiaohongshu mobile fetch failed:", e.message);
  }

  // 策略3: 尝试 API 端点
  try {
    const noteIdMatch =
      pageUrl.match(/\/item\/([A-Za-z0-9]+)/i) ||
      pageUrl.match(/\/explore\/([A-Za-z0-9]+)/i);
    if (noteIdMatch) {
      const noteId = noteIdMatch[1];
      const apiRes = await axios.get(
        `https://edith.xiaohongshu.com/api/sns/web/v1/feed?source_note_id=${noteId}`,
        {
          headers: {
            "User-Agent": UA_MOBILE,
            Referer: "https://www.xiaohongshu.com/",
            "Accept-Language": "zh-CN,zh;q=0.9",
          },
          timeout: 10000,
        },
      );
      const items = apiRes.data?.data?.items || [];
      if (items.length > 0) {
        const note = items[0].note_card || items[0];
        const videoInfo = note?.video;
        if (videoInfo?.media?.stream) {
          const stream = videoInfo.media.stream;
          const videoUrl =
            stream.h264?.[0]?.masterUrl ||
            stream.h265?.[0]?.masterUrl ||
            stream.av1?.[0]?.masterUrl ||
            "";
          if (videoUrl) {
            return {
              videoUrl,
              coverUrl:
                (note.image_list || [])[0]?.url_default ||
                note.cover?.url ||
                "",
              title:
                note.title || note.display_title || note.desc || "小红书笔记",
              authorName: note.user?.nickname || note.user?.nick_name || "",
              platform: "xiaohongshu",
            };
          }
        }
      }
    }
  } catch (e) {
    console.error("Xiaohongshu API fetch failed:", e.message);
  }

  // 最终降级
  return {
    videoUrl: "",
    coverUrl: extractResult.coverUrl || "",
    title: extractResult.title || "小红书笔记",
    authorName: extractResult.authorName || "",
    pageUrl,
    needIframe: true,
    platform: "xiaohongshu",
    note: "小红书需要登录验证，无法直接提取视频。请在小红书App内查看原视频。",
  };
}

function tryParseXiaohongshuHtml(html) {
  if (!html || html.length < 500) return null;

  // 模式1: __INITIAL_STATE__ (最完整的JSON数据)
  const statePatterns = [
    /window\.__INITIAL_STATE__\s*=\s*({.*?})\s*<\/script>\s*$/s,
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*\n\s*<\/script>/s,
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/s,
  ];

  for (const pattern of statePatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const raw = match[1]
          .replace(/undefined/g, "null")
          .replace(/: *\,/g, ": null,");
        const data = JSON.parse(raw);
        const note = data?.note?.noteDetailMap
          ? Object.values(data.note.noteDetailMap)[0]?.note
          : data?.note;
        if (note) {
          const video = note.video;
          if (video?.media?.stream) {
            const stream = video.media.stream;
            const videoUrl =
              stream.h264?.[0]?.masterUrl ||
              stream.h265?.[0]?.masterUrl ||
              stream.av1?.[0]?.masterUrl ||
              "";
            return {
              videoUrl,
              coverUrl:
                (note.imageList || [])[0]?.urlDefault ||
                note.cover?.url ||
                note.cover?.urlDefault ||
                "",
              title: note.title || note.desc || "小红书笔记",
              authorName: note.user?.nickname || note.user?.nickName || "",
              platform: "xiaohongshu",
            };
          }
        }
      } catch (e) {
        console.error("Xiaohongshu INITIAL_STATE parse failed:", e.message);
      }
    }
  }

  // 模式2: 直接匹配视频URL
  const videoPatterns = [
    /"masterUrl"\s*:\s*"(https?:\\?\/\\?\/[^"]+)"/i,
    /"master_url"\s*:\s*"(https?:\\?\/\\?\/[^"]+)"/i,
    /masterUrl["\s:]+(https?:\\?\/\\?\/[^"'\s,}]+)/gi,
    /(https?:\\?\/\\?\/sns-webpic-qc\.xhscdn\.com\/[^"'\s]+\.(?:mp4|mov)[^"'\s]*)/gi,
    /(https?:\\?\/\\?\/[^"'\s]*?xhscdn[^"'\s]*?\.mp4[^"'\s]*)/gi,
    /https?:\/\/[^"'\s]*?xg-short-video[^"'\s]*?\.mp4[^"'\s]*/gi,
  ];

  for (const pattern of videoPatterns) {
    const match = html.match(pattern);
    if (match) {
      const url = match[1] || match[0];
      const videoUrl = url.replace(/\\\\/g, "\\").replace(/\\\//g, "/");
      if (videoUrl.startsWith("http")) {
        return {
          videoUrl,
          coverUrl: "",
          title: "小红书笔记",
          authorName: "",
          platform: "xiaohongshu",
        };
      }
    }
  }

  // 模式3: 从 script 中提取包含video信息的JSON
  const scriptMatch = html.match(
    /<script[^>]*>\s*window\.__INITIAL_STATE__\s*=/s,
  );
  if (!scriptMatch) {
    // 尝试找到任何包含 video masterUrl 的 JSON
    const jsonBlockMatch = html.match(/\{[^}]*"masterUrl"[^}]*\}/s);
    if (jsonBlockMatch) {
      const urlMatch = jsonBlockMatch[0].match(
        /"masterUrl"\s*:\s*"(https?:\\?\/\\?\/[^"]+)"/i,
      );
      if (urlMatch) {
        return {
          videoUrl: urlMatch[1].replace(/\\\\/g, "\\").replace(/\\\//g, "/"),
          coverUrl: "",
          title: "小红书笔记",
          authorName: "",
          platform: "xiaohongshu",
        };
      }
    }
  }

  return null;
}

// ==================== 抖音解析 ====================

async function extractDouyin(pageUrl) {
  try {
    const response = await axios.get(pageUrl, {
      headers: {
        "User-Agent": UA_MOBILE,
        Referer: "https://www.douyin.com/",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      timeout: 15000,
      maxRedirects: 5,
    });
    const html = response.data;
    const $ = cheerio.load(html);
    let videoData = null;

    // 策略1: 从 script 标签中提取 RENDER_DATA / _ROUTER_DATA
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

    // 策略2: 匹配视频直链
    if (!videoData) {
      const videoMatch = html.match(
        /https?:\/\/[^"'\s]*?\.(?:mp4|mov)[^"'\s]*/gi,
      );
      if (videoMatch && videoMatch.length > 0) {
        const urls = videoMatch.filter((u) => u.length > 50); // 真正的视频链接通常较长
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

    // 策略3: 从 JSON 模式中提取
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
        // 也检查 downloadAddr
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

// ==================== 通用 oEmbed 辅助函数 ====================

/**
 * 通过 oEmbed API 获取视频元数据（标题、作者、缩略图）
 * 适用于 YouTube, TikTok, Instagram, Facebook, Twitter, Vimeo
 */
async function fetchOembedMetadata(oembedUrl, referer) {
  try {
    const res = await axios.get(oembedUrl, {
      headers: { "User-Agent": UA_DESKTOP, Referer: referer },
      timeout: 10000,
      validateStatus: () => true,
    });
    if (res.status === 200 && res.data) {
      return {
        title: res.data.title || "",
        authorName: res.data.author_name || res.data.author_url || "",
        coverUrl: res.data.thumbnail_url || "",
      };
    }
  } catch (e) {
    console.error("oEmbed fetch failed:", e.message);
  }
  return { title: "", authorName: "", coverUrl: "" };
}

// ==================== YouTube 解析 ====================

async function extractYoutube(pageUrl) {
  const videoId = (pageUrl.match(
    /(?:v=|shorts\/|youtu\.be\/|embed\/)([A-Za-z0-9_-]+)/i,
  ) || [])[1];
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
    note: "YouTube videos cannot be directly downloaded due to platform restrictions. Click below to view on YouTube.",
  };
}

// ==================== Instagram 解析 ====================

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

// ==================== TikTok 解析 ====================

/**
 * 从 HTML 中提取嵌入式 JSON 数据块
 */
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
        // 可能是分块存储的，尝试拼接
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

/**
 * 递归查找视频数据
 */
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
    // 查找 video.playAddr / video.downloadAddr
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
    // 查找 bitRateInfo 数组（高质量视频）
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
    // 继续递归
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

/**
 * 尝试从 pageUrl 中提取用户名和视频ID，构造更精确的 API 请求
 */
function parseTiktokUrl(pageUrl) {
  // https://www.tiktok.com/@username/video/1234567890
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
      const res = await axios.get(pageUrl, {
        headers: {
          "User-Agent": ua,
          Referer: referer,
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 12000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
      return typeof res.data === "string" ? res.data : "";
    } catch (e) {
      console.error(
        `TikTok fetch (${ua.substring(0, 30)}...) failed:`,
        e.message,
      );
      return "";
    }
  };

  /**
   * 清理视频URL：去除转义，尝试无水印版本
   */
  const cleanVideoUrl = (url) => {
    let cleaned = url
      .replace(/\\\\/g, "\\")
      .replace(/\\\//g, "/")
      .replace(/\\u002F/g, "/");
    // 解码 Unicode 转义
    try {
      cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (_, c) =>
        String.fromCharCode(parseInt(c, 16)),
      );
    } catch {}
    return cleaned;
  };

  // ====== 策略1: Mobile UA 抓取页面 + 嵌入式JSON ======
  console.log("[TikTok] Strategy 1: Mobile UA + embedded JSON");
  let html = await fetchPage(UA_MOBILE, "https://www.tiktok.com/");

  if (html) {
    const jsonData = extractTiktokJson(html, [
      "__UNIVERSAL_DATA__",
      "SIGI_STATE",
      "__NEXT_DATA__",
    ]);
    if (jsonData) {
      console.log("[TikTok] Found embedded JSON data");
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

  // ====== 策略2: 直接从HTML匹配视频URL模式 ======
  console.log("[TikTok] Strategy 2: Regex patterns in HTML");
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
          const videoUrl = cleanVideoUrl(raw);
          console.log(
            `[TikTok] Found URL via regex: ${videoUrl.substring(0, 80)}...`,
          );
          return {
            videoUrl,
            coverUrl: meta.coverUrl,
            title: meta.title || "TikTok Video",
            authorName: meta.authorName,
            platform: "tiktok",
          };
        }
      }
    }

    // 额外尝试: 匹配所有 mp4 链接
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

  // ====== 策略3: Desktop UA 再试一次 ======
  console.log("[TikTok] Strategy 3: Desktop UA retry");
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

  // ====== 策略4: 尝试通过 vm.tiktok.com 短链方式获取（如果适用） ======
  const { videoId } = parseTiktokUrl(pageUrl);
  if (videoId) {
    console.log(`[TikTok] Strategy 4: Direct page for video ID ${videoId}`);
    const directUrl = `https://www.tiktok.com/@/video/${videoId}`;
    try {
      const res = await axios.get(directUrl, {
        headers: {
          "User-Agent": UA_MOBILE,
          Referer: "https://www.tiktok.com/",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
      const h = typeof res.data === "string" ? res.data : "";
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

  // ====== 所有策略失败，返回兜底结果 ======
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

// ==================== Twitter / X 解析 ====================

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

// ==================== Facebook 解析 ====================

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

// ==================== Vimeo 解析 ====================

async function extractVimeo(pageUrl) {
  const videoId = (pageUrl.match(
    /vimeo\.com\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)/i,
  ) || [])[1];
  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`;
  const meta = await fetchOembedMetadata(oembedUrl, "https://vimeo.com/");

  // 尝试通过 Vimeo player config 获取直链
  if (videoId) {
    try {
      const configRes = await axios.get(
        `https://player.vimeo.com/video/${videoId}/config`,
        {
          headers: {
            "User-Agent": UA_DESKTOP,
            Referer: "https://vimeo.com/",
          },
          timeout: 10000,
          validateStatus: () => true,
        },
      );
      const files = configRes.data?.request?.files;
      if (files) {
        // progressive 包含可直接播放的MP4文件
        const progressive = files.progressive || [];
        if (progressive.length > 0) {
          const best = progressive[progressive.length - 1];
          return {
            videoUrl: best.url,
            coverUrl:
              meta.coverUrl || configRes.data?.video?.thumbs?.base || "",
            title: meta.title || configRes.data?.video?.title || "Vimeo Video",
            authorName:
              meta.authorName || configRes.data?.video?.owner?.name || "",
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

// ==================== Reddit 解析 ====================

async function extractReddit(pageUrl) {
  try {
    // Reddit 支持在URL后加 .json 获取数据
    let jsonUrl = pageUrl;
    if (jsonUrl.includes("v.redd.it")) {
      // v.redd.it 链接不直接支持 .json
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

    // 对于 reddit.com 链接，移除可能的查询参数后加 .json
    const baseUrl = pageUrl.split("?")[0];
    jsonUrl = baseUrl.endsWith("/") ? baseUrl + ".json" : baseUrl + "/.json";

    const res = await axios.get(jsonUrl, {
      headers: { "User-Agent": UA_DESKTOP },
      timeout: 10000,
      validateStatus: () => true,
    });

    const postData = res.data;
    let videoUrl = "";
    let fallbackUrl = "";
    let title = "Reddit Post";
    let authorName = "";

    // 递归查找视频URL
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

// ==================== 统一解析API ====================

app.post("/api/video/extract", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.json({ code: 400, msg: "请输入视频页面链接" });
    }

    // 1. 检测平台并提取URL
    const detected = detectPlatform(url.trim());
    if (!detected) {
      return res.json({
        code: 400,
        msg: "未识别到支持的视频链接。目前支持：B站(bilibili)、小红书、抖音、以及国外主流平台(YouTube/Instagram/TikTok/Facebook/Vimeo/Reddit)。请检查链接格式。",
      });
    }

    const { platform, url: shareUrl } = detected;
    console.log(`[Extract] 检测到平台: ${platform.label}, URL: ${shareUrl}`);

    // 2. 如果是短链接，先解析
    let pageUrl = shareUrl;
    if (platform.shortLinkHosts.some((host) => shareUrl.includes(host))) {
      try {
        pageUrl = await resolveShortUrl(shareUrl, platform);
        console.log(`[Extract] 短链接解析结果: ${pageUrl}`);
      } catch (e) {
        return res.json({
          code: 400,
          msg: "短链接解析失败，请确认链接是否有效",
        });
      }
    }

    // 3. 根据平台调用对应的提取函数
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

    // 4. 构建代理URL（仅对直接可播放的视频地址）
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

    res.json({
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
    res.json({
      code: 500,
      msg: err.message || "视频解析失败，请稍后重试",
    });
  }
});

// ==================== 视频代理（支持多平台 Referer + Range请求） ====================

const PLATFORM_REFERERS = {
  bilibili: "https://www.bilibili.com/",
  xiaohongshu: "https://www.xiaohongshu.com/",
  douyin: "https://www.douyin.com/",
  youtube: "https://www.youtube.com/",
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
  twitter: "https://x.com/",
  facebook: "https://www.facebook.com/",
  vimeo: "https://vimeo.com/",
  reddit: "https://www.reddit.com/",
};

const PLATFORM_ORIGINS = {
  bilibili: "https://www.bilibili.com",
  xiaohongshu: "https://www.xiaohongshu.com",
  douyin: "https://www.douyin.com",
  youtube: "https://www.youtube.com",
  instagram: "https://www.instagram.com",
  tiktok: "https://www.tiktok.com",
  twitter: "https://x.com",
  facebook: "https://www.facebook.com",
  vimeo: "https://vimeo.com",
  reddit: "https://www.reddit.com",
};

app.get("/api/video/proxy", async (req, res) => {
  try {
    const videoUrl = decodeURIComponent(req.query.url);
    const platform = req.query.platform || "douyin";
    const referer = PLATFORM_REFERERS[platform] || PLATFORM_REFERERS.douyin;
    const origin = PLATFORM_ORIGINS[platform] || PLATFORM_ORIGINS.douyin;

    if (!videoUrl) {
      return res.status(400).send("缺少视频URL");
    }

    // 转发 Range 请求头以支持视频拖动进度条
    const headers = {
      "User-Agent": UA_MOBILE,
      Referer: referer,
      Origin: origin,
    };
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await axios.get(videoUrl, {
      responseType: "stream",
      headers,
      timeout: 60000,
      validateStatus: (status) => status < 500,
    });

    const statusCode = response.status;
    res.status(statusCode);

    // 转发关键响应头
    const contentType = response.headers["content-type"] || "video/mp4";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Range, Accept-Ranges, Content-Length",
    );
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }
    if (response.headers["content-range"]) {
      res.setHeader("Content-Range", response.headers["content-range"]);
    }

    // 添加下载文件名
    const disposition = response.headers["content-disposition"];
    if (disposition) {
      res.setHeader("Content-Disposition", disposition);
    }

    response.data.pipe(res);

    response.data.on("error", (err) => {
      console.error("视频流传输错误:", err.message);
      if (!res.headersSent) {
        res.status(500).send("视频传输中断");
      }
    });
  } catch (err) {
    console.error("视频代理失败:", err.message);
    if (!res.headersSent) {
      res.status(500).send("视频获取失败: " + err.message);
    }
  }
});

// ==================== 直接下载端点（强制下载而非播放） ====================

app.get("/api/video/download", async (req, res) => {
  try {
    const videoUrl = decodeURIComponent(req.query.url);
    const platform = req.query.platform || "douyin";
    const referer = PLATFORM_REFERERS[platform] || PLATFORM_REFERERS.douyin;
    const origin = PLATFORM_ORIGINS[platform] || PLATFORM_ORIGINS.douyin;
    const filename = req.query.filename || `video_${Date.now()}.mp4`;

    if (!videoUrl) {
      return res.status(400).send("缺少视频URL");
    }

    const response = await axios.get(videoUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": UA_MOBILE,
        Referer: referer,
        Origin: origin,
      },
      timeout: 120000,
    });

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "video/mp4",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    response.data.pipe(res);
  } catch (err) {
    console.error("视频下载失败:", err.message);
    if (!res.headersSent) {
      res.status(500).send("视频下载失败: " + err.message);
    }
  }
});

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", platforms: PLATFORM_RULES.map((r) => r.label) });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
  console.log(`支持平台: ${PLATFORM_RULES.map((r) => r.label).join(", ")}`);
  console.log("端点:");
  console.log("  POST /api/video/extract  - 解析视频链接");
  console.log("  GET  /api/video/proxy    - 代理视频播放");
  console.log("  GET  /api/video/download - 强制下载视频");
  console.log("  GET  /api/health         - 健康检查");
});
