export function loadAdSense() {
  const client = import.meta.env.VITE_ADSENSE_CLIENT
  if (
    !client ||
    document.querySelector('script[data-adsense-loader]') ||
    document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')
  ) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.dataset.adsenseLoader = 'true'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`
  document.head.appendChild(script)
}
