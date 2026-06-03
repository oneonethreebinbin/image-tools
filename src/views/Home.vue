<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { I18N_KEY } from '../i18n'
import AdSenseSlot from '../components/AdSenseSlot.vue'

const { t } = inject(I18N_KEY)
const router = useRouter()

const adSlots = {
  banner: import.meta.env.VITE_ADSENSE_SLOT_BANNER || '',
  inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE || '',
}

const tools = computed(() => [
  {
    route: '/image-watermark-remover',
    ...t('home.tools.watermark'),
  },
  {
    route: '/image-compressor',
    ...t('home.tools.compress'),
  },
  {
    route: '/video-link-extractor',
    ...t('home.tools.video'),
  },
  {
    route: '/markdown-word-converter',
    ...t('home.tools.markdown'),
  },
])

const features = computed(() => t('home.features'))
const faqs = computed(() => t('home.faq'))
</script>

<template>
  <div class="home">
    <!-- 顶部广告 -->
    <div class="container">
      <AdSenseSlot class-name="ad-banner" :label="t('site.adBanner')" :slot="adSlots.banner" />
    </div>

    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">{{ t('home.heroTitle') }}</h1>
        <p class="hero-subtitle">{{ t('home.heroSubtitle') }}</p>
        <p class="hero-desc">{{ t('home.heroDesc') }}</p>
      </div>
    </section>

    <!-- 工具卡片 -->
    <section class="tools-section">
      <div class="container">
        <h2 class="section-title">{{ t('home.toolsTitle') }}</h2>
        <div class="tools-grid">
          <router-link v-for="tool in tools" :key="tool.route" :to="tool.route" class="tool-card">
            <span class="tool-icon">{{ tool.icon }}</span>
            <h3 class="tool-name">{{ tool.label }}</h3>
            <p class="tool-desc">{{ tool.desc }}</p>
            <span class="tool-cta">{{ t('home.tryNow') }} →</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 内容广告 -->
    <div class="container">
      <AdSenseSlot class-name="ad-inline" :label="t('site.adInline')" :slot="adSlots.inline" />
    </div>

    <!-- 特色 -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">{{ t('home.featuresTitle') }}</h2>
        <div class="features-grid">
          <div v-for="feat in features" :key="feat.title" class="feature-card">
            <span class="feature-icon">{{ feat.icon }}</span>
            <h3 class="feature-title">{{ feat.title }}</h3>
            <p class="feature-desc">{{ feat.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq-section">
      <div class="container">
        <h2 class="section-title">{{ t('home.faqTitle') }}</h2>
        <div class="faq-list">
          <details v-for="faq in faqs" :key="faq.q" class="faq-item">
            <summary class="faq-q">{{ faq.q }}</summary>
            <p class="faq-a">{{ faq.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- 隐私说明 -->
    <section class="privacy-section">
      <div class="container">
        <div class="privacy-card">
          <h3 class="privacy-title">{{ t('home.privacyTitle') }}</h3>
          <p class="privacy-text">{{ t('home.privacyText') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: 64px 0 48px;
  text-align: center;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 12px;
  line-height: 1.3;
}

.hero-subtitle {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 8px;
}

.hero-desc {
  font-size: 1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 24px;
  text-align: center;
}

/* 工具卡片网格 */
.tools-section {
  padding: 32px 0 48px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px 24px;
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1.5px solid var(--border);
  text-decoration: none;
  color: var(--text);
  transition: all 0.2s ease;
  box-shadow: var(--shadow);
}

.tool-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.tool-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.tool-name {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.tool-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
  flex: 1;
}

.tool-cta {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
}

/* 特色 */
.features-section {
  padding: 48px 0;
  background: white;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.feature-card {
  text-align: center;
  padding: 24px 16px;
}

.feature-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text);
}

.feature-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* FAQ */
.faq-section {
  padding: 48px 0;
}

.faq-list {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.faq-q {
  padding: 16px 20px;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text);
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-q::after {
  content: '+';
  font-size: 1.25rem;
  color: var(--text-muted);
  font-weight: 400;
  transition: transform 0.2s ease;
}

.faq-item[open] .faq-q::after {
  content: '−';
}

.faq-a {
  padding: 0 20px 16px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* 隐私 */
.privacy-section {
  padding: 32px 0 48px;
}

.privacy-card {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius);
  padding: 20px 24px;
  text-align: center;
}

.privacy-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #92400E;
  margin-bottom: 8px;
}

.privacy-text {
  font-size: 0.8125rem;
  color: #92400E;
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .hero {
    padding: 40px 0 32px;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-desc {
    font-size: 0.9375rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 32px 0 24px;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .tool-card {
    padding: 24px 16px 20px;
  }
}
</style>
