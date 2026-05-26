<script setup>
import { computed, provide, ref, watchEffect } from 'vue'
import WatermarkRemover from './components/WatermarkRemover.vue'
import ImageCompressor from './components/ImageCompressor.vue'
import { I18N_KEY, createI18n } from './i18n'

const i18n = createI18n()
provide(I18N_KEY, i18n)

const activeTab = refFromHash()

const tabs = computed(() => [
  { id: 'watermark', ...i18n.t('tabs.watermark') },
  { id: 'compress', ...i18n.t('tabs.compress') },
])

const currentTab = computed(() => tabs.value.find((tab) => tab.id === activeTab.value) ?? tabs.value[0])
const currentTitle = computed(() =>
  activeTab.value === 'compress' ? i18n.t('site.titleCompress') : i18n.t('site.titleWatermark'),
)
const currentDescription = computed(() =>
  activeTab.value === 'compress'
    ? i18n.t('site.descriptionCompress')
    : i18n.t('site.descriptionWatermark'),
)

function refFromHash() {
  const initial = window.location.hash === '#compress' ? 'compress' : 'watermark'
  const value = ref(initial)

  window.addEventListener('hashchange', () => {
    value.value = window.location.hash === '#compress' ? 'compress' : 'watermark'
  })

  return value
}

function setActiveTab(tabId) {
  activeTab.value = tabId
  const nextHash = tabId === 'compress' ? '#compress' : '#watermark'
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash)
  }
}

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setPropertyMeta(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

watchEffect(() => {
  const lang = i18n.language.value
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  document.title = currentTitle.value
  setMeta('description', currentDescription.value)
  setMeta('keywords', i18n.t('site.keywords'))
  setPropertyMeta('og:title', currentTitle.value)
  setPropertyMeta('og:description', currentDescription.value)
  setPropertyMeta('og:locale', lang === 'zh' ? 'zh_CN' : 'en_US')
  setPropertyMeta('og:site_name', i18n.t('site.name'))
  setPropertyMeta('twitter:title', currentTitle.value)
  setPropertyMeta('twitter:description', currentDescription.value)
})
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container header-inner">
        <a href="#watermark" class="logo" @click.prevent="setActiveTab('watermark')">
          <span class="logo-icon">🖼️</span>
          <span class="logo-text">{{ i18n.t('site.name') }}</span>
        </a>

        <nav class="nav" :aria-label="i18n.t('site.tagline')">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: activeTab === tab.id }"
            type="button"
            @click="setActiveTab(tab.id)"
          >
            <span class="nav-tab-icon">{{ tab.icon }}</span>
            <span class="nav-tab-label">{{ tab.label }}</span>
          </button>
        </nav>

        <div class="language-switcher" :aria-label="i18n.t('site.language')">
          <button
            type="button"
            class="language-btn"
            :class="{ active: i18n.language.value === 'zh' }"
            @click="i18n.setLanguage('zh')"
          >
            {{ i18n.t('site.chinese') }}
          </button>
          <button
            type="button"
            class="language-btn"
            :class="{ active: i18n.language.value === 'en' }"
            @click="i18n.setLanguage('en')"
          >
            {{ i18n.t('site.english') }}
          </button>
        </div>
      </div>
    </header>

    <div class="container">
      <div class="ad-slot ad-banner">{{ i18n.t('site.adBanner') }}</div>
    </div>

    <main class="main">
      <div class="container">
        <section class="page-hero">
          <h1 class="page-title">{{ currentTab.icon }} {{ currentTab.label }}</h1>
          <p class="page-desc">{{ currentTab.desc }}</p>
        </section>

        <div class="main-layout">
          <div class="tool-area">
            <WatermarkRemover v-if="activeTab === 'watermark'" />
            <ImageCompressor v-if="activeTab === 'compress'" />
          </div>

          <aside class="sidebar">
            <div class="ad-slot ad-sidebar">{{ i18n.t('site.adSidebar') }}</div>
            <div class="card feature-card">
              <h2 class="feature-card-title">{{ i18n.t('site.whyChoose') }}</h2>
              <ul class="feature-list">
                <li v-for="feature in i18n.t('site.features')" :key="feature.title">
                  <span class="feature-icon">{{ feature.icon }}</span>
                  <div>
                    <strong>{{ feature.title }}</strong>
                    <p>{{ feature.text }}</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div class="ad-slot ad-inline">{{ i18n.t('site.adInline') }}</div>
      </div>
    </main>

    <footer class="footer">
      <div class="container footer-inner">
        <p class="footer-copy">{{ i18n.t('site.copyright') }}</p>
        <p class="footer-note">{{ i18n.t('site.privacyNote') }}</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.header {
  background: white;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  flex-shrink: 0;
}

