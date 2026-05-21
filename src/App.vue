<script setup>
import { ref, computed } from 'vue'
import WatermarkRemover from './components/WatermarkRemover.vue'
import ImageCompressor from './components/ImageCompressor.vue'

const tabs = [
  { id: 'watermark', label: '图片去水印', icon: '🖌️', desc: '智能填充 · 模糊 · 裁剪' },
  { id: 'compress', label: '图片压缩', icon: '📦', desc: '无损压缩 · 格式转换' }
]

const activeTab = ref('watermark')

const currentTab = computed(() => tabs.find(t => t.id === activeTab.value))
</script>

<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="container header-inner">
        <a href="/" class="logo">
          <span class="logo-icon">🖼️</span>
          <span class="logo-text">图片工具箱</span>
        </a>
        <nav class="nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="nav-tab-icon">{{ tab.icon }}</span>
            <span class="nav-tab-label">{{ tab.label }}</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Ad Banner Top -->
    <div class="container">
      <div class="ad-slot ad-banner">Google AdSense · 横幅广告位 (728×90)</div>
    </div>

    <!-- Main Content -->
    <main class="main">
      <div class="container">
        <!-- Page Title -->
        <section class="page-hero">
          <h1 class="page-title">{{ currentTab.icon }} {{ currentTab.label }}</h1>
          <p class="page-desc">{{ currentTab.desc }}</p>
        </section>

        <div class="main-layout">
          <!-- Tool Area -->
          <div class="tool-area">
            <WatermarkRemover v-if="activeTab === 'watermark'" />
            <ImageCompressor v-if="activeTab === 'compress'" />
          </div>

          <!-- Ad Sidebar (Desktop) -->
          <aside class="sidebar">
            <div class="ad-slot ad-sidebar">Google AdSense · 侧边栏广告 (300×250)</div>
            <div class="card feature-card">
              <h3 class="feature-card-title">为什么选择我们？</h3>
              <ul class="feature-list">
                <li>
                  <span class="feature-icon">🔒</span>
                  <div>
                    <strong>隐私安全</strong>
                    <p>所有处理在浏览器本地完成，图片不会上传到任何服务器</p>
                  </div>
                </li>
                <li>
                  <span class="feature-icon">⚡</span>
                  <div>
                    <strong>极速处理</strong>
                    <p>无需等待上传下载，毫秒级完成处理</p>
                  </div>
                </li>
                <li>
                  <span class="feature-icon">🆓</span>
                  <div>
                    <strong>完全免费</strong>
                    <p>不限次数，不限大小，永久免费使用</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <!-- Ad Inline -->
        <div class="ad-slot ad-inline">Google AdSense · 内容广告位</div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <p class="footer-copy">&copy; 2026 图片工具箱 · 免费在线图片处理工具</p>
        <p class="footer-note">所有图片在您的浏览器中本地处理，不会上传到任何服务器。</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ========== Header ========== */
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
  height: 64px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
}
.logo-icon {
  font-size: 1.75rem;
}
.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.nav {
  display: flex;
  gap: 4px;
  background: var(--bg);
  padding: 4px;
  border-radius: var(--radius);
}
.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: calc(var(--radius) - 4px);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  transition: all 0.15s ease;
}
.nav-tab:hover {
  color: var(--text);
  background: white;
}
.nav-tab.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow);
  font-weight: 600;
}
.nav-tab-icon {
  font-size: 1.125rem;
}

/* ========== Page Hero ========== */
.page-hero {
  text-align: center;
  padding: 40px 0 32px;
}
.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.page-desc {
  font-size: 1rem;
  color: var(--text-secondary);
}

/* ========== Main Layout ========== */
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

/* ========== Feature Card ========== */
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

/* ========== Footer ========== */
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

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .header-inner {
    height: 56px;
    padding: 0 8px;
  }
  .logo-text {
    font-size: 1rem;
  }
  .nav-tab {
    padding: 6px 14px;
    font-size: 0.8125rem;
  }
  .nav-tab-label {
    display: none;
  }
  .nav-tab-icon {
    font-size: 1.25rem;
  }
  .nav {
    padding: 3px;
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
    height: 52px;
  }
  .logo-icon {
    font-size: 1.5rem;
  }
  .logo-text {
    font-size: 0.9375rem;
  }
  .nav-tab {
    padding: 5px 12px;
  }
  .nav-tab-icon {
    font-size: 1.125rem;
  }
  .page-hero {
    padding: 16px 0 12px;
  }
  .page-title {
    font-size: 1.375rem;
    letter-spacing: -0.02em;
  }
  .main {
    padding-bottom: 32px;
  }
  .feature-list li {
    gap: 12px;
  }
  .feature-list strong {
    font-size: 0.875rem;
  }
  .feature-list p {
    font-size: 0.8125rem;
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
