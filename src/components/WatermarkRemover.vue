<script setup>
import { computed, inject, nextTick, onMounted, ref } from 'vue'
import { I18N_KEY } from '../i18n'
import AdSenseSlot from './AdSenseSlot.vue'

const { t } = inject(I18N_KEY)

const BACKEND_URL = 'https://viewmax-watermark-remover.hf.space'
const isAIProcessing = ref(false)
const aiAvailable = ref(false)

const originalImage = ref(null)
const imageElement = ref(null)
const canvasRef = ref(null)
const wrapperRef = ref(null)
const fileInput = ref(null)

const isDrawing = ref(false)
const selection = ref(null)
const hasSelection = ref(false)
const isProcessed = ref(false)
const processedUrl = ref('')
const error = ref('')
const isDragOver = ref(false)
const blurRadius = ref(10)
const removeMethod = ref('ai')
const padding = ref(5)
const scale = ref(1)

const methods = computed(() => t('watermark.methods'))
const toolAdSlot = import.meta.env.VITE_ADSENSE_SLOT_TOOL || import.meta.env.VITE_ADSENSE_SLOT_INLINE || ''

let drawStart = null
let originalImageData = null

async function checkAIBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(10000),
    })
    aiAvailable.value = res.ok
    return
  } catch (e) {
    console.log('[AI] Health check failed:', e.message)
  }
  aiAvailable.value = false
}

onMounted(() => {
  checkAIBackend()
  window.setInterval(checkAIBackend, 30000)
})

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function handleFile(file) {
  error.value = ''
  selection.value = null
  hasSelection.value = false
  isProcessed.value = false
  if (processedUrl.value) URL.revokeObjectURL(processedUrl.value)
  processedUrl.value = ''
  originalImageData = null

  if (!file || !file.type.startsWith('image/')) {
    error.value = t('common.imageOnly')
    return
  }

  originalImage.value = file
  const reader = new FileReader()
  reader.onload = (event) => {
    const img = new Image()
    img.onload = () => {
      imageElement.value = img
      nextTick(() => drawImageOnCanvas())
    }
    img.src = event.target.result
  }
  reader.readAsDataURL(file)
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

function drawImageOnCanvas() {
  const canvas = canvasRef.value
  const img = imageElement.value
  if (!canvas || !img) return

  const maxWidth = wrapperRef.value ? wrapperRef.value.clientWidth - 4 : 700
  const maxHeight = 500

  let width = img.naturalWidth
  let height = img.naturalHeight
  scale.value = Math.min(maxWidth / width, maxHeight / height, 1)
  width = Math.round(width * scale.value)
  height = Math.round(height * scale.value)

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  storeOriginalImageData()

  if (hasSelection.value && selection.value) drawSelectionBox()
}

function storeOriginalImageData() {
  const canvas = canvasRef.value
  if (!canvas) return
  originalImageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
}

function drawSelectionBox() {
  const canvas = canvasRef.value
  if (!selection.value || !canvas) return

  const ctx = canvas.getContext('2d')
  if (originalImageData) ctx.putImageData(originalImageData, 0, 0)

  const { x, y, width, height } = selection.value
  ctx.fillStyle = 'rgba(79, 70, 229, 0.2)'
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = '#4F46E5'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 3])
  ctx.strokeRect(x, y, width, height)
  ctx.setLineDash([])
}

function getCanvasPos(event) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startSelection(pos) {
  drawStart = pos
  isDrawing.value = true
  selection.value = { x: pos.x, y: pos.y, width: 0, height: 0 }
  hasSelection.value = false
}

function updateSelection(pos) {
  if (!isDrawing.value || !drawStart || !selection.value) return
  const canvas = canvasRef.value
  if (!canvas) return

  const x = Math.min(drawStart.x, pos.x)
  const y = Math.min(drawStart.y, pos.y)
  const width = Math.abs(pos.x - drawStart.x)
  const height = Math.abs(pos.y - drawStart.y)

  selection.value = {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(width, canvas.width - x),
    height: Math.min(height, canvas.height - y),
  }
  drawSelectionBox()
}

