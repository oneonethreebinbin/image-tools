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
  {
    route: '/toolbox',
    ...t('home.tools.toolbox'),
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
      <div class="hero-bg">
        <div class="hero-orb hero-orb-1"></div>
        <div class="hero-orb hero-orb-2"></div>
        <div class="hero-orb hero-orb-3"></div>
        <div class="hero-grid"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-badge">{{ t('home.heroSubtitle') }}</div>
        <h1 class="hero-title">{{ t('home.heroTitle') }}</h1>
        <p class="hero-desc">{{ t('home.heroDesc') }}</p>
        <div class="hero-actions">
          <router-link to="/image-watermark-remover" class="btn btn-primary btn-lg">
            <span>🚀</span> {{ t('home.tryNow') }}
          </router-link>
        </div>
      </div>
    </section>

    <!-- 工具卡片 -->
    <section class="tools-section">
      <div class="container">
        <h2 class="section-title">{{ t('home.toolsTitle') }}</h2>
        <div class="tools-grid">
          <router-link v-for="tool in tools" :key="tool.route" :to="tool.route" class="tool-card">
            <div class="tool-card-icon-wrap">
              <span class="tool-icon">{{ tool.icon }}</span>
            </div>
            <h3 class="tool-name">{{ tool.label }}</h3>
            <p class="tool-desc">{{ tool.desc }}</p>
            <span class="tool-cta">{{ t('home.tryNow') }} <span class="tool-cta-arrow">→</span></span>
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
            <div class="feature-icon-wrap">
              <span class="feature-icon">{{ feat.icon }}</span>
            </div>
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
          <span class="privacy-icon">🛡️</span>
          <h3 class="privacy-title">{{ t('home.privacyTitle') }}</h3>
          <p class="privacy-text">{{ t('home.privacyText') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ===== Hero ===== */
.hero {
  position: relative;
  padding: 80px 0 64px;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(180deg, #f0f2ff 0%, var(--bg) 100%);
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.hero-orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(99, 102, 241, 0.15);
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.hero-orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(139, 92, 246, 0.12);
  bottom: -80px;
  left: -60px;
  animation-delay: -7s;
}

.hero-orb-3 {
  width: 200px;
  height: 200px;
  background: rgba(59, 130, 246, 0.1);
  top: 30%;
  left: 50%;
  animation-delay: -14s;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-30px) scale(1.05);
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(79, 70, 229, 0.15);
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 20px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 16px;
  line-height: 1.2;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--text) 0%, #4338ca 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 560px;
  margin: 0 auto 28px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 1rem;
  border-radius: var(--radius);
}

/* ===== Section Title ===== */
.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 36px;
  text-align: center;
  letter-spacing: -0.025em;
}

.section-title::after {
  content: "";
  display: block;
  width: 48px;
  height: 3px;
  background: var(--gradient-primary);
  border-radius: 2px;
  margin: 12px auto 0;
}

/* ===== 工具卡片网格 ===== */
.tools-section {
  padding: 48px 0 56px;
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
  padding: 36px 24px 28px;
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1.5px solid var(--border);
  text-decoration: none;
  color: var(--text);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

.tool-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.tool-card:hover {
  border-color: rgba(79, 70, 229, 0.3);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-4px);
}

.tool-card:hover::before {
  transform: scaleX(1);
}

.tool-card-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--gradient-mesh);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  transition: all 0.3s ease;
}

.tool-card:hover .tool-card-icon-wrap {
  background: var(--primary-light);
  transform: scale(1.05);
}

.tool-icon {
  font-size: 2rem;
}

.tool-name {
  font-size: 1.0625rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.tool-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 18px;
  flex: 1;
}

.tool-cta {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.2s ease;
}

.tool-card:hover .tool-cta {
  gap: 8px;
}

.tool-cta-arrow {
  transition: transform 0.2s ease;
}

.tool-card:hover .tool-cta-arrow {
  transform: translateX(2px);
}

/* ===== 特色 ===== */
.features-section {
  padding: 56px 0;
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
  padding: 28px 20px;
  border-radius: var(--radius);
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(79, 70, 229, 0.02);
}

.feature-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon-wrap {
  background: var(--gradient-primary);
  transform: scale(1.08) rotate(-3deg);
}

.feature-icon {
  font-size: 1.5rem;
  transition: filter 0.3s ease;
}

.feature-card:hover .feature-icon {
  filter: brightness(1.2);
}

.feature-title {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}

.feature-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===== FAQ ===== */
.faq-section {
  padding: 56px 0;
}

.faq-list {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faq-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item[open] {
  border-color: rgba(79, 70, 229, 0.2);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.06);
}

.faq-q {
  padding: 18px 22px;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text);
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: color 0.2s ease;
}

.faq-q:hover {
  color: var(--primary);
}

.faq-q::after {
  content: "+";
  font-size: 1.25rem;
  color: var(--text-muted);
  font-weight: 400;
  transition: all 0.3s ease;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--bg);
  flex-shrink: 0;
}

.faq-item[open] .faq-q::after {
  content: "−";
  background: var(--primary-light);
  color: var(--primary);
}

.faq-a {
  padding: 0 22px 18px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ===== 隐私 ===== */
.privacy-section {
  padding: 32px 0 56px;
}

.privacy-card {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  border-radius: var(--radius);
  padding: 28px 28px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.privacy-card::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 50%;
  filter: blur(40px);
}

.privacy-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 10px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.privacy-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 8px;
}

.privacy-text {
  font-size: 0.8125rem;
  color: #a16207;
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .hero {
    padding: 56px 0 40px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-desc {
    font-size: 1rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .btn-lg {
    padding: 12px 24px;
    font-size: 0.9375rem;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 40px 0 32px;
  }

  .hero-title {
    font-size: 1.625rem;
  }

  .hero-badge {
    font-size: 0.75rem;
    padding: 4px 12px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .tool-card {
    padding: 28px 16px 24px;
  }

  .tool-card-icon-wrap {
    width: 52px;
    height: 52px;
  }
}
</style>