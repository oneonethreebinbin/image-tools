import { computed, ref } from "vue";

export const I18N_KEY = Symbol("i18n");

export const messages = {
  zh: {
    site: {
      name: "ViewMax",
      tagline: "免费在线图片与视频工具箱",
      title: "ViewMax - 免费在线图片与视频工具箱",
      titleWatermark: "免费图片去水印工具 - AI 智能去水印 | ViewMax",
      titleCompress: "免费图片压缩工具 - 在线压缩 JPG/PNG/WebP | ViewMax",
      titleVideo: "在线视频链接解析工具 - 提取视频信息与封面 | ViewMax",
      description:
        "免费在线图片与视频工具箱。支持 AI 图片去水印、图片压缩、视频链接解析。图片处理尽量在浏览器本地完成。",
      descriptionWatermark:
        "在线图片去水印工具，支持 AI 修复、智能填充、模糊和裁剪，适合处理照片、商品图、社交媒体图片中的文字水印和标识。",
      descriptionCompress:
        "在线图片压缩工具，可压缩 JPG、PNG、WebP 图片，调整质量、输出格式和最大尺寸，快速减小图片体积。",
      descriptionVideo:
        "输入公开视频链接，提取视频标题、封面和可访问的视频信息。请仅解析自己拥有权利或已获得授权的内容。",
      keywords:
        "图片去水印,图片压缩,视频解析,在线图片工具,免费去水印,AI去水印,压缩图片,JPG压缩,PNG压缩,视频链接提取",
      copyright: "© 2026 ViewMax · 免费在线图片与视频工具箱",
      privacyNote:
        "图片压缩和基础去水印在您的浏览器中本地处理；AI 去水印和视频解析会按需调用后端服务。",
      language: "语言",
      chinese: "中文",
      english: "English",
      adBanner: "Google AdSense · 横幅广告位 (728x90)",
      adSidebar: "Google AdSense · 侧边栏广告位 (300x250)",
      adInline: "Google AdSense · 内容广告位",
      toolAd: "Google AdSense · 工具内广告位",
      whyChoose: "为什么选择我们？",
      features: [
        {
          icon: "🔒",
          title: "隐私友好",
          text: "压缩和基础去水印在浏览器中完成，减少图片上传风险。",
        },
        {
          icon: "⚡",
          title: "快速处理",
          text: "无需安装软件，上传图片后即可预览、调整并下载结果。",
        },
        {
          icon: "🆓",
          title: "免费使用",
          text: "适合日常照片、商品图、博客配图和社交媒体图片处理。",
        },
      ],
    },
    tabs: {
      watermark: {
        label: "图片去水印",
        icon: "🖼️",
        desc: "AI 修复 · 智能填充 · 模糊 · 裁剪",
      },
      compress: {
        label: "图片压缩",
        icon: "📉",
        desc: "压缩 JPG/PNG/WebP · 调整质量 · 格式转换",
      },
      video: {
        label: "视频解析",
        icon: "🎬",
        desc: "支持B站·小红书·抖音 · YouTube·Instagram·TikTok等 · 自动识别 · 提取视频地址",
      },
      markdown: {
        label: "文档转换",
        icon: "📝",
        desc: "Markdown 与 Word 互转 · 实时预览",
      },
    },
    common: {
      uploadTitle: "拖拽图片到这里，或点击上传",
      imageOnly: "请选择图片文件",
      reset: "重新上传",
      download: "下载结果",
      processing: "处理中...",
      formatSupportBasic: "支持 JPEG · PNG · WebP · BMP · GIF",
      formatSupportCompress: "支持 JPEG · PNG · WebP · BMP · GIF · SVG",
    },
    watermark: {
      aiOnline: "AI 就绪",
      aiOffline: "离线模式",
      aiOnlineTitle: "AI 修复服务已连接",
      aiOfflineTitle: "AI 修复服务未连接，将使用本地模式",
      remove: "去除水印",
      downloadResult: "下载处理后的图片",
      selectHint: "在图片上拖拽鼠标框选水印区域",
      selectedHint: "已选中水印区域，点击「去除水印」开始处理",
      done: "水印已去除，点击下载按钮保存结果",
      aiLoadingTitle: "AI 模型正在修复中...",
      aiLoadingHint: "LaMa 模型会分析图像内容并智能填充选区",
      methodLabel: "去除方式",
      methods: [
        { id: "ai", label: "🤖 AI 修复", desc: "LaMa 深度学习模型智能修复" },
        { id: "smart", label: "智能填充", desc: "浏览器本地边缘填充" },
        { id: "blur", label: "模糊处理", desc: "模糊水印区域" },
        { id: "crop", label: "裁剪", desc: "直接裁去选中区域" },
      ],
      paddingLabel: "边缘扩展：{value}px（扩大修复范围以提高质量）",
      blurLabel: "模糊强度：{value}px",
      aiRemove: "🚀 AI 智能去除",
      clearSelection: "重新框选",
      aiFailed: "AI 处理失败：{message}。已自动回退到智能填充模式。",
      tipsTitle: "使用提示",
      tips: [
        {
          icon: "🤖",
          title: "AI 修复（推荐）",
          text: "适合复杂背景和大面积水印，能尝试重建水印下方的纹理。",
        },
        {
          icon: "🎯",
          title: "精确框选",
          text: "框选时稍微留一点边距，再通过边缘扩展微调，通常效果更自然。",
        },
        {
          icon: "🧩",
          title: "智能填充",
          text: "浏览器本地处理的备用方案，适合纯色或简单背景。",
        },
        {
          icon: "✂️",
          title: "模糊 / 裁剪",
          text: "适合快速处理边角水印、日期标记或不重要的画面区域。",
        },
      ],
    },
    compressor: {
      loadFailed: "图片加载失败，请重试",
      original: "原始",
      compressed: "压缩后",
      previewAlt: "压缩预览",
      qualityLabel: "压缩质量",
      formatLabel: "输出格式",
      pngHint: "PNG 为无损格式，压缩质量设置不会生效。",
      dimensionLabel: "最大尺寸（可选，0 表示不限制）",
      widthPlaceholder: "宽度 (px)",
      heightPlaceholder: "高度 (px)",
      download: "下载压缩图片 ({size})",
      presets: [
        { label: "极致压缩", quality: 0.3, desc: "体积最小" },
        { label: "推荐", quality: 0.8, desc: "质量与大小平衡" },
        { label: "高质量", quality: 1, desc: "最佳画质" },
      ],
      formats: {
        jpeg: "JPEG（通用，体积小）",
        webp: "WebP（压缩率高，推荐）",
        png: "PNG（无损，支持透明）",
      },
      tipsTitle: "使用提示",
      tips: [
        {
          icon: "🎯",
          title: "选择合适的质量",
          text: "推荐 80% 质量，视觉差异极小但体积大幅减小。极致压缩适合网页图片，高质量适合打印或存档。",
        },
        {
          icon: "🔄",
          title: "格式转换建议",
          text: "WebP 格式通常比 JPEG 小 25%-35%，是网页使用的理想选择。JPEG 兼容性最好，PNG 适合需要保留透明背景的图片。",
        },
        {
          icon: "📐",
          title: "设置最大尺寸",
          text: "如果仅用于网页展示，设置最大宽度 1920px 或 1280px 通常就足够了，可以进一步减小文件体积。",
        },
        {
          icon: "🔒",
          title: "隐私安全",
          text: "图片压缩完全在浏览器本地完成，不会上传到服务器，你的隐私得到充分保护。",
        },
      ],
    },
    extractor: {
      backendOnline: "后端服务已连接",
      backendOffline: "后端服务未连接",
      inputLabel: "粘贴视频页面链接",
      placeholder:
        "粘贴视频分享链接，支持B站、小红书、抖音及YouTube/Instagram/TikTok/Vimeo/Reddit等短链接和完整页面链接",
      hint: "支持Bilibili、小红书、抖音及国外主流平台YouTube/Instagram/TikTok/Vimeo/Reddit等，自动识别平台",
      platformLabel: "来源平台",
      emptyInput: "请先粘贴视频链接",
      failed: "解析失败，请检查链接或稍后重试",
      networkError: "网络连接异常，请检查网络后重试",
      parse: "开始解析",
      parsing: "正在解析...",
      resultTitle: "解析结果",
      videoNotSupported: "您的浏览器不支持视频播放",
      downloadVideo: "下载视频",
      copyDownloadLink: "复制下载链接",
      partialNote: "无法直接提取视频地址，可通过页面链接查看原始内容",
      openPage: "查看原始页面",
      title: "标题",
      author: "作者",
      originLink: "原始链接",
      videoUrl: "视频地址",
      copy: "复制",
      compliance:
        "请仅解析您拥有版权、获得授权或允许下载的公开视频内容。本站不鼓励也不支持侵犯版权或违反第三方平台服务条款的行为。",
      emptyHint: "粘贴视频链接后点击解析，即可提取视频信息",
      tipsTitle: "使用提示",
      tips: [
        {
          icon: "🔗",
          title: "支持哪些平台？",
          text: "当前支持B站(bilibili)、小红书、抖音及国外主流平台(YouTube/Instagram/TikTok/Twitter/Facebook/Vimeo/Reddit)的分享链接和完整视频页面链接，粘贴后自动识别平台类型。",
        },
        {
          icon: "⚡",
          title: "解析过程",
          text: "短链接会先自动解析为完整页面地址，然后通过平台对应的提取策略获取视频信息。不同平台的解析速度略有差异。",
        },
        {
          icon: "📋",
          title: "提取结果",
          text: "成功解析后可在线预览视频、复制视频地址或直接下载。如遇平台登录验证等限制，会引导您查看原始页面。",
        },
        {
          icon: "⚠️",
          title: "使用注意",
          text: "请仅解析您拥有权利的公开内容。部分平台需登录或验证，可能导致无法直接提取视频地址，属于正常现象。",
        },
      ],
    },
    home: {
      heroTitle: "免费在线图片与视频工具箱",
      heroSubtitle: "ViewMax",
      heroDesc:
        "AI 图片去水印、图片压缩、视频链接解析 —— 一个工具箱，满足你的图片与视频处理需求。",
      toolsTitle: "选择工具",
      tryNow: "立即使用",
      tools: {
        watermark: {
          label: "图片去水印",
          icon: "🖼️",
          desc: "AI 修复、智能填充、模糊、裁剪，去除照片和商品图中的文字水印与标识。",
        },
        compress: {
          label: "图片压缩",
          icon: "📉",
          desc: "压缩 JPG、PNG、WebP 图片，调整质量、输出格式和最大尺寸。",
        },
        video: {
          label: "视频链接解析",
          icon: "🎬",
          desc: "粘贴视频分享链接，提取视频地址、标题和封面信息。",
        },
        markdown: {
          label: "Markdown 文档转换",
          icon: "📝",
          desc: "Markdown 转 Word、Word 转 Markdown，在线文档格式转换，浏览器本地处理。",
        },
      },
      featuresTitle: "为什么选择 ViewMax？",
      features: [
        {
          icon: "🔒",
          title: "隐私安全",
          text: "图片压缩和基础去水印在浏览器中完成，不会上传到服务器。",
        },
        {
          icon: "⚡",
          title: "快速高效",
          text: "无需安装软件，打开网页即可使用。压缩和去水印实时预览，即时下载。",
        },
        {
          icon: "🆓",
          title: "完全免费",
          text: "所有工具均可免费使用，无隐藏收费，无次数限制。",
        },
        {
          icon: "🌐",
          title: "中英双语",
          text: "支持中文和英文界面，自动根据浏览器语言切换，也可手动选择。",
        },
        {
          icon: "📱",
          title: "移动友好",
          text: "响应式设计，在手机、平板和电脑上均可流畅使用。",
        },
        {
          icon: "🛡️",
          title: "合规使用",
          text: "视频解析工具包含版权声明，仅解析您拥有权利的公开内容。",
        },
      ],
      faqTitle: "常见问题",
      faq: [
        {
          q: "使用图片去水印工具会影响图片质量吗？",
          a: "AI 修复模式会尽量重建水印下方的纹理，通常效果最好。智能填充模式在简单背景下表现也不错。模糊和裁剪模式会直接影响画面，适合不重要的区域。",
        },
        {
          q: "压缩图片会明显降低画质吗？",
          a: "使用推荐压缩质量（80%）时，大多数图片的视觉差异难以察觉，但文件体积可以显著减小。你可以在压缩前后实时对比效果。",
        },
        {
          q: "视频链接解析工具支持哪些平台？",
          a: "目前支持B站(bilibili)、小红书、抖音及国外主流平台(YouTube/Instagram/TikTok/Twitter/Facebook/Vimeo/Reddit)。粘贴分享链接后自动识别平台类型，无需手动选择。由于各平台的反爬策略不同，部分链接可能无法成功解析。",
        },
        {
          q: "我的图片会被上传到服务器吗？",
          a: "图片压缩和基础去水印处理完全在浏览器本地完成。AI 去水印模式需要将选中区域上传到修复服务。视频解析需要将链接发送到后端处理。",
        },
        {
          q: "这个网站有使用限制吗？",
          a: "目前没有使用次数或文件大小的硬性限制。但为了最佳体验，建议处理单个文件不超过 50MB 的图片。",
        },
      ],
      privacyTitle: "隐私说明",
      privacyText:
        "图片压缩和基础去水印在您的浏览器中本地处理。AI 去水印模式会按需调用修复服务。视频解析通过后端服务提取公开链接中的信息。我们不会存储您的图片或视频文件。",
    },
    markdown: {
      modeMdToWord: "Markdown 转 Word",
      modeWordToMd: "Word 转 Markdown",
      fileNameLabel: "输出文件名",
      fileNamePlaceholder: "请输入文件名",
      markdownInputLabel: "输入 Markdown 内容",
      markdownPlaceholder:
        "在此输入或粘贴 Markdown 内容...\n\n# 示例标题\n\n这是一段普通文本，**支持加粗**和*斜体*。\n\n- 列表项 1\n- 列表项 2\n\n```javascript\nconsole.log('Hello World')\n```",
      convertToWord: "转换为 Word",
      converting: "正在转换...",
      downloadMarkdown: "下载 Markdown",
      downloadHtml: "下载 HTML",
      uploadWordTitle: "拖拽 Word 文件到这里，或点击上传",
      uploadWordHint: "支持 .docx 格式",
      wordFileSize: "文件大小",
      extractedResult: "提取结果",
      emptyResult: "转换结果为空，请检查输入内容",
      conversionError: "转换失败，请检查 Markdown 格式后重试",
      invalidWordFile: "请选择 .docx 或 .doc 格式的文件",
      docNotSupported: "暂不支持旧版 .doc 格式，请使用 .docx 格式",
      wordParseError: "文件解析失败，请确保文件格式正确",
      fileReadError: "文件读取失败，请重试",
      livePreview: "实时预览",
      tipsTitle: "使用提示",
      tips: [
        {
          icon: "📝",
          title: "支持标准 Markdown",
          text: "支持标题、加粗、斜体、链接、代码块、列表、表格等标准 Markdown 语法。",
        },
        {
          icon: "📄",
          title: "Word 转 Markdown",
          text: "上传 .docx 文件，自动提取内容并转换为 Markdown 格式，支持下载 .md 和 .html 文件。",
        },
        {
          icon: "🔒",
          title: "隐私安全",
          text: "所有转换在浏览器本地完成，文件不会上传到服务器，保护您的隐私安全。",
        },
        {
          icon: "💡",
          title: "灵活输出",
          text: "可自定义输出文件名，Markdown 转 Word 支持保留格式、标题层级和列表结构。",
        },
      ],
    },
  },
  en: {
    site: {
      name: "ViewMax",
      tagline: "Free online image & video toolbox",
      title: "ViewMax - Free Image & Video Toolbox",
      titleWatermark:
        "Free Image Watermark Remover - AI Watermark Removal | ViewMax",
      titleCompress:
        "Free Image Compressor - Compress JPG, PNG and WebP | ViewMax",
      titleVideo:
        "Online Video Link Extractor - Extract Video Info & Thumbnail | ViewMax",
      description:
        "Free online image and video toolbox. Remove watermarks with AI, compress JPG/PNG/WebP images, and extract public video information — most processing stays in your browser.",
      descriptionWatermark:
        "Remove watermarks from images online with AI repair, smart fill, blur and crop tools for photos, product images and social media graphics.",
      descriptionCompress:
        "Compress images online. Reduce JPG, PNG and WebP file size, adjust quality, output format and maximum dimensions, then download instantly.",
      descriptionVideo:
        "Extract public video title, thumbnail and accessible media information from a video page link. Only parse content you own the rights to or are authorized to access.",
      keywords:
        "image watermark remover,image compressor,video link extractor,remove watermark online,AI watermark remover,compress image,extract video info",
      copyright: "© 2026 ViewMax · Free online image & video toolbox",
      privacyNote:
        "Image compression and basic watermark removal run in your browser; AI repair and video extraction call backend services when selected.",
      language: "Language",
      chinese: "中文",
      english: "English",
      adBanner: "Google AdSense · Banner ad slot (728x90)",
      adSidebar: "Google AdSense · Sidebar ad slot (300x250)",
      adInline: "Google AdSense · Content ad slot",
      toolAd: "Google AdSense · In-tool ad slot",
      whyChoose: "Why choose us?",
      features: [
        {
          icon: "🔒",
          title: "Privacy friendly",
          text: "Compression and basic watermark removal run in your browser to reduce upload risk.",
        },
        {
          icon: "⚡",
          title: "Fast workflow",
          text: "No software install. Upload, preview, tune settings and download the result.",
        },
        {
          icon: "🆓",
          title: "Free to use",
          text: "Useful for everyday photos, product images, blog graphics and social media assets.",
        },
      ],
    },
    tabs: {
      watermark: {
        label: "Watermark Remover",
        icon: "🖼️",
        desc: "AI repair · Smart fill · Blur · Crop",
      },
      compress: {
        label: "Image Compressor",
        icon: "📉",
        desc: "Compress JPG/PNG/WebP · Tune quality · Convert format",
      },
      video: {
        label: "Video Extractor",
        icon: "🎬",
        desc: "Bilibili·Xiaohongshu·Douyin · YouTube·Instagram·TikTok·Vimeo · Auto detect · Extract video",
      },
      markdown: {
        label: "Doc Converter",
        icon: "📝",
        desc: "Markdown ↔ Word · Live preview",
      },
    },
    common: {
      uploadTitle: "Drag an image here, or click to upload",
      imageOnly: "Please choose an image file",
      reset: "Upload another image",
      download: "Download result",
      processing: "Processing...",
      formatSupportBasic: "Supports JPEG · PNG · WebP · BMP · GIF",
      formatSupportCompress: "Supports JPEG · PNG · WebP · BMP · GIF · SVG",
    },
    watermark: {
      aiOnline: "AI ready",
      aiOffline: "Offline mode",
      aiOnlineTitle: "AI repair service is connected",
      aiOfflineTitle:
        "AI repair service is not connected; local mode will be used",
      remove: "Remove watermark",
      downloadResult: "Download processed image",
      selectHint: "Drag on the image to select the watermark area",
      selectedHint:
        "Watermark area selected. Click 「Remove watermark」 to process it",
      done: "Watermark removed. Download the result when ready",
      aiLoadingTitle: "AI model is repairing...",
      aiLoadingHint:
        "The LaMa model analyzes the image and fills the selected area",
      methodLabel: "Removal method",
      methods: [
        {
          id: "ai",
          label: "🤖 AI repair",
          desc: "LaMa deep-learning restoration",
        },
        { id: "smart", label: "Smart fill", desc: "Local edge-based fill" },
        { id: "blur", label: "Blur", desc: "Blur the watermark area" },
        { id: "crop", label: "Crop", desc: "Crop away the selected area" },
      ],
      paddingLabel:
        "Edge padding: {value}px (expand the repair area for better quality)",
      blurLabel: "Blur strength: {value}px",
      aiRemove: "🚀 Remove with AI",
      clearSelection: "Select again",
      aiFailed: "AI processing failed: {message}. Falling back to smart fill.",
      tipsTitle: "Tips",
      tips: [
        {
          icon: "🤖",
          title: "AI repair recommended",
          text: "Best for complex backgrounds and larger watermarks where texture reconstruction matters.",
        },
        {
          icon: "🎯",
          title: "Select precisely",
          text: "Leave a small margin around the watermark and tune edge padding for a cleaner repair.",
        },
        {
          icon: "🧩",
          title: "Smart fill",
          text: "A local fallback that works well on plain or simple backgrounds.",
        },
        {
          icon: "✂️",
          title: "Blur / crop",
          text: "Good for quick fixes on corner watermarks, timestamps or unimportant areas.",
        },
      ],
    },
    compressor: {
      loadFailed: "Image failed to load. Please try again",
      original: "Original",
      compressed: "Compressed",
      previewAlt: "Compressed preview",
      qualityLabel: "Compression quality",
      formatLabel: "Output format",
      pngHint: "PNG is lossless, so the quality slider does not apply.",
      dimensionLabel: "Maximum dimensions (optional, 0 means unlimited)",
      widthPlaceholder: "Width (px)",
      heightPlaceholder: "Height (px)",
      download: "Download compressed image ({size})",
      presets: [
        { label: "Max compression", quality: 0.3, desc: "Smallest size" },
        {
          label: "Recommended",
          quality: 0.8,
          desc: "Balanced quality and size",
        },
        { label: "High quality", quality: 1, desc: "Best quality" },
      ],
      formats: {
        jpeg: "JPEG (universal, small size)",
        webp: "WebP (best compression, recommended)",
        png: "PNG (lossless, transparent)",
      },
      tipsTitle: "Tips",
      tips: [
        {
          icon: "🎯",
          title: "Pick the right quality",
          text: "80% quality is recommended — the visual difference is barely noticeable while file size drops significantly. Max compression is great for web images; high quality suits print or archiving.",
        },
        {
          icon: "🔄",
          title: "Format conversion tips",
          text: "WebP is typically 25%-35% smaller than JPEG, ideal for websites. JPEG has the broadest compatibility. PNG is best when you need a transparent background.",
        },
        {
          icon: "📐",
          title: "Set maximum dimensions",
          text: "For web display, setting a maximum width of 1920px or 1280px is usually enough and can further reduce file size.",
        },
        {
          icon: "🔒",
          title: "Privacy safe",
          text: "Image compression happens entirely in your browser. Nothing is uploaded to a server — your privacy is fully protected.",
        },
      ],
    },
    extractor: {
      backendOnline: "Backend connected",
      backendOffline: "Backend disconnected",
      inputLabel: "Paste a video page link",
      placeholder:
        "Paste a video share link — supports Bilibili, Xiaohongshu, Douyin & YouTube/Instagram/TikTok/Vimeo/Reddit short links and full URLs",
      hint: "Supports Bilibili, Xiaohongshu, Douyin and YouTube/Instagram/TikTok/Vimeo/Reddit — auto-detects the platform",
      platformLabel: "Platform",
      emptyInput: "Please paste a video link first",
      failed: "Failed to extract. Please check the link and try again",
      networkError: "Network error. Please check your connection and try again",
      parse: "Extract",
      parsing: "Extracting...",
      resultTitle: "Result",
      videoNotSupported: "Your browser does not support video playback",
      downloadVideo: "Download video",
      copyDownloadLink: "Copy download link",
      partialNote:
        "Could not extract the direct video URL. You can view the original page instead.",
      openPage: "View original page",
      title: "Title",
      author: "Author",
      originLink: "Original link",
      videoUrl: "Video URL",
      copy: "Copy",
      compliance:
        "Please only extract content you own the copyright to, are authorized to use, or have permission to download. We do not encourage or support copyright infringement or violations of third-party platform terms of service.",
      emptyHint:
        "Paste a video link and click Extract to retrieve video information",
      tipsTitle: "Tips",
      tips: [
        {
          icon: "🔗",
          title: "Supported platforms",
          text: "Currently supports Bilibili, Xiaohongshu, Douyin and global platforms (YouTube/Instagram/TikTok/Twitter/Facebook/Vimeo/Reddit). Paste a short share link or full video page URL and the platform is auto-detected.",
        },
        {
          icon: "⚡",
          title: "How it works",
          text: "Short links are resolved to full URLs first, then a platform-specific extraction strategy fetches the video info. Speed varies by platform.",
        },
        {
          icon: "📋",
          title: "Results",
          text: "You can preview, copy the video URL, or download. If login verification or other restrictions block extraction, we will guide you to the original page.",
        },
        {
          icon: "⚠️",
          title: "Please note",
          text: "Only parse public content you have rights to. Some platforms require authentication, which may prevent direct video URL extraction.",
        },
      ],
    },
    home: {
      heroTitle: "Free Online Image & Video Toolbox",
      heroSubtitle: "ViewMax",
      heroDesc:
        "AI watermark removal, image compression, and video link extraction — all in one place.",
      toolsTitle: "Choose a tool",
      tryNow: "Try it now",
      tools: {
        watermark: {
          label: "Watermark Remover",
          icon: "🖼️",
          desc: "Remove watermarks from photos with AI repair, smart fill, blur, or crop.",
        },
        compress: {
          label: "Image Compressor",
          icon: "📉",
          desc: "Compress JPG, PNG, and WebP images. Adjust quality, format, and dimensions.",
        },
        video: {
          label: "Video Link Extractor",
          icon: "🎬",
          desc: "Paste a video share link to extract the video URL, title, and cover image.",
        },
        markdown: {
          label: "Markdown Converter",
          icon: "📝",
          desc: "Convert Markdown to Word and Word to Markdown. Online document conversion, processed in your browser.",
        },
      },
      featuresTitle: "Why choose ViewMax?",
      features: [
        {
          icon: "🔒",
          title: "Privacy first",
          text: "Image compression and basic watermark removal run in your browser. No uploads required.",
        },
        {
          icon: "⚡",
          title: "Fast & efficient",
          text: "No software to install. Real-time preview, instant download.",
        },
        {
          icon: "🆓",
          title: "100% free",
          text: "All tools are free to use. No hidden fees, no usage limits.",
        },
        {
          icon: "🌐",
          title: "Bilingual",
          text: "Chinese and English interfaces. Auto-detects your browser language or switch manually.",
        },
        {
          icon: "📱",
          title: "Mobile friendly",
          text: "Responsive design works smoothly on phones, tablets, and desktops.",
        },
        {
          icon: "🛡️",
          title: "Responsible use",
          text: "Video extraction includes copyright notice. Only parse content you have rights to.",
        },
      ],
      faqTitle: "FAQ",
      faq: [
        {
          q: "Will removing watermarks affect image quality?",
          a: "AI repair mode attempts to reconstruct the texture behind the watermark and usually gives the best results. Smart fill mode works well on plain backgrounds. Blur and crop modes directly modify the image and are better for non-critical areas.",
        },
        {
          q: "Does compression noticeably reduce image quality?",
          a: "At the recommended quality (80%), the visual difference is barely noticeable for most images, while file size can be significantly reduced. Compare before and after in real time.",
        },
        {
          q: "What platforms does the video extractor support?",
          a: "It currently supports Bilibili, Xiaohongshu, Douyin and global platforms (YouTube/Instagram/TikTok/Twitter/Facebook/Vimeo/Reddit). The platform is auto-detected from the link — no manual selection needed. Due to varying anti-scraping measures, some links may not be successfully parsed.",
        },
        {
          q: "Are my images uploaded to a server?",
          a: "Image compression and basic watermark removal are done entirely in your browser. AI watermark repair sends the selected area to a restoration service. Video extraction sends the link to our backend for processing.",
        },
        {
          q: "Are there any usage limits?",
          a: "There are currently no hard limits on usage count or file size. For the best experience, we recommend processing images under 50MB individually.",
        },
      ],
      privacyTitle: "Privacy notice",
      privacyText:
        "Image compression and basic watermark removal are processed locally in your browser. AI watermark repair calls a restoration service when selected. Video extraction fetches public link information through our backend. We do not store your images or video files.",
    },
    markdown: {
      modeMdToWord: "Markdown to Word",
      modeWordToMd: "Word to Markdown",
      fileNameLabel: "Output file name",
      fileNamePlaceholder: "Enter file name",
      markdownInputLabel: "Enter Markdown content",
      markdownPlaceholder:
        "Type or paste Markdown content here...\n\n# Example Heading\n\nThis is a paragraph with **bold** and *italic* text.\n\n- List item 1\n- List item 2\n\n```javascript\nconsole.log('Hello World')\n```",
      convertToWord: "Convert to Word",
      converting: "Converting...",
      downloadMarkdown: "Download Markdown",
      downloadHtml: "Download HTML",
      uploadWordTitle: "Drag a Word file here, or click to upload",
      uploadWordHint: "Supports .docx format",
      wordFileSize: "File size",
      extractedResult: "Extracted result",
      emptyResult: "Conversion result is empty. Please check the input content",
      conversionError:
        "Conversion failed. Please check the Markdown format and try again",
      invalidWordFile: "Please select a .docx or .doc file",
      docNotSupported:
        "Old .doc format is not supported yet. Please use .docx format",
      wordParseError:
        "File parsing failed. Please ensure the file format is correct",
      fileReadError: "File read failed. Please try again",
      livePreview: "Live Preview",
      tipsTitle: "Tips",
      tips: [
        {
          icon: "📝",
          title: "Standard Markdown Support",
          text: "Supports headings, bold, italic, links, code blocks, lists, tables and other standard Markdown syntax.",
        },
        {
          icon: "📄",
          title: "Word to Markdown",
          text: "Upload a .docx file, automatically extract content and convert to Markdown format. Download as .md or .html.",
        },
        {
          icon: "🔒",
          title: "Privacy Safe",
          text: "All conversions happen in your browser. Files are not uploaded to any server, protecting your privacy.",
        },
        {
          icon: "💡",
          title: "Flexible Output",
          text: "Customize the output file name. Markdown to Word preserves formatting, heading levels and list structures.",
        },
      ],
    },
  },
};

function getInitialLanguage() {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get("lang");
  if (fromUrl === "zh" || fromUrl === "en") return fromUrl;

  const saved = window.localStorage.getItem("image-tools-language");
  if (saved === "zh" || saved === "en") return saved;

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  const hasChineseLanguage = languages.some((lang) =>
    lang?.toLowerCase().startsWith("zh"),
  );
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return hasChineseLanguage || timeZone === "Asia/Shanghai" ? "zh" : "en";
}

export function createI18n() {
  const language = ref(getInitialLanguage());
  const locale = computed(() => messages[language.value]);

  function setLanguage(nextLanguage) {
    if (!messages[nextLanguage]) return;
    language.value = nextLanguage;
    window.localStorage.setItem("image-tools-language", nextLanguage);
  }

  function t(path, params = {}) {
    const value = path
      .split(".")
      .reduce((current, key) => current?.[key], locale.value);
    if (typeof value !== "string") return value ?? path;
    return Object.entries(params).reduce(
      (text, [key, replacement]) => text.replaceAll(`{${key}}`, replacement),
      value,
    );
  }

  return { language, locale, setLanguage, t };
}