function finishSelection() {
  if (!isDrawing.value) return
  isDrawing.value = false
  drawStart = null

  if (selection.value && selection.value.width > 5 && selection.value.height > 5) {
    hasSelection.value = true
    return
  }

  selection.value = null
  hasSelection.value = false
  if (originalImageData && canvasRef.value) {
    canvasRef.value.getContext('2d').putImageData(originalImageData, 0, 0)
  }
}

function onMouseDown(event) {
  if (!imageElement.value || isProcessed.value) return
  startSelection(getCanvasPos(event))
}

function onMouseMove(event) {
  updateSelection(getCanvasPos(event))
}

function onTouchStart(event) {
  if (!imageElement.value || isProcessed.value || event.touches.length !== 1) return
  startSelection(getCanvasPos(event.touches[0]))
}

function onTouchMove(event) {
  if (!isDrawing.value) return
  event.preventDefault()
  updateSelection(getCanvasPos(event.touches[0]))
}

async function removeWatermark() {
  if (!hasSelection.value || !selection.value) return

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (originalImageData) ctx.putImageData(originalImageData, 0, 0)

  const { x, y, width, height } = selection.value

  if (removeMethod.value === 'ai') {
    await removeWithAI(ctx, x, y, width, height)
    return
  }

  const imageData = ctx.getImageData(x, y, width, height)
  if (removeMethod.value === 'smart') {
    applySmartFill(ctx, imageData, x, y, width, height)
  } else if (removeMethod.value === 'blur') {
    applyBlur(ctx, x, y, width, height, blurRadius.value)
  } else if (removeMethod.value === 'crop') {
    applyCrop(ctx, x, y, width, height)
  }

  isProcessed.value = true
  updateProcessedPreview()
}

async function removeWithAI(ctx, selX, selY, selW, selH) {
  isAIProcessing.value = true
  error.value = ''

  try {
    const canvas = canvasRef.value
    const img = imageElement.value
    if (!canvas || !img) return

    const scaleX = img.naturalWidth / canvas.width
    const scaleY = img.naturalHeight / canvas.height
    const formData = new FormData()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))

    formData.append('image', blob, 'image.png')
    formData.append('x', Math.round(selX * scaleX))
    formData.append('y', Math.round(selY * scaleY))
    formData.append('width', Math.round(selW * scaleX))
    formData.append('height', Math.round(selH * scaleY))
    formData.append('padding', padding.value)

    const res = await fetch(`${BACKEND_URL}/api/remove-watermark-by-coords`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'AI processing failed')
    }

    const data = await res.json()
    const resultImg = new Image()
    await new Promise((resolve, reject) => {
      resultImg.onload = resolve
      resultImg.onerror = reject
      resultImg.src = `data:image/png;base64,${data.image_base64}`
    })

    canvas.width = resultImg.width
    canvas.height = resultImg.height
    ctx.drawImage(resultImg, 0, 0)

    isProcessed.value = true
    updateProcessedPreview()
  } catch (e) {
    console.error('[AI] Processing failed:', e)
    error.value = t('watermark.aiFailed', { message: e.message })

    const { x, y, width, height } = selection.value
    const imageData = ctx.getImageData(x, y, width, height)
    applySmartFill(ctx, imageData, x, y, width, height)
    isProcessed.value = true
    updateProcessedPreview()
  } finally {
    isAIProcessing.value = false
  }
}

