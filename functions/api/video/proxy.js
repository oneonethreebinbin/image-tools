export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");
  const platform = url.searchParams.get("platform") || "";

  if (!targetUrl) {
    return new Response(JSON.stringify({ code: 400, msg: "缺少 url 参数" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const referers = {
    douyin: "https://www.douyin.com/",
    bilibili: "https://www.bilibili.com/",
    xiaohongshu: "https://www.xiaohongshu.com/",
    tiktok: "https://www.tiktok.com/",
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
    twitter: "https://x.com/",
    facebook: "https://www.facebook.com/",
    vimeo: "https://vimeo.com/",
    reddit: "https://www.reddit.com/",
  };

  const referer = referers[platform] || "https://www.douyin.com/";

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Referer: referer,
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          code: response.status,
          msg: `视频获取失败 (${response.status})`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
    headers.set("Content-Length", response.headers.get("Content-Length") || "0");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, { status: 200, headers });
  } catch (err) {
    return new Response(
      JSON.stringify({ code: 500, msg: "视频代理请求失败: " + err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}