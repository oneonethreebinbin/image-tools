import { computed, ref } from 'vue'

export const I18N_KEY = Symbol('i18n')

export const messages = {
  zh: {
    site: {
      name: '图片工具箱',
      tagline: '免费在线图片去水印与图片压缩工具',
      title: '图片工具箱 - 免费在线图片去水印与图片压缩',
      titleWatermark: '免费图片去水印工具 - AI 智能去水印 | 图片工具箱',
      titleCompress: '免费图片压缩工具 - 在线压缩 JPG/PNG/WebP | 图片工具箱',
      description:
        '免费在线图片去水印和图片压缩工具。支持 AI 智能去水印、本地模糊、智能填充、JPG/PNG/WebP 压缩与格式转换，图片处理尽量在浏览器本地完成。',
      descriptionWatermark:
        '在线图片去水印工具，支持 AI 修复、智能填充、模糊和裁剪，适合处理照片、商品图、社交媒体图片中的文字水印和标识。',
      descriptionCompress:
        '在线图片压缩工具，可压缩 JPG、PNG、WebP 图片，调整质量、输出格式和最大尺寸，快速减小图片体积。',
      keywords:
        '图片去水印,图片压缩,在线图片工具,免费去水印,AI去水印,压缩图片,JPG压缩,PNG压缩,WebP压缩',
      copyright: '© 2026 图片工具箱 · 免费在线图片处理工具',
      privacyNote: '图片在您的浏览器中本地处理；AI 去水印模式会按需调用修复服务。',
      language: '语言',
      chinese: '中文',
      english: 'English',
      adBanner: 'Google AdSense · 横幅广告位 (728x90)',
      adSidebar: 'Google AdSense · 侧边栏广告位 (300x250)',
      adInline: 'Google AdSense · 内容广告位',
      toolAd: 'Google AdSense · 工具内广告位',
      whyChoose: '为什么选择我们？',
      features: [
        {
          icon: '🔒',
          title: '隐私友好',
          text: '压缩和基础去水印在浏览器中完成，减少图片上传风险。',
        },
        {
          icon: '⚡',
          title: '快速处理',
          text: '无需安装软件，上传图片后即可预览、调整并下载结果。',
        },
        {
          icon: '🆓',
          title: '免费使用',
          text: '适合日常照片、商品图、博客配图和社交媒体图片处理。',
        },
      ],
    },
    tabs: {
      watermark: {
        label: '图片去水印',
        icon: '🖼️',
        desc: 'AI 修复 · 智能填充 · 模糊 · 裁剪',
      },
      compress: {
        label: '图片压缩',
        icon: '📉',
        desc: '压缩 JPG/PNG/WebP · 调整质量 · 格式转换',
      },
    },
    common: {
      uploadTitle: '拖拽图片到这里，或点击上传',
      imageOnly: '请选择图片文件',
      reset: '重新上传',
      download: '下载结果',
      processing: '处理中...',
      formatSupportBasic: '支持 JPEG · PNG · WebP · BMP · GIF',
      formatSupportCompress: '支持 JPEG · PNG · WebP · BMP · GIF · SVG',
    },
    watermark: {
      aiOnline: 'AI 就绪',
      aiOffline: '离线模式',
      aiOnlineTitle: 'AI 修复服务已连接',
      aiOfflineTitle: 'AI 修复服务未连接，将使用本地模式',
      remove: '去除水印',
      downloadResult: '下载处理后的图片',
      selectHint: '在图片上拖拽鼠标框选水印区域',
      selectedHint: '已选中水印区域，点击“去除水印”开始处理',
      done: '水印已去除，点击下载按钮保存结果',
      aiLoadingTitle: 'AI 模型正在修复中...',
      aiLoadingHint: 'LaMa 模型会分析图像内容并智能填充选区',
      methodLabel: '去除方式',
      methods: [
        { id: 'ai', label: '🤖 AI 修复', desc: 'LaMa 深度学习模型智能修复' },
        { id: 'smart', label: '智能填充', desc: '浏览器本地边缘填充' },
        { id: 'blur', label: '模糊处理', desc: '模糊水印区域' },
        { id: 'crop', label: '裁剪', desc: '直接裁去选中区域' },
      ],
      paddingLabel: '边缘扩展：{value}px（扩大修复范围以提高质量）',
      blurLabel: '模糊强度：{value}px',
      aiRemove: '🚀 AI 智能去除',
      clearSelection: '重新框选',
      aiFailed:
        'AI 处理失败：{message}。已自动回退到智能填充模式。',
      tipsTitle: '使用提示',
      tips: [
        {
          icon: '🤖',
          title: 'AI 修复（推荐）',
          text: '适合复杂背景和大面积水印，能尝试重建水印下方的纹理。',
        },
        {
          icon: '🎯',
          title: '精确框选',
          text: '框选时稍微留一点边距，再通过边缘扩展微调，通常效果更自然。',
        },
        {
          icon: '🧩',
          title: '智能填充',
          text: '浏览器本地处理的备用方案，适合纯色或简单背景。',
        },
        {
          icon: '✂️',
          title: '模糊 / 裁剪',
          text: '适合快速处理边角水印、日期标记或不重要的画面区域。',
        },
      ],
    },
    compressor: {
      loadFailed: '图片加载失败，请重试',
      original: '原始',
      compressed: '压缩后',
      previewAlt: '压缩预览',
      qualityLabel: '压缩质量',
      formatLabel: '输出格式',
      pngHint: 'PNG 为无损格式，压缩质量设置不会生效。',
      dimensionLabel: '最大尺寸（可选，0 表示不限制）',
      widthPlaceholder: '宽度 (px)',
      heightPlaceholder: '高度 (px)',
      download: '下载压缩图片 ({size})',
      presets: [
        { label: '极致压缩', quality: 0.3, desc: '体积最小' },
        { label: '推荐', quality: 0.8, desc: '质量与大小平衡' },
        { label: '高质量', quality: 1, desc: '最佳画质' },
      ],
      formats: {
        jpeg: 'JPEG（通用，体积小）',
        webp: 'WebP（压缩率高，推荐）',
        png: 'PNG（无损，支持透明）',
      },
    },
  },
  en: {
    site: {
      name: 'Image Toolbox',
      tagline: 'Free online image watermark remover and image compressor',
      title: 'Image Toolbox - Free Image Watermark Remover & Compressor',
      titleWatermark: 'Free Image Watermark Remover - AI Watermark Removal | Image Toolbox',
      titleCompress: 'Free Image Compressor - Compress JPG, PNG and WebP | Image Toolbox',
      description:
        'Free online tools for image watermark removal and image compression. Remove watermarks with AI, smart fill, blur or crop, and compress JPG, PNG and WebP images in your browser.',
      descriptionWatermark:
        'Remove watermarks from images online with AI repair, smart fill, blur and crop tools for photos, product images and social media graphics.',
      descriptionCompress:
        'Compress images online. Reduce JPG, PNG and WebP file size, adjust quality, output format and maximum dimensions, then download instantly.',
      keywords:
        'image watermark remover,image compressor,remove watermark online,AI watermark remover,compress image,JPG compressor,PNG compressor,WebP compressor',
      copyright: '© 2026 Image Toolbox · Free online image tools',
      privacyNote: 'Images are processed locally in your browser when possible; AI repair calls the restoration service when selected.',
      language: 'Language',
      chinese: '中文',
      english: 'English',
      adBanner: 'Google AdSense · Banner ad slot (728x90)',
      adSidebar: 'Google AdSense · Sidebar ad slot (300x250)',
      adInline: 'Google AdSense · Content ad slot',
      toolAd: 'Google AdSense · In-tool ad slot',
      whyChoose: 'Why choose us?',
      features: [
        {
          icon: '🔒',
          title: 'Privacy friendly',
          text: 'Compression and basic watermark removal run in your browser to reduce upload risk.',
        },
        {
          icon: '⚡',
          title: 'Fast workflow',
          text: 'No software install. Upload, preview, tune settings and download the result.',
        },
        {
          icon: '🆓',
          title: 'Free to use',
          text: 'Useful for everyday photos, product images, blog graphics and social media assets.',
        },
      ],
    },
    tabs: {
      watermark: {
        label: 'Watermark Remover',
        icon: '🖼️',
        desc: 'AI repair · Smart fill · Blur · Crop',
      },
      compress: {
        label: 'Image Compressor',
        icon: '📉',
        desc: 'Compress JPG/PNG/WebP · Tune quality · Convert format',
      },
    },
    common: {
      uploadTitle: 'Drag an image here, or click to upload',
      imageOnly: 'Please choose an image file',
      reset: 'Upload another image',
      download: 'Download result',
      processing: 'Processing...',
      formatSupportBasic: 'Supports JPEG · PNG · WebP · BMP · GIF',
      formatSupportCompress: 'Supports JPEG · PNG · WebP · BMP · GIF · SVG',
    },
    watermark: {
      aiOnline: 'AI ready',
      aiOffline: 'Offline mode',
      aiOnlineTitle: 'AI repair service is connected',
      aiOfflineTitle: 'AI repair service is not connected; local mode will be used',
      remove: 'Remove watermark',
      downloadResult: 'Download processed image',
      selectHint: 'Drag on the image to select the watermark area',
      selectedHint: 'Watermark area selected. Click “Remove watermark” to process it',
      done: 'Watermark removed. Download the result when ready',
      aiLoadingTitle: 'AI model is repairing...',
      aiLoadingHint: 'The LaMa model analyzes the image and fills the selected area',
      methodLabel: 'Removal method',
      methods: [
        { id: 'ai', label: '🤖 AI repair', desc: 'LaMa deep-learning restoration' },
        { id: 'smart', label: 'Smart fill', desc: 'Local edge-based fill' },
        { id: 'blur', label: 'Blur', desc: 'Blur the watermark area' },
        { id: 'crop', label: 'Crop', desc: 'Crop away the selected area' },
      ],
      paddingLabel: 'Edge padding: {value}px (expand the repair area for better quality)',
      blurLabel: 'Blur strength: {value}px',
      aiRemove: '🚀 Remove with AI',
      clearSelection: 'Select again',
      aiFailed:
        'AI processing failed: {message}. Falling back to smart fill.',
      tipsTitle: 'Tips',
      tips: [
        {
          icon: '🤖',
          title: 'AI repair recommended',
          text: 'Best for complex backgrounds and larger watermarks where texture reconstruction matters.',
        },
        {
          icon: '🎯',
          title: 'Select precisely',
          text: 'Leave a small margin around the watermark and tune edge padding for a cleaner repair.',
        },
        {
          icon: '🧩',
          title: 'Smart fill',
          text: 'A local fallback that works well on plain or simple backgrounds.',
        },
        {
          icon: '✂️',
          title: 'Blur / crop',
          text: 'Good for quick fixes on corner watermarks, timestamps or unimportant areas.',
        },
      ],
    },
    compressor: {
      loadFailed: 'Image failed to load. Please try again',
      original: 'Original',
      compressed: 'Compressed',
      previewAlt: 'Compressed preview',
      qualityLabel: 'Compression quality',
      formatLabel: 'Output format',
      pngHint: 'PNG is lossless, so the quality slider does not apply.',
      dimensionLabel: 'Maximum dimensions (optional, 0 means unlimited)',
      widthPlaceholder: 'Width (px)',
      heightPlaceholder: 'Height (px)',
      download: 'Download compressed image ({size})',
      presets: [
        { label: 'Max compression', quality: 0.3, desc: 'Smallest size' },
        { label: 'Recommended', quality: 0.8, desc: 'Balanced quality and size' },
        { label: 'High quality', quality: 1, desc: 'Best quality' },
      ],
      formats: {
        jpeg: 'JPEG (universal, small size)',
        webp: 'WebP (best compression, recommended)',
        png: 'PNG (lossless, transparent)',
      },
    },
  },
}

function getInitialLanguage() {
  const url = new URL(window.location.href)
  const fromUrl = url.searchParams.get('lang')
  if (fromUrl === 'zh' || fromUrl === 'en') return fromUrl

  const saved = window.localStorage.getItem('image-tools-language')
  if (saved === 'zh' || saved === 'en') return saved

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  const hasChineseLanguage = languages.some((lang) => lang?.toLowerCase().startsWith('zh'))
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return hasChineseLanguage || timeZone === 'Asia/Shanghai' ? 'zh' : 'en'
}

export function createI18n() {
  const language = ref(getInitialLanguage())
  const locale = computed(() => messages[language.value])

  function setLanguage(nextLanguage) {
    if (!messages[nextLanguage]) return
    language.value = nextLanguage
    window.localStorage.setItem('image-tools-language', nextLanguage)
  }

  function t(path, params = {}) {
    const value = path.split('.').reduce((current, key) => current?.[key], locale.value)
    if (typeof value !== 'string') return value ?? path
    return Object.entries(params).reduce(
      (text, [key, replacement]) => text.replaceAll(`{${key}}`, replacement),
      value,
    )
  }

  return { language, locale, setLanguage, t }
}