function applySmartFill(ctx, imageData, selX, selY, selW, selH) {
  const canvas = canvasRef.value
  const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = fullData.data
  const fullW = canvas.width

  for (let row = 0; row < selH; row++) {
    for (let col = 0; col < selW; col++) {
      const px = selX + col
      const py = selY + row
      const idx = (py * fullW + px) * 4
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let totalWeight = 0

      if (selX > 0) {
        const li = (py * fullW + (selX - 1)) * 4
        const weight = 1 / ((col + 1) * (col + 1))
        r += data[li] * weight
        g += data[li + 1] * weight
        b += data[li + 2] * weight
        a += data[li + 3] * weight
        totalWeight += weight
      }

      if (selX + selW < fullW) {
        const ri = (py * fullW + (selX + selW)) * 4
        const dist = selW - col
        const weight = 1 / (dist * dist)
        r += data[ri] * weight
        g += data[ri + 1] * weight
        b += data[ri + 2] * weight
        a += data[ri + 3] * weight
        totalWeight += weight
      }

      if (selY > 0) {
        const ti = ((selY - 1) * fullW + px) * 4
        const weight = 1 / ((row + 1) * (row + 1))
        r += data[ti] * weight
        g += data[ti + 1] * weight
        b += data[ti + 2] * weight
        a += data[ti + 3] * weight
        totalWeight += weight
      }

      if (selY + selH < canvas.height) {
        const bi = ((selY + selH) * fullW + px) * 4
        const dist = selH - row
        const weight = 1 / (dist * dist)
        r += data[bi] * weight
        g += data[bi + 1] * weight
        b += data[bi + 2] * weight
        a += data[bi + 3] * weight
        totalWeight += weight
      }

      if (totalWeight > 0) {
        data[idx] = Math.round(r / totalWeight)
        data[idx + 1] = Math.round(g / totalWeight)
        data[idx + 2] = Math.round(b / totalWeight)
        data[idx + 3] = Math.round(a / totalWeight)
      }
    }
  }

  ctx.putImageData(fullData, 0, 0)
}

function applyBlur(ctx, selX, selY, selW, selH, radius) {
  const canvas = canvasRef.value
  const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = fullData.data
  const workData = new Uint8ClampedArray(data)
  const width = canvas.width
  const r = Math.max(1, Math.min(radius, 50))

  for (let row = selY; row < selY + selH; row++) {
    for (let col = selX; col < selX + selW; col++) {
      let sumR = 0
      let sumG = 0
      let sumB = 0
      let sumA = 0
      let count = 0

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const ny = row + dy
          const nx = col + dx
          if (ny >= 0 && ny < canvas.height && nx >= 0 && nx < width) {
            const ni = (ny * width + nx) * 4
            sumR += workData[ni]
            sumG += workData[ni + 1]
            sumB += workData[ni + 2]
            sumA += workData[ni + 3]
            count++
          }
        }
      }

      const idx = (row * width + col) * 4
      data[idx] = Math.round(sumR / count)
      data[idx + 1] = Math.round(sumG / count)
      data[idx + 2] = Math.round(sumB / count)
      data[idx + 3] = Math.round(sumA / count)
    }
  }

  ctx.putImageData(fullData, 0, 0)
}

function applyCrop(ctx, selX, selY, selW, selH) {
  const canvas = canvasRef.value
  const source = document.createElement('canvas')
  source.width = canvas.width
  source.height = canvas.height
  source.getContext('2d').drawImage(canvas, 0, 0)

  canvas.width = Math.max(1, canvas.width - selW)
  canvas.height = source.height
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, selX, source.height, 0, 0, selX, source.height)
  ctx.drawImage(
    source,
    selX + selW,
    0,
    source.width - selX - selW,
    source.height,
    selX,
    0,
    source.width - selX - selW,
    source.height,
  )
}

function updateProcessedPreview() {
  const canvas = canvasRef.value
  if (!canvas) return
  if (processedUrl.value) URL.revokeObjectURL(processedUrl.value)
  processedUrl.value = canvas.toDataURL('image/png')
}

function download() {
  const canvas = canvasRef.value
  if (!canvas) return
  const name = originalImage.value
    ? `${originalImage.value.name.replace(/\.[^.]+$/, '')}_nowatermark.png`
    : 'nowatermark.png'
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = name
  link.click()
}

