<script setup>
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { I18N_KEY } from '../i18n'
import AdSenseSlot from '../components/AdSenseSlot.vue'

const { t } = inject(I18N_KEY)
const route = useRoute()

const pageMeta = computed(() => {
  const map = {
    '/image-watermark-remover': t('tabs.watermark'),
    '/image-compressor': t('tabs.compress'),
    '/video-link-extractor': t('tabs.video'),
    '/markdown-word-converter': t('tabs.markdown'),
  }
  return map[route.path] || { icon: '', label: '', desc: '' }
})

const showSidebar = computed(() => route.path !== '/markdown-word-converter')

const features = computed(() => t('site.features'))

const adSlots = {
  sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || '',
  inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE || '',
}
</script>

<template>
  <div class="tool-page">
    <div class="container">
      <section class="page-hero">
        <h1 class="page-title">{{ pageMeta.icon }} {{ pageMeta.label }}</h1>
        <p class="page-desc">{{ pageMeta.desc }}</p>
      </section>

      <div class="main-layout">
        <div class="tool-area">
          <router-view />
        </div>

        <aside v-if="showSidebar" class="sidebar">
          <AdSenseSlot class-name="ad-sidebar" :label="t('site.adSidebar')" :slot="adSlots.sidebar" />
          <div class="card feature-card">
            <h2 class="feature-card-title">{{ t('site.whyChoose') }}</h2>
            <ul class="feature-list">
              <li v-for="feature in features" :key="feature.title">
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

      <AdSenseSlot class-name="ad-inline" :label="t('site.adInline')" :slot="adSlots.inline" />
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  padding-bottom: 48px;
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
  padding: 0;
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

@media (max-width: 860px) {
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

@media (max-width: 768px) {
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

  .tool-page {
    padding-bottom: 32px;
  }
}

@media (max-width: 480px) {
  .page-hero {
    padding: 16px 0 12px;
  }

  .page-title {
    font-size: 1.375rem;
  }
}
</style>
