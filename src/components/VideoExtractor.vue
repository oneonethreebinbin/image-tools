<script setup>
import { inject, ref } from 'vue'
import { I18N_KEY } from '../i18n'
import { extractVideoApi, healthCheckApi, getDownloadUrl } from '../api'
import AdSenseSlot from './AdSenseSlot.vue'

const { t } = inject(I18N_KEY)

const inputUrl = ref('')
const extracting = ref(false)
const result = ref(null)
const error = ref('')
const hasSearched = ref(false)
const backendOnline = ref(false)

const toolAdSlot = import.meta.env.VITE_ADSENSE_SLOT_TOOL || import.meta.env.VITE_ADSENSE_SLOT_INLINE || ''

// 启动时检查后端
healthCheckApi().then((ok) => {
  backendOnline.value = ok
})

async function handleExtract() {
  const url = inputUrl.value.trim()
  if (!url) {
    error.value = t('extractor.emptyInput')
    return
  }

  extracting.value = true
  result.value = null
  error.value = ''
  hasSearched.value = true

  try {
    const res = await extractVideoApi({ url })
    if (res.code === 200) {
      result.value = res.data
    } else {
      error.value = res.msg || t('extractor.failed')
    }
  } catch {
    error.value = t('extractor.networkError')
  } finally {
    extracting.value = false
  }
}

function copyUrl(url) {
  navigator.clipboard.writeText(url).catch(() => {
    const textarea = document.createElement('textarea')
    textarea.value = url
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  })
}

