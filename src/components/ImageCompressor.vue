<script setup>
import { computed, inject, ref, watch } from 'vue'
import { I18N_KEY } from '../i18n'
import AdSenseSlot from './AdSenseSlot.vue'

const { t } = inject(I18N_KEY)

const originalImage = ref(null)
const originalSize = ref(0)
const originalDimensions = ref('')
const originalFormat = ref('')
const previewUrl = ref('')

const quality = ref(0.8)
const outputFormat = ref('jpeg')
const maxWidth = ref(0)
const maxHeight = ref(0)
const compressedBlob = ref(null)
const compressedSize = ref(0)
const compressedUrl = ref('')
const isProcessing = ref(false)
const error = ref('')
const isDragOver = ref(false)

const fileInput = ref(null)
const canvasRef = ref(null)
const originalCanvasRef = ref(null)

const presets = computed(() => t('compressor.presets'))
const toolAdSlot = import.meta.env.VITE_ADSENSE_SLOT_TOOL || import.meta.env.VITE_ADSENSE_SLOT_INLINE || ''

const compressionRatio = computed(() => {
  if (!originalSize.value || !compressedSize.value) return 0
  return Math.round((1 - compressedSize.value / originalSize.value) * 100)
})

const compressedFileName = computed(() => {
  if (!originalImage.value) return ''
  const name = originalImage.value.name.replace(/\.[^.]+$/, '')
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  return `${name}_compressed.${ext}`
})

watch([quality, outputFormat, maxWidth, maxHeight], () => {
  if (originalImage.value) compressImage()
})

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function handleFile(file) {
  error.value = ''
  if (!file || !file.type.startsWith('image/')) {
    error.value = t('common.imageOnly')
    return
  }

  originalImage.value = file
  originalSize.value = file.size
  originalFormat.value = file.type.split('/')[1].toUpperCase()

  const reader = new FileReader()
  reader.onload = (event) => {
    const img = new Image()
    img.onload = () => {
      originalDimensions.value = `${img.naturalWidth} x ${img.naturalHeight}`
      previewUrl.value = event.target.result
      drawOriginalPreview(img)
      compressImage()
    }
    img.src = event.target.result
  }
  reader.readAsDataURL(file)
}

function drawOriginalPreview(img) {
  if (!originalCanvasRef.value) return
  const canvas = originalCanvasRef.value
  const ctx = canvas.getContext('2d')
  const scale = Math.min(400 / img.naturalWidth, 300 / img.naturalHeight, 1)
  canvas.width = img.naturalWidth * scale
  canvas.height = img.naturalHeight * scale
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  if (file) handleFile(file)
}

function onDrop(event) {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onDragOver(event) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function triggerUpload() {
  fileInput.value?.click()
}

function compressImage() {
  if (!originalImage.value) return

  isProcessing.value = true
  error.value = ''

  const img = new Image()
  img.onload = () => {
    const canvas = canvasRef.value
    if (!canvas) return

    let width = img.naturalWidth
    let height = img.naturalHeight

    if (maxWidth.value > 0 && width > maxWidth.value) {
      height = Math.round(height * (maxWidth.value / width))
      width = maxWidth.value
    }

    if (maxHeight.value > 0 && height > maxHeight.value) {
      width = Math.round(width * (maxHeight.value / height))
      height = maxHeight.value
    }

    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)

    const mimeType =
      outputFormat.value === 'jpeg'
        ? 'image/jpeg'
        : outputFormat.value === 'webp'
          ? 'image/webp'
          : 'image/png'
    const outputQuality = outputFormat.value === 'png' ? undefined : quality.value

    canvas.toBlob(
      (blob) => {
        if (blob) {
          compressedBlob.value = blob
          compressedSize.value = blob.size
          if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
          compressedUrl.value = URL.createObjectURL(blob)
        }
        isProcessing.value = false
      },
      mimeType,
      outputQuality,
    )
  }

  img.onerror = () => {
    error.value = t('compressor.loadFailed')
    isProcessing.value = false
  }

  img.src = previewUrl.value
}

function download() {
  if (!compressedUrl.value) return
  const link = document.createElement('a')
  link.href = compressedUrl.value
  link.download = compressedFileName.value
  link.click()
}

