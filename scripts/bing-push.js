#!/usr/bin/env node

/**
 * Bing / IndexNow 主动推送脚本
 *
 * 支持两种模式：
 * 1. IndexNow - 一次性提交给 Bing、Yandex 等支持 IndexNow 的搜索引擎
 * 2. Bing XML Sitemap 提交
 *
 * 使用方法：
 *   node scripts/bing-push.js indexnow
 *   node scripts/bing-push.js sitemap
 */

// ===== IndexNow 配置 =====
// IndexNow API Key - 使用时需要替换为你自己的 key
// 获取方式：访问 https://www.bing.com/indexnow 了解如何获取
// key 是一串随机字符，同时需要在网站根目录放置同名的 txt 文件
const INDEXNOW_CONFIG = {
  host: "www.viewmax.top",
  key: "your-indexnow-key-here", // 替换为你的 IndexNow API Key
  keyLocation: "https://www.viewmax.top/your-indexnow-key-here.txt",
};

// 需要提交的URL列表
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

/**
 * IndexNow 推送
 * 文档：https://www.indexnow.org/documentation
 */
async function pushIndexNow(urls) {
  const apiUrl = "https://api.indexnow.org/indexnow";

  const payload = {
    host: INDEXNOW_CONFIG.host,
    key: INDEXNOW_CONFIG.key,
    keyLocation: INDEXNOW_CONFIG.keyLocation,
    urlList: urls,
  };

  console.log(`\n请求地址: ${apiUrl}`);
  console.log(`Host: ${payload.host}`);
  console.log(`推送URL数量: ${urls.length}\n`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const statusCode = response.status;
  let message = "";

  switch (statusCode) {
    case 200:
      message = "URLs submitted successfully";
      break;
    case 202:
      message = "URLs received and will be processed";
      break;
    case 400:
      message = "Invalid request - check URL format";
      break;
    case 403:
      message = "Forbidden - API key mismatch or invalid key";
      break;
    case 422:
      message = "Unprocessable - URL doesn't belong to the host";
      break;
    case 429:
      message = "Too Many Requests - rate limit exceeded";
      break;
    default:
      message = `Unexpected status code: ${statusCode}`;
  }

  console.log(`状态码: ${statusCode}`);
  console.log(`结果: ${message}`);

  if (statusCode === 403) {
    console.log("\n提示：IndexNow API Key 不匹配或无效。");
    console.log("请确保：");
    console.log("1. 已生成有效的 API Key");
    console.log("2. 在网站根目录放置了同名的 txt 文件");
    console.log(`   例如: https://www.viewmax.top/${INDEXNOW_CONFIG.key}.txt`);
  }

  return { statusCode, message };
}

/**
 * 显示 Bing 站点地图提交指南
 */
function showBingSitemapGuide() {
  console.log("=== Bing 站点地图提交指南 ===\n");
  console.log("1. 访问 Bing Webmaster Tools: https://www.bing.com/webmasters");
  console.log("2. 注册/登录你的微软账户");
  console.log('3. 点击"添加站点"，输入你的域名 viewmax.top');
  console.log('4. 选择验证方式（推荐"HTML元标签"验证）');
  console.log("5. 复制验证代码，我会帮你添加到 index.html");
  console.log('6. 在"站点地图"页面，提交以下地址：');
  console.log("   https://www.viewmax.top/sitemap.xml\n");
  console.log("7. 在"提交URL"页面，逐个提交主要页面URL\n");
}

/**
 * 显示 IndexNow 设置指南
 */
function showIndexNowGuide() {
  console.log("=== IndexNow 设置指南 ===\n");
  console.log("IndexNow 是一个开放协议，提交一次即可被多个搜索引擎发现：");
  console("- Bing (必应)");
  console("- Yandex (俄罗斯搜索引擎)");
  console("- Seznam (捷克搜索引擎)");
  console("- Naver (韩国搜索引擎)\n");

  console.log("设置步骤：\n");
  console.log("1. 生成一个 API Key（任意随机字符串）：");
    console.log(`   可以使用在线工具生成，或运行: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"\n`);

  console.log("2. 在网站根目录创建同名 txt 文件：");
  console.log("   例如 key 为 abc123，则创建:");
  console.log("   https://www.viewmax.top/abc123.txt");
  console.log("   文件内容为 key 本身: abc123\n");

  console.log("3. 更新本脚本中的 INDEXNOW_CONFIG 配置：");
  console.log('   key: "你的API Key"');
  console.log('   keyLocation: "https://www.viewmax.top/你的API Key.txt"\n');

  console.log("4. 运行推送：");
  console.log("   node scripts/bing-push.js indexnow\n");
}

// 主函数
async function main() {
  const mode = process.argv[2] || "guide";

  switch (mode) {
    case "indexnow":
      console.log("=== IndexNow 主动推送 ===\n");
      console.log("搜索引擎: Bing, Yandex, Seznam, Naver");
      await pushIndexNow(URLS);
      break;

    case "sitemap":
      showBingSitemapGuide();
      break;

    case "guide":
    default:
      showIndexNowGuide();
      showBingSitemapGuide();
      break;
  }

  console.log("\n=== 完成 ===");
}

main();