function reset() {
  originalImage.value = null
  imageElement.value = null
  selection.value = null
  hasSelection.value = false
  isProcessed.value = false
  if (processedUrl.value) URL.revokeObjectURL(processedUrl.value)
  processedUrl.value = ''
  error.value = ''
  originalImageData = null
  blurRadius.value = 10
  removeMethod.value = 'ai'
  padding.value = 5
  if (fileInput.value) fileInput.value.value = ''
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

function clearSelection() {
  selection.value = null
  hasSelection.value = false
  if (originalImageData && canvasRef.value) {
    canvasRef.value.getContext('2d').putImageData(originalImageData, 0, 0)
  }
}
</script>

<template>
  <div class="remover">
    <div v-if="!originalImage" class="card upload-card">
      <div
        class="drop-zone"
        :class="{ dragover: isDragOver }"
        @click="triggerUpload"
        @drop.prevent="onDrop"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
      >
        <span class="drop-zone-icon">🖼️</span>
        <p class="drop-zone-title">{{ t('common.uploadTitle') }}</p>
        <p class="drop-zone-hint">{{ t('common.formatSupportBasic') }}</p>
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
          <span class="file-meta">{{ formatSize(originalImage.size) }}</span>
        </div>
        <div class="header-actions">
          <span
            v-if="removeMethod === 'ai'"
            class="ai-status"
            :class="{ 'ai-online': aiAvailable, 'ai-offline': !aiAvailable }"
            :title="aiAvailable ? t('watermark.aiOnlineTitle') : t('watermark.aiOfflineTitle')"
          >
            <span class="ai-dot"></span>
            {{ aiAvailable ? t('watermark.aiOnline') : t('watermark.aiOffline') }}
          </span>
          <button
            v-if="hasSelection && !isProcessed"
            class="btn btn-primary btn-sm"
            :disabled="isAIProcessing"
            @click="removeWatermark"
          >
            {{ isAIProcessing ? t('common.processing') : t('watermark.remove') }}
          </button>
          <button v-if="isProcessed" class="btn btn-success btn-sm" @click="download">
            ↓ {{ t('common.download') }}
          </button>
          <button class="btn btn-secondary btn-sm" @click="reset">{{ t('common.reset') }}</button>
        </div>
      </div>

      <div class="editor-body">
        <div class="instructions" v-if="!isProcessed">
          <div class="alert alert-info">
            <span v-if="!hasSelection">👆 {{ t('watermark.selectHint') }}</span>
            <span v-else>✓ {{ t('watermark.selectedHint') }}</span>
          </div>
        </div>

        <div class="instructions" v-if="isProcessed">
          <div class="alert alert-success">✓ {{ t('watermark.done') }}</div>
        </div>

        <div class="canvas-area" ref="wrapperRef">
          <div class="canvas-container" :style="{ maxWidth: '100%', overflow: 'auto' }">
            <canvas
              ref="canvasRef"
              class="main-canvas"
              :class="{ 'ai-processing': isAIProcessing }"
              @mousedown="onMouseDown"
              @mousemove="onMouseMove"
              @mouseup="finishSelection"
              @mouseleave="finishSelection"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
              @touchend="finishSelection"
            ></canvas>

            <div v-if="isAIProcessing" class="ai-loading-overlay">
              <div class="ai-loading-content">
                <div class="ai-spinner"></div>
                <p class="ai-loading-text">{{ t('watermark.aiLoadingTitle') }}</p>
                <p class="ai-loading-hint">{{ t('watermark.aiLoadingHint') }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="controls-row" v-if="hasSelection && !isProcessed">
          <div class="control-group">
            <label class="control-label">{{ t('watermark.methodLabel') }}</label>
            <div class="method-options">
              <label
                v-for="method in methods"
                :key="method.id"
                class="method-option"
                :class="{ active: removeMethod === method.id, 'ai-option': method.id === 'ai' }"
              >
                <input type="radio" :value="method.id" v-model="removeMethod" hidden />
                <span class="method-name">{{ method.label }}</span>
                <span class="method-desc">{{ method.desc }}</span>
              </label>
            </div>
          </div>

          <div class="control-group" v-if="removeMethod === 'ai'">
            <label class="control-label">{{ t('watermark.paddingLabel', { value: padding }) }}</label>
            <div class="slider-row">
              <input type="range" min="0" max="30" v-model.number="padding" />
              <span class="slider-value">{{ padding }}</span>
            </div>
          </div>

          <div class="control-group" v-if="removeMethod === 'blur'">
            <label class="control-label">{{ t('watermark.blurLabel', { value: blurRadius }) }}</label>
            <div class="slider-row">
              <input type="range" min="1" max="30" v-model.number="blurRadius" />
              <span class="slider-value">{{ blurRadius }}</span>
            </div>
          </div>

          <div class="selection-actions">
            <button class="btn btn-primary" :disabled="isAIProcessing" @click="removeWatermark">
              <span v-if="isAIProcessing" class="btn-spinner"></span>
              {{ isAIProcessing ? t('common.processing') : removeMethod === 'ai' ? t('watermark.aiRemove') : t('watermark.remove') }}
            </button>
            <button class="btn btn-secondary" @click="clearSelection">
              {{ t('watermark.clearSelection') }}
            </button>
          </div>
        </div>

        <div class="controls-row" v-if="isProcessed">
          <button class="btn btn-success" @click="download" style="width:100%; padding: 14px 32px; font-size: 1rem;">
            ↓ {{ t('watermark.downloadResult') }}
          </button>
        </div>
      </div>
    </div>

    <div class="card tips-card" v-if="!originalImage">
      <h2 class="tips-title">{{ t('watermark.tipsTitle') }}</h2>
      <div class="tips-grid">
        <div v-for="tip in t('watermark.tips')" :key="tip.title" class="tip-item">
          <span class="tip-icon">{{ tip.icon }}</span>
          <div>
            <strong>{{ tip.title }}</strong>
            <p>{{ tip.text }}</p>
          </div>
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
  padding: 12px 24px;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.file-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-body {
  padding: 20px 24px;
}

.instructions,
.canvas-area {
  margin-bottom: 16px;
}

.canvas-container {
  display: flex;
  justify-content: center;
  background: repeating-conic-gradient(#F3F4F6 0% 25%, white 0% 50%) 50% / 20px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  padding: 16px;
  position: relative;
}

.main-canvas {
  max-width: 100%;
  height: auto;
  display: block;
  box-shadow: var(--shadow-md);
  border-radius: 4px;
}

.controls-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
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

.method-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.method-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: white;
  cursor: pointer;
  transition: all 0.15s ease;
  flex: 1;
  min-width: 120px;
}

.method-option:hover {
  border-color: var(--primary);
}

.method-option.active {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.method-option.ai-option {
  border-color: #A5B4FC;
  background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%);
}

.method-option.ai-option.active {
  border-color: var(--primary);
  background: linear-gradient(135deg, #C7D2FE 0%, #DDD6FE 100%);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.method-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.method-desc {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 2px;
  text-align: center;
}

.method-option.active .method-desc {
  color: var(--primary);
  opacity: 0.75;
}

.slider-row,
.selection-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  min-width: 30px;
}

.selection-actions {
  flex-wrap: wrap;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tips-card {
  padding: 24px;
  margin-top: 16px;
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

.ai-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
}

.ai-status.ai-online {
  color: #059669;
  background: #ECFDF5;
  border-color: #A7F3D0;
}

.ai-status.ai-offline {
  color: #D97706;
  background: #FFFBEB;
  border-color: #FDE68A;
}

.ai-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.ai-online .ai-dot {
  background: #10B981;
  animation: ai-pulse 2s infinite;
}

.ai-offline .ai-dot {
  background: #F59E0B;
}

@keyframes ai-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.ai-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: var(--radius-sm);
}

.ai-loading-content {
  text-align: center;
}

.ai-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  border: 3px solid #E5E7EB;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.ai-loading-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.ai-loading-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.main-canvas.ai-processing {
  opacity: 0.5;
  pointer-events: none;
}

@media (max-width: 768px) {
  .upload-card,
  .tips-card {
    padding: 16px;
  }

  .editor-header {
    padding: 10px 16px;
    gap: 8px;
  }

  .editor-body {
    padding: 12px;
  }

  .canvas-container {
    padding: 8px;
    min-height: 150px;
  }

  .method-options,
  .selection-actions {
    flex-direction: column;
  }

  .method-option {
    padding: 14px 16px;
    min-width: auto;
    width: 100%;
  }

  .selection-actions .btn {
    width: 100%;
    min-height: 48px;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .upload-card,
  .tips-card {
    padding: 12px;
  }

  .editor-header {
    padding: 8px 12px;
  }

  .file-name {
    font-size: 0.875rem;
    max-width: 180px;
  }

  .file-meta,
  .ai-status {
    font-size: 0.7rem;
  }

  .editor-body {
    padding: 8px;
  }

  .canvas-container {
    padding: 4px;
    min-height: 120px;
  }
}
</style>
