<script setup>
import { computed, inject, onMounted, provide, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { I18N_KEY, createI18n } from './i18n'
import { loadAdSense } from './adsense'

const i18n = createI18n()
provide(I18N_KEY, i18n)

const route = useRoute()
const router = useRouter()

const navLinks = computed(() => [
  { path: '/image-watermark-remover', ...i18n.t('tabs.watermark') },
  { path: '/image-compressor', ...i18n.t('tabs.compress') },
  { path: '/video-link-extractor', ...i18n.t('tabs.video') },
])

function isActive(path) {
  return route.path === path
}

watchEffect(() => {
  const lang = i18n.language.value
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
})

onMounted(loadAdSense)
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <span class="logo-icon">🖼️</span>
          <span class="logo-text">{{ i18n.t('site.name') }}</span>
        </router-link>

        <nav class="nav" :aria-label="i18n.t('site.tagline')">
          <router-link
            v-for="link in navLinks"
            :key="link.id"
            :to="link.path"
            class="nav-tab"
            :class="{ active: isActive(link.path) }"
          >
            <span class="nav-tab-icon">{{ link.icon }}</span>
            <span class="nav-tab-label">{{ link.label }}</span>
          </router-link>
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

    <main class="main">
      <router-view />
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
  text-decoration: none;
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
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.main {
  min-height: calc(100vh - 64px - 80px);
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