.logo-icon {
  font-size: 1.75rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
}

.nav {
  display: flex;
  gap: 4px;
  background: var(--bg);
  padding: 4px;
  border-radius: var(--radius);
}

.nav-tab,
.language-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: calc(var(--radius) - 4px);
  font-size: 0.875rem;
  font-weight: 600;
  background: transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.nav-tab {
  gap: 6px;
  padding: 8px 16px;
  color: var(--text-secondary);
}

.nav-tab:hover,
.language-btn:hover {
  color: var(--text);
  background: white;
}

.nav-tab.active,
.language-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow);
}

.nav-tab-icon {
  font-size: 1.125rem;
}

.language-switcher {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius);
  background: var(--bg);
  flex-shrink: 0;
}

.language-btn {
  padding: 6px 10px;
  color: var(--text-secondary);
  min-height: 32px;
}

.page-hero {
  text-align: center;
  padding: 40px 0 32px;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
}

.page-desc {
  font-size: 1rem;
  color: var(--text-secondary);
}

.main {
  padding-bottom: 48px;
}

.main-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.tool-area {
  flex: 1;
  min-width: 0;
}

.sidebar {
  flex-shrink: 0;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-card {
  padding: 20px;
}

.feature-card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text);
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.feature-icon {
  font-size: 1.25rem;
  line-height: 1.4;
  flex-shrink: 0;
}

.feature-list strong {
  font-size: 0.8125rem;
  color: var(--text);
  display: block;
}

.feature-list p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.footer {
  background: white;
  border-top: 1px solid var(--border);
  padding: 24px 0;
}

.footer-inner {
  text-align: center;
}

.footer-copy {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.footer-note {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}

@media (max-width: 860px) {
  .header-inner {
    flex-wrap: wrap;
    padding: 10px 12px;
  }

  .nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .logo-text {
    font-size: 1rem;
  }

  .nav-tab {
    padding: 6px 12px;
    font-size: 0.8125rem;
  }

  .nav-tab-icon {
    font-size: 1.25rem;
  }

  .language-btn {
    padding: 5px 8px;
    font-size: 0.8125rem;
  }

  .page-hero {
    padding: 20px 0 16px;
    text-align: left;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-desc {
    font-size: 0.9375rem;
  }

  .main-layout {
    flex-direction: column;
    gap: 16px;
  }

  .sidebar {
    width: 100%;
    order: -1;
  }

  .tool-area {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-inner {
    gap: 8px;
  }

  .logo-icon {
    font-size: 1.5rem;
  }

  .logo-text {
    font-size: 0.9375rem;
  }

  .nav-tab-label {
    display: none;
  }

  .nav-tab {
    padding: 6px 18px;
  }

  .page-hero {
    padding: 16px 0 12px;
  }

  .page-title {
    font-size: 1.375rem;
  }

  .main {
    padding-bottom: 32px;
  }

  .footer {
    padding: 20px 0;
  }

  .footer-copy,
  .footer-note {
    font-size: 0.75rem;
    line-height: 1.5;
  }
}
</style>