function downloadVideo() {
  if (!result.value?.videoUrl) return
  const filename = (result.value.title || 'video').replace(/[\\/:*?"<>|]/g, '_') + '.mp4'
  const downloadUrl = getDownloadUrl(result.value.videoUrl, filename)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function copyDownloadLink() {
  if (!result.value?.videoUrl) return
  const filename = (result.value.title || 'video').replace(/[\\/:*?"<>|]/g, '_') + '.mp4'
  const downloadUrl = getDownloadUrl(result.value.videoUrl, filename)
  // 构建完整URL
  const fullUrl = new URL(downloadUrl, window.location.origin).href
  copyUrl(fullUrl)
}

function onKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleExtract()
  }
}
</script>

<template>
  <div class="extractor">
    <!-- 输入区域 -->
    <div class="card" style="padding: 24px;">
      <div class="input-area">
        <div class="backend-status">
          <span
            class="status-dot"
            :class="backendOnline ? 'online' : 'offline'"
          ></span>
          {{ backendOnline ? t('extractor.backendOnline') : t('extractor.backendOffline') }}
        </div>

        <label class="input-label">{{ t('extractor.inputLabel') }}</label>
        <textarea
          v-model="inputUrl"
          class="url-input"
          :placeholder="t('extractor.placeholder')"
          rows="3"
          :disabled="extracting"
          @keydown="onKeydown"
        ></textarea>
        <p class="input-hint">{{ t('extractor.hint') }}</p>

        <button
          class="btn btn-primary"
          style="width:100%; margin-top: 16px; padding: 14px 32px; font-size: 1rem;"
          :disabled="!inputUrl.trim() || extracting"
          @click="handleExtract"
        >
          <span v-if="extracting" class="btn-spinner"></span>
          {{ extracting ? t('extractor.parsing') : t('extractor.parse') }}
        </button>
      </div>
    </div>

    <!-- 错误 -->
    <div v-if="error" class="alert alert-error" style="margin-top: 16px;">
      {{ error }}
    </div>

    <!-- 解析结果 -->
    <div v-if="result" class="card" style="margin-top: 16px; padding: 24px;">
      <div class="result-header">
        <h3 style="color: var(--text);">{{ t('extractor.resultTitle') }}</h3>
        <span v-if="result.platformLabel" class="platform-badge">{{ result.platformLabel }}</span>
      </div>

      <!-- 视频播放器 -->
      <div v-if="result.videoUrl" class="video-wrapper">
        <video
          :src="result.videoUrl"
          controls
          playsinline
          preload="metadata"
          class="video-player"
        >
          {{ t('extractor.videoNotSupported') }}
        </video>
        <div class="video-actions">
          <button class="btn btn-primary" @click="downloadVideo">
            ↓ {{ t('extractor.downloadVideo') }}
          </button>
          <button class="btn btn-secondary" @click="copyDownloadLink">
            {{ t('extractor.copyDownloadLink') }}
          </button>
        </div>
      </div>

      <!-- 无法直接提取时的兜底 -->
      <div v-if="result.needIframe" class="alert alert-warning" style="margin-bottom: 16px;">
        {{ result.note || t('extractor.partialNote') }}
      </div>
      <div v-if="result.needIframe && result.pageUrl" style="margin-bottom: 16px;">
        <a
          :href="result.pageUrl"
          target="_blank"
          rel="noopener"
          class="page-link"
        >
          {{ t('extractor.openPage') }}
        </a>
      </div>

      <!-- 视频信息 -->
      <div v-if="result.title || result.authorName" class="video-info">
        <div v-if="result.title" class="info-row">
          <span class="info-label">{{ t('extractor.title') }}</span>
          <span class="info-value">{{ result.title }}</span>
        </div>
        <div v-if="result.authorName" class="info-row">
          <span class="info-label">{{ t('extractor.author') }}</span>
          <span class="info-value">{{ result.authorName }}</span>
        </div>
        <div v-if="result.platformLabel" class="info-row">
          <span class="info-label">{{ t('extractor.platformLabel') }}</span>
          <span class="info-value">{{ result.platformLabel }}</span>
        </div>
        <div v-if="result.originShareUrl" class="info-row">
          <span class="info-label">{{ t('extractor.originLink') }}</span>
          <span class="info-value info-link">{{ result.originShareUrl }}</span>
        </div>
        <div v-if="result.videoUrl" class="info-row">
          <span class="info-label">{{ t('extractor.videoUrl') }}</span>
          <div class="url-copy-row">
            <span class="info-value info-link">{{ result.videoUrl }}</span>
            <button
              class="btn btn-secondary btn-sm"
              @click="copyUrl(result.videoUrl)"
            >
              {{ t('extractor.copy') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 合规说明 -->
    <div v-if="result" class="card compliance-card" style="margin-top: 16px; padding: 16px 20px;">
      <p class="compliance-text">{{ t('extractor.compliance') }}</p>
    </div>

    <!-- FAQ -->
    <div v-if="hasSearched && !result && !extracting" class="card" style="margin-top: 16px; padding: 24px;">
      <p style="text-align:center; color: var(--text-muted);">{{ t('extractor.emptyHint') }}</p>
    </div>

    <AdSenseSlot
      v-if="result"
      class-name="ad-inline"
      :label="t('site.toolAd')"
      :slot="toolAdSlot"
    />

    <!-- 使用提示 -->
    <div v-if="!result" class="card tips-card" style="margin-top: 16px;">
      <h2 class="tips-title">{{ t('extractor.tipsTitle') }}</h2>
      <div class="tips-grid">
        <div v-for="tip in t('extractor.tips')" :key="tip.title" class="tip-item">
          <span class="tip-icon">{{ tip.icon }}</span>
          <div>
            <strong>{{ tip.title }}</strong>
            <p>{{ tip.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  display: flex;
  flex-direction: column;
}

.backend-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.online {
  background: #10B981;
}

.status-dot.offline {
  background: #F59E0B;
}

.input-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.url-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--text);
  background: white;
  outline: none;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.15s ease;
}

.url-input:focus {
  border-color: var(--border-focus);
}

.url-input:disabled {
  background: #FAFAFA;
  color: var(--text-muted);
}

.input-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.video-wrapper {
  background: #000;
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 16px;
}

.video-player {
  width: 100%;
  display: block;
  max-height: 480px;
  background: #000;
}

.video-actions {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: #1A1A1A;
  gap: 12px;
}

.alert-warning {
  background: #FFFBEB;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.page-link {
  display: inline-flex;
  align-items: center;
  color: var(--primary);
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
  padding: 10px 20px;
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.page-link:hover {
  background: var(--primary-light);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 0.9375rem;
  color: var(--text);
  word-break: break-all;
}

.info-link {
  font-size: 0.8125rem !important;
  color: var(--text-secondary) !important;
}

.url-copy-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.url-copy-row .info-value {
  flex: 1;
  min-width: 0;
}

.compliance-card {
  border-left: 3px solid #F59E0B;
}

.compliance-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.tips-card {
  padding: 24px;
}

.tips-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.tip-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1.4;
}

.tip-item strong {
  font-size: 0.8125rem;
  color: var(--text);
  display: block;
}

.tip-item p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

@media (max-width: 768px) {
  .tips-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .video-player {
    max-height: 300px;
  }

  .video-actions {
    padding: 8px;
  }

  .video-actions .btn {
    width: 100%;
    min-height: 44px;
  }

  .url-copy-row {
    flex-direction: column;
  }

  .url-copy-row .btn {
    width: 100%;
  }
}
</style>
