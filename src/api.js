/**
 * 视频解析 API
 * @param {{ url: string }} data
 * @returns {Promise<{ code: number, msg: string, data: object }>}
 */
export async function extractVideoApi(data) {
  const res = await fetch('/api/video/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

/**
 * 后端健康检查
 */
export async function healthCheckApi() {
  try {
    const res = await fetch('/api/health')
    return res.ok
  } catch {
    return false
  }
}

/**
 * 将代理播放URL转换为强制下载URL
 * /api/video/proxy?url=...&platform=... → /api/video/download?url=...&platform=...&filename=...
 */
export function getDownloadUrl(proxyUrl, filename) {
  if (!proxyUrl) return ''
  // 从 proxy URL 中提取参数
  const url = new URL(proxyUrl, window.location.origin)
  const videoUrl = url.searchParams.get('url')
  const platform = url.searchParams.get('platform') || ''
  const base = '/api/video/download'
  const params = new URLSearchParams()
  params.set('url', videoUrl)
  params.set('platform', platform)
  params.set('filename', filename || `video_${Date.now()}.mp4`)
  return `${base}?${params.toString()}`
}