function reset() {
  originalImage.value = null
  originalSize.value = 0
  originalDimensions.value = ''
  originalFormat.value = ''
  previewUrl.value = ''
  compressedBlob.value = null
  compressedSize.value = 0
  if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
  compressedUrl.value = ''
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="compressor">
    <div v-if="!originalImage" class="card upload-card">
      <div
        class="drop-zone"
        :class="{ dragover: isDragOver }"
        @click="triggerUpload"
        @drop.prevent="onDrop"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
      >
        <span class="drop-zone-icon">📉</span>
        <p class="drop-zone-title">{{ t('common.uploadTitle') }}</p>
        <p class="drop-zone-hint">{{ t('common.formatSupportCompress') }}</p>
      </div>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
    </div>

    <div v-if="error" class="alert alert-error" style="margin-bottom: 16px;">
      {{ error }}
    </div>

    <div v-if="originalImage" class="card editor-card">
      <div class="editor-header">
        <div class="file-info">
          <span class="file-name">{{ originalImage.name }}</span>
          <span class="file-meta">{{ originalDimensions }} · {{ originalFormat }} · {{ formatSize(originalSize) }}</span>
        </div>
        <button class="btn btn-secondary btn-sm" @click="reset">{{ t('common.reset') }}</button>
      </div>

      <div class="editor-body">
        <div class="previews">
          <div class="preview-panel">
            <div class="preview-label">
              <span class="size-badge original">{{ t('compressor.original') }} {{ formatSize(originalSize) }}</span>
            </div>
            <div class="preview-image-wrapper">
              <canvas ref="originalCanvasRef" class="preview-canvas"></canvas>
            </div>
          </div>

          <div class="preview-arrow">
            <span v-if="compressionRatio > 0" class="ratio-badge">-{{ compressionRatio }}%</span>
            <span v-else class="ratio-arrow">→</span>
          </div>

          <div class="preview-panel">
            <div class="preview-label">
              <span class="size-badge compressed" v-if="compressedSize">
                {{ t('compressor.compressed') }} {{ formatSize(compressedSize) }}
              </span>
              <span class="size-badge compressed" v-else>{{ t('common.processing') }}</span>
            </div>
            <div class="preview-image-wrapper">
              <canvas ref="canvasRef" class="preview-canvas" style="display:none;"></canvas>
              <img v-if="compressedUrl" :src="compressedUrl" class="preview-img" :alt="t('compressor.previewAlt')" />
              <div v-else class="preview-placeholder">{{ t('common.processing') }}</div>
              <div v-if="isProcessing" class="preview-processing-overlay">
                <span class="mini-spinner"></span>
                {{ t('common.processing') }}
              </div>
            </div>
          </div>
        </div>

        <div class="controls">
          <div class="control-group">
            <label class="control-label">{{ t('compressor.qualityLabel') }}</label>
            <div class="preset-buttons">
              <button
                v-for="preset in presets"
                :key="preset.quality"
                class="preset-btn"
                :class="{ active: quality === preset.quality }"
                type="button"
                @click="quality = preset.quality"
              >
                <span class="preset-name">{{ preset.label }}</span>
                <span class="preset-desc">{{ preset.desc }}</span>
              </button>
            </div>
            <div class="slider-row">
              <input type="range" min="0.1" max="1" step="0.01" v-model.number="quality" />
              <span class="slider-value">{{ Math.round(quality * 100) }}%</span>
            </div>
          </div>

          <div class="control-group">
            <label class="control-label">{{ t('compressor.formatLabel') }}</label>
            <select v-model="outputFormat">
              <option value="jpeg">{{ t('compressor.formats.jpeg') }}</option>
              <option value="webp">{{ t('compressor.formats.webp') }}</option>
              <option value="png">{{ t('compressor.formats.png') }}</option>
            </select>
            <p class="control-hint" v-if="outputFormat === 'png'">{{ t('compressor.pngHint') }}</p>
          </div>

          <div class="control-group">
            <label class="control-label">{{ t('compressor.dimensionLabel') }}</label>
            <div class="dimension-inputs">
              <input
                type="number"
                v-model.number="maxWidth"
                :placeholder="t('compressor.widthPlaceholder')"
                min="0"
                class="dim-input"
              />
              <span class="dim-sep">x</span>
              <input
                type="number"
                v-model.number="maxHeight"
                :placeholder="t('compressor.heightPlaceholder')"
                min="0"
                class="dim-input"
              />
            </div>
          </div>

          <button class="btn btn-success btn-download" :disabled="!compressedUrl" @click="download">
            ↓ {{ t('compressor.download', { size: compressedSize ? formatSize(compressedSize) : '...' }) }}
          </button>
        </div>
      </div>
    </div>

    <AdSenseSlot
      v-if="originalImage"
      class-name="ad-inline"
      :label="t('site.toolAd')"
      :slot="toolAdSlot"
    />
  </div>
</template>

<style scoped>
.upload-card {
  padding: 24px;
}

.editor-card {
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: #FAFAFA;
  flex-wrap: wrap;
  gap: 12px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.file-name {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.file-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.editor-body {
  padding: 24px;
}

.previews {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.preview-panel {
  flex: 1;
  min-width: 200px;
  max-width: 420px;
}

.preview-label {
  margin-bottom: 8px;
  text-align: center;
}

.preview-image-wrapper {
  background: #FAFAFA;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  overflow: hidden;
  position: relative;
}

.preview-canvas,
.preview-img {
  max-width: 100%;
  height: auto;
  display: block;
  min-height: 50px;
}

.preview-placeholder {
  padding: 60px 20px;
  color: var(--text-muted);
  font-size: 0.875rem;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  z-index: 5;
  border-radius: var(--radius-sm);
}

.mini-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #E5E7EB;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: compress-spin 0.6s linear infinite;
}

@keyframes compress-spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1.5rem;
  color: var(--text-muted);
}

.ratio-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--success-light);
  color: var(--success);
  font-size: 0.875rem;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 24px;
  white-space: nowrap;
}

