#!/usr/bin/env node

/**
 * 百度站长平台主动推送脚本
 *
 * 使用方法：node scripts/baidu-push.js
 */

// 百度推送配置
const CONFIG = {
  site: "https://www.viewmax.top",
  token: "a7lfOhxzxeNH45Zk",
};

// 需要推送的URL列表
const URLS = [
  "https://www.viewmax.top/",
  "https://www.viewmax.top/image-watermark-remover",
  "https://www.viewmax.top/image-compressor",
  "https://www.viewmax.top/video-link-extractor",
  "https://www.viewmax.top/markdown-word-converter",
  "https://www.viewmax.top/toolbox",
  "https://www.viewmax.top/toolbox/image-cropper",
  "https://www.viewmax.top/toolbox/image-format-converter",
  "https://www.viewmax.top/toolbox/pdf-to-word",
  "https://www.viewmax.top/toolbox/pdf-merger",
  // 多语言URL
  "https://www.viewmax.top/?lang=zh",
  "https://www.viewmax.top/?lang=en",
  "https://www.viewmax.top/image-watermark-remover?lang=zh",
  "https://www.viewmax.top/image-watermark-remover?lang=en",
  "https://www.viewmax.top/image-compressor?lang=zh",
  "https://www.viewmax.top/image-compressor?lang=en",
  "https://www.viewmax.top/video-link-extractor?lang=zh",
  "https://www.viewmax.top/video-link-extractor?lang=en",
  "https://www.viewmax.top/markdown-word-converter?lang=zh",
  "https://www.viewmax.top/markdown-word-converter?lang=en",
  "https://www.viewmax.top/toolbox?lang=zh",
  "https://www.viewmax.top/toolbox?lang=en",
  "https://www.viewmax.top/toolbox/image-cropper?lang=zh",
  "https://www.viewmax.top/toolbox/image-cropper?lang=en",
  "https://www.viewmax.top/toolbox/image-format-converter?lang=zh",
  "https://www.viewmax.top/toolbox/image-format-converter?lang=en",
  "https://www.viewmax.top/toolbox/pdf-to-word?lang=zh",
  "https://www.viewmax.top/toolbox/pdf-to-word?lang=en",
  "https://www.viewmax.top/toolbox/pdf-merger?lang=zh",
  "https://www.viewmax.top/toolbox/pdf-merger?lang=en",
];

async function pushToBaidu(urls) {
  const apiUrl = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(CONFIG.site)}&token=${CONFIG.token}`;
  const postData = urls.join("\n");

  console.log(`\n请求地址: ${apiUrl}`);
  console.log(`推送内容:\n${postData}\n`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: postData,
  });

  const result = await response.json();
  return result;
}

async function main() {
  console.log("=== 百度主动推送脚本 ===\n");
  console.log(`站点: ${CONFIG.site}`);
  console.log(`Token: ${CONFIG.token}`);
  console.log(`待推送URL数量: ${URLS.length}\n`);

  // 百度推送每次最多1000条
  const batchSize = 1000;
  for (let i = 0; i < URLS.length; i += batchSize) {
    const batch = URLS.slice(i, i + batchSize);
    console.log(
      `推送第 ${Math.floor(i / batchSize) + 1} 批 (${batch.length} 条)...`,
    );

    try {
      const result = await pushToBaidu(batch);
      console.log("推送结果:", JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`✓ 成功推送 ${result.success} 条`);
      }
      if (result.remain !== undefined) {
        console.log(`剩余配额: ${result.remain} 条`);
      }
      if (result.not_same_site) {
        console.log(`非本站URL: ${result.not_same_site.join(", ")}`);
      }
      if (result.not_valid) {
        console.log(`无效URL: ${result.not_valid.join(", ")}`);
      }
    } catch (error) {
      console.error("推送失败:", error.message);
    }
  }

  console.log("\n=== 推送完成 ===");
}

main();