.ratio-arrow {
  font-size: 1.5rem;
  color: var(--text-muted);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
}

.control-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: white;
  transition: all 0.15s ease;
  flex: 1;
  min-width: 100px;
}

.preset-btn:hover {
  border-color: var(--primary);
}

.preset-btn.active {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.preset-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.preset-desc {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.preset-btn.active .preset-desc {
  color: var(--primary);
  opacity: 0.75;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  min-width: 40px;
  text-align: right;
}

.dimension-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dim-input {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  outline: none;
  min-width: 100px;
}

.dim-input:focus {
  border-color: var(--border-focus);
}

.dim-sep {
  color: var(--text-muted);
  font-weight: 600;
}

.btn-download {
  margin-top: 8px;
  padding: 14px 32px;
  font-size: 1rem;
  width: 100%;
}

@media (max-width: 768px) {
  .upload-card {
    padding: 16px;
  }

  .editor-header {
    padding: 12px 16px;
    gap: 8px;
  }

  .editor-body {
    padding: 12px;
  }

  .previews {
    flex-direction: column;
    gap: 12px;
  }

  .preview-arrow {
    flex-direction: row;
    padding: 8px 0;
  }

  .preview-panel {
    max-width: 100%;
    min-width: 0;
  }

  .preview-image-wrapper {
    min-height: 180px;
  }

  .preset-buttons {
    flex-direction: column;
  }

  .preset-btn {
    padding: 14px 16px;
    min-width: auto;
  }

  .dimension-inputs {
    gap: 12px;
  }

  .dim-input {
    min-width: auto;
    padding: 10px 12px;
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  .upload-card {
    padding: 12px;
  }

  .editor-header {
    padding: 8px 12px;
  }

  .file-name {
    font-size: 0.875rem;
    max-width: 160px;
  }

  .file-meta {
    font-size: 0.7rem;
    white-space: normal;
    line-height: 1.4;
  }

  .editor-body {
    padding: 8px;
  }

  .preview-image-wrapper {
    min-height: 150px;
  }

  .preview-canvas,
  .preview-img {
    max-height: 200px;
    object-fit: contain;
  }

  .dimension-inputs {
    flex-direction: column;
    gap: 8px;
  }

  .dim-input {
    width: 100%;
  }
}
</style>
