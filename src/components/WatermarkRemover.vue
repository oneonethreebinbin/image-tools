<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'

// --- AI Backend ---
const BACKEND_URL = 'http://localhost:8765'
const useAI = ref(false)          // 是否启用 AI 模式
const isAIProcessing = ref(false) // AI 处理中
const aiAvailable = ref(false)    // 后端是否可用

// --- State ---
const originalImage = ref(null)
const imageElement = ref(null)
const canvasRef = ref(null)
const previewCanvasRef = ref(null)
const wrapperRef = ref(null)
const fileInput = ref(null)

const isDrawing = ref(false)
const selection = ref(null) // { x, y, width, height } in image coordinates
const hasSelection = ref(false)
const isProcessed = ref(false)
const processedUrl = ref('')
const error = ref('')
const isDragOver = ref(false)
const blurRadius = ref(10)
const removeMethod = ref('ai') // ai | smart | blur | crop
const zoomLevel = ref(1)
const padding = ref(5) // AI 模式下的边缘扩展像素

// Canvas scaling factor (canvas pixels to image pixels)
const scale = ref(1)
const canvasOffset = ref({ x: 0, y: 0 })

let drawStart = null
let originalImageData = null // backup for undo

// --- AI Backend Health Check ---
async function checkAIBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(3000)
    })
    if (res.ok) {
      aiAvailable.value = true
      console.log('[AI] 后端服务已连接')
    }
  } catch {
    aiAvailable.value = false
  }
}

onMounted(() => {
  checkAIBackend()
  // 每 30 秒检查一次后端状态
  setInterval(checkAIBackend, 30000)
})

// --- Helpers ---
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// --- File Handling ---
function handleFile(file) {
  error.value = ''
  selection.value = null
  hasSelection.value = false
  isProcessed.value = false
  if (processedUrl.value) URL.revokeObjectURL(processedUrl.value)
  processedUrl.value = ''
  originalImageData = null

  if (!file || !file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  originalImage.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      imageElement.value = img
      nextTick(() => drawImageOnCanvas())
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) handleFile(file)
}

function onDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onDragOver(e) {
  e.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function triggerUpload() {
  fileInput.value?.click()
}

// --- Canvas Drawing ---
function drawImageOnCanvas() {
  const canvas = canvasRef.value
  const img = imageElement.value
  if (!canvas || !img) return

  const maxWidth = wrapperRef.value ? wrapperRef.value.clientWidth - 4 : 700
  const maxHeight = 500

  let w = img.naturalWidth
  let h = img.naturalHeight
  scale.value = Math.min(maxWidth / w, maxHeight / h, 1)
  w = Math.round(w * scale.value)
  h = Math.round(h * scale.value)

  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  // Store the full-res image data for processing
  storeOriginalImageData()

  // Redraw selection if exists
  if (hasSelection.value && selection.value) {
    drawSelectionBox()
  }
}

function storeOriginalImageData() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function drawSelectionBox() {
  if (!selection.value) return
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  // Restore original first
  if (originalImageData) {
    ctx.putImageData(originalImageData, 0, 0)
  }

  // Draw selection overlay
  const { x, y, width, height } = selection.value
  ctx.fillStyle = 'rgba(79, 70, 229, 0.2)'
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = '#4F46E5'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 3])
  ctx.strokeRect(x, y, width, height)
  ctx.setLineDash([])
}

// --- Mouse Events for Selection ---
function getCanvasPos(e) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function onMouseDown(e) {
  if (!imageElement.value || isProcessed.value) return
  const pos = getCanvasPos(e)
  drawStart = pos
  isDrawing.value = true
  selection.value = { x: pos.x, y: pos.y, width: 0, height: 0 }
  hasSelection.value = false
}

function onMouseMove(e) {
  if (!isDrawing.value || !drawStart || !selection.value) return
  const pos = getCanvasPos(e)

  const x = Math.min(drawStart.x, pos.x)
  const y = Math.min(drawStart.y, pos.y)
  const width = Math.abs(pos.x - drawStart.x)
  const height = Math.abs(pos.y - drawStart.y)

  selection.value = {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(width, canvasRef.value.width - x),
    height: Math.min(height, canvasRef.value.height - y)
  }

  drawSelectionBox()
}

function onMouseUp(e) {
  if (!isDrawing.value) return
  isDrawing.value = false
  drawStart = null

  if (selection.value && selection.value.width > 5 && selection.value.height > 5) {
    hasSelection.value = true
  } else {
    selection.value = null
    hasSelection.value = false
    // Redraw without selection
    if (originalImageData && canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d')
      ctx.putImageData(originalImageData, 0, 0)
    }
  }
}

function onTouchStart(e) {
  if (!imageElement.value || isProcessed.value) return
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    const pos = getCanvasPos(touch)
    drawStart = pos
    isDrawing.value = true
    selection.value = { x: pos.x, y: pos.y, width: 0, height: 0 }
    hasSelection.value = false
  }
}

function onTouchMove(e) {
  if (!isDrawing.value || !drawStart || !selection.value) return
  e.preventDefault()
  const touch = e.touches[0]
  const pos = getCanvasPos(touch)
  const x = Math.min(drawStart.x, pos.x)
  const y = Math.min(drawStart.y, pos.y)
  const width = Math.abs(pos.x - drawStart.x)
  const height = Math.abs(pos.y - drawStart.y)

  selection.value = {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(width, canvasRef.value.width - x),
    height: Math.min(height, canvasRef.value.height - y)
  }
  drawSelectionBox()
}

function onTouchEnd() {
  if (!isDrawing.value) return
  isDrawing.value = false
  drawStart = null
  if (selection.value && selection.value.width > 5 && selection.value.height > 5) {
    hasSelection.value = true
  } else {
    selection.value = null
    hasSelection.value = false
  }
}

// --- Removal Methods ---
async function removeWatermark() {
  if (!hasSelection.value || !selection.value) return

  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  // Reload original before processing
  if (originalImageData) {
    ctx.putImageData(originalImageData, 0, 0)
  }

  const { x, y, width, height } = selection.value

  // AI 模式：调用后端 LaMa 模型
  if (removeMethod.value === 'ai') {
    await removeWithAI(ctx, x, y, width, height)
    return
  }

  const imageData = ctx.getImageData(x, y, width, height)

  if (removeMethod.value === 'smart') {
    applySmartFill(ctx, imageData, x, y, width, height)
  } else if (removeMethod.value === 'blur') {
    applyBlur(ctx, imageData, x, y, width, height, blurRadius.value)
  } else if (removeMethod.value === 'crop') {
    applyCrop(ctx, x, y, width, height)
    isProcessed.value = true
    updateProcessedPreview()
    return
  }

  isProcessed.value = true
  updateProcessedPreview()
}

// --- AI Removal ---
async function removeWithAI(ctx, selX, selY, selW, selH) {
  isAIProcessing.value = true
  error.value = ''

  try {
    const canvas = canvasRef.value
    const img = imageElement.value
    if (!canvas || !img) return

    // 计算 canvas 到原图的缩放比例
    const scaleX = img.naturalWidth / canvas.width
    const scaleY = img.naturalHeight / canvas.height

    // 将 canvas 坐标转换为原图坐标
    const origX = Math.round(selX * scaleX)
    const origY = Math.round(selY * scaleY)
    const origW = Math.round(selW * scaleX)
    const origH = Math.round(selH * scaleY)

    // 从 canvas 获取当前显示的图片（完整分辨率）
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

    // 构建 FormData
    const formData = new FormData()
    formData.append('image', blob, 'image.png')
    formData.append('x', origX)
    formData.append('y', origY)
    formData.append('width', origW)
    formData.append('height', origH)
    formData.append('padding', padding.value)

    console.log(`[AI] 发送请求到后端... 区域: (${origX},${origY}) ${origW}x${origH}`)

    const res = await fetch(`${BACKEND_URL}/api/remove-watermark-by-coords`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'AI 处理失败')
    }

    const data = await res.json()
    console.log('[AI] 处理完成！')

    // 将 base64 结果绘制到 canvas 上
    const resultImg = new Image()
    await new Promise((resolve, reject) => {
      resultImg.onload = resolve
      resultImg.onerror = reject
      resultImg.src = `data:image/png;base64,${data.image_base64}`
    })

    // 更新 canvas
    canvas.width = resultImg.width
    canvas.height = resultImg.height
    ctx.drawImage(resultImg, 0, 0)

    isProcessed.value = true
    updateProcessedPreview()
  } catch (e) {
    console.error('[AI] 处理失败:', e)
    error.value = `AI 处理失败: ${e.message}。请确认后端已启动 (双击 backend/start.bat)。已自动回退到智能填充模式。`

    // 回退到智能填充
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
  // Get the surrounding image data for boundary pixels
  const canvas = canvasRef.value
  const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = fullData.data
  const fullW = canvas.width

  for (let row = 0; row < selH; row++) {
    for (let col = 0; col < selW; col++) {
      const px = selX + col
      const py = selY + row
      const idx = (py * fullW + px) * 4

      // Collect boundary samples: left, right, top, bottom
      let r = 0, g = 0, b = 0, a = 0
      let totalWeight = 0

      // Left boundary
      if (selX > 0) {
        const li = (py * fullW + (selX - 1)) * 4
        const dist = col + 1
        const w = 1 / (dist * dist)
        r += data[li] * w; g += data[li + 1] * w; b += data[li + 2] * w; a += data[li + 3] * w
        totalWeight += w
      }

      // Right boundary
      if (selX + selW < fullW) {
        const ri = (py * fullW + (selX + selW)) * 4
        const dist = selW - col
        const w = 1 / (dist * dist)
        r += data[ri] * w; g += data[ri + 1] * w; b += data[ri + 2] * w; a += data[ri + 3] * w
        totalWeight += w
      }

      // Top boundary
      if (selY > 0) {
        const ti = ((selY - 1) * fullW + px) * 4
        const dist = row + 1
        const w = 1 / (dist * dist)
        r += data[ti] * w; g += data[ti + 1] * w; b += data[ti + 2] * w; a += data[ti + 3] * w
        totalWeight += w
      }

      // Bottom boundary
      if (selY + selH < canvas.height) {
        const bi = ((selY + selH) * fullW + px) * 4
        const dist = selH - row
        const w = 1 / (dist * dist)
        r += data[bi] * w; g += data[bi + 1] * w; b += data[bi + 2] * w; a += data[bi + 3] * w
        totalWeight += w
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

function applyBlur(ctx, imageData, selX, selY, selW, selH, radius) {
  // Box blur the selected area
  const canvas = canvasRef.value
  const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = fullData.data
  const w = canvas.width

  // Create working copy
  const workData = new Uint8ClampedArray(data)

  const r = Math.max(1, Math.min(radius, 50))

  for (let row = selY; row < selY + selH; row++) {
    for (let col = selX; col < selX + selW; col++) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0
      let count = 0

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const ny = row + dy
          const nx = col + dx
          if (ny >= 0 && ny < canvas.height && nx >= 0 && nx < w) {
            const ni = (ny * w + nx) * 4
            sumR += workData[ni]
            sumG += workData[ni + 1]
            sumB += workData[ni + 2]
            sumA += workData[ni + 3]
            count++
          }
        }
      }

      const idx = (row * w + col) * 4
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
  const imageData = ctx.getImageData(selX, selY, selW, selH)

  // Crop: remove the selected area
  // Get full image
  const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Create new canvas content without the selection
  canvas.width = canvas.width - selW
  ctx.putImageData(fullData, 0, 0)

  // Shift left part of right section
  // Actually, let's do this more simply - we'll take the full image and remove the rectangle
  // Reset canvas
  if (imageElement.value) {
    canvas.width = canvasRef.value.width
    ctx.drawImage(imageElement.value, 0, 0, canvas.width, canvas.height + selH)
  }
}

function updateProcessedPreview() {
  const canvas = canvasRef.value
  if (!canvas) return
  if (processedUrl.value) URL.revokeObjectURL(processedUrl.value)
  processedUrl.value = canvas.toDataURL('image/png')
}

// --- Download ---
function download() {
  const canvas = canvasRef.value
  if (!canvas) return
  const name = originalImage.value
    ? originalImage.value.name.replace(/\.[^.]+$/, '') + '_nowatermark.png'
    : 'nowatermark.png'
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = name
  a.click()
}

// --- Reset ---
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
  if (fileInput.value) fileInput.value.value = ''
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

function clearSelection() {
  selection.value = null
  hasSelection.value = false
  if (originalImageData && canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    ctx.putImageData(originalImageData, 0, 0)
  }
}
</script>

<template>
  <div class="remover">
    <!-- Upload Step -->
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
        <p class="drop-zone-title">拖拽图片到这里，或点击上传</p>
        <p class="drop-zone-hint">支持 JPEG · PNG · WebP · BMP · GIF</p>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        hidden
        @change="onFileChange"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="alert alert-error" style="margin-bottom: 16px;">
      {{ error }}
    </div>

    <!-- Editor -->
    <div v-if="originalImage" class="card editor-card">
      <div class="editor-header">
        <div class="file-info">
          <span class="file-name">{{ originalImage.name }}</span>
          <span class="file-meta">{{ formatSize(originalImage.size) }}</span>
        </div>
        <div class="header-actions">
          <!-- AI 状态指示器 -->
          <span
            v-if="removeMethod === 'ai'"
            class="ai-status"
            :class="{ 'ai-online': aiAvailable, 'ai-offline': !aiAvailable }"
            :title="aiAvailable ? 'AI 后端已连接' : 'AI 后端未连接，将使用本地模式'"
          >
            <span class="ai-dot"></span>
            {{ aiAvailable ? 'AI 就绪' : '离线模式' }}
          </span>
          <button
            v-if="hasSelection && !isProcessed"
            class="btn btn-primary btn-sm"
            :disabled="isAIProcessing"
            @click="removeWatermark"
          >
            {{ isAIProcessing ? 'AI 处理中...' : '去除水印' }}
          </button>
          <button
            v-if="isProcessed"
            class="btn btn-success btn-sm"
            @click="download"
          >
            ⬇ 下载结果
          </button>
          <button class="btn btn-secondary btn-sm" @click="reset">重新上传</button>
        </div>
      </div>

      <div class="editor-body">
        <!-- Instructions -->
        <div class="instructions" v-if="!isProcessed">
          <div class="alert alert-info">
            <span v-if="!hasSelection">👆 在图片上拖拽鼠标框选水印区域</span>
            <span v-else>✅ 已选中水印区域，点击「去除水印」处理</span>
          </div>
        </div>

        <!-- Processed badge -->
        <div class="instructions" v-if="isProcessed">
          <div class="alert alert-success">✅ 水印已去除！点击下载按钮保存结果</div>
        </div>

        <!-- Canvas Area -->
        <div class="canvas-area" ref="wrapperRef">
          <div class="canvas-container" :style="{ maxWidth: '100%', overflow: 'auto' }">
            <canvas
              ref="canvasRef"
              class="main-canvas"
              :class="{ 'ai-processing': isAIProcessing }"
              @mousedown="onMouseDown"
              @mousemove="onMouseMove"
              @mouseup="onMouseUp"
              @mouseleave="onMouseUp"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
              @touchend="onTouchEnd"
            ></canvas>

            <!-- AI 处理加载遮罩 -->
            <div v-if="isAIProcessing" class="ai-loading-overlay">
              <div class="ai-loading-content">
                <div class="ai-spinner"></div>
                <p class="ai-loading-text">AI 模型正在修复中...</p>
                <p class="ai-loading-hint">LaMa 深度学习模型分析图像并智能填充</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls-row" v-if="hasSelection && !isProcessed">
          <div class="control-group">
            <label class="control-label">去除方式</label>
            <div class="method-options">
              <label
                v-for="method in [
                  { id: 'ai', label: '🤖 AI 修复', desc: 'LaMa 深度学习模型智能修复' },
                  { id: 'smart', label: '智能填充', desc: '浏览器本地边缘填充' },
                  { id: 'blur', label: '模糊处理', desc: '模糊水印区域' },
                  { id: 'crop', label: '裁剪', desc: '直接裁去该区域' }
                ]"
                :key="method.id"
                class="method-option"
                :class="{ active: removeMethod === method.id, 'ai-option': method.id === 'ai' }"
              >
                <input
                  type="radio"
                  :value="method.id"
                  v-model="removeMethod"
                  hidden
                />
                <span class="method-name">{{ method.label }}</span>
                <span class="method-desc">{{ method.desc }}</span>
              </label>
            </div>
          </div>

          <div class="control-group" v-if="removeMethod === 'ai'">
            <label class="control-label">边缘扩展: {{ padding }}px（扩大修复范围提高质量）</label>
            <div class="slider-row">
              <input
                type="range"
                min="0"
                max="30"
                v-model.number="padding"
              />
              <span class="slider-value">{{ padding }}</span>
            </div>
          </div>

          <div class="control-group" v-if="removeMethod === 'blur'">
            <label class="control-label">模糊强度: {{ blurRadius }}px</label>
            <div class="slider-row">
              <input
                type="range"
                min="1"
                max="30"
                v-model.number="blurRadius"
              />
              <span class="slider-value">{{ blurRadius }}</span>
            </div>
          </div>

          <div class="selection-actions">
            <button
              class="btn btn-primary"
              :disabled="isAIProcessing"
              @click="removeWatermark"
            >
              <span v-if="isAIProcessing" class="btn-spinner"></span>
              {{ isAIProcessing ? 'AI 处理中...' : removeMethod === 'ai' ? '🚀 AI 智能去除' : '去除水印' }}
            </button>
            <button class="btn btn-secondary" @click="clearSelection">
              重新框选
            </button>
          </div>
        </div>

        <!-- Post-process actions -->
        <div class="controls-row" v-if="isProcessed">
          <button class="btn btn-success" @click="download" style="width:100%; padding: 14px 32px; font-size: 1rem;">
            ⬇ 下载处理后的图片
          </button>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div class="card tips-card" v-if="!originalImage">
      <h3 class="tips-title">使用提示</h3>
      <div class="tips-grid">
        <div class="tip-item">
          <span class="tip-icon">🤖</span>
          <div>
            <strong>AI 修复（推荐）</strong>
            <p>基于 LaMa 深度学习模型，智能重建水印下的原始纹理，效果远超传统方法</p>
          </div>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🎯</span>
          <div>
            <strong>精准框选</strong>
            <p>框选水印时稍微留一点边距，AI 修复效果更好；可通过「边缘扩展」自动扩大</p>
          </div>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🧠</span>
          <div>
            <strong>智能填充</strong>
            <p>浏览器本地处理的备用方案，适合简单背景，无需后端服务</p>
          </div>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🌫️</span>
          <div>
            <strong>模糊 / 裁剪</strong>
            <p>适合复杂背景的快速处理，模糊遮盖或直接裁去水印所在区域</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Ad Inline -->
    <div v-if="originalImage" class="ad-slot ad-inline">Google AdSense · 工具内广告位</div>
  </div>
</template>

<style scoped>
.upload-card {
  padding: 24px;
}

/* --- Editor --- */
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
}
.file-name {
  font-weight: 600;
  font-size: 0.9375rem;
}
.file-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* --- Editor Body --- */
.editor-body {
  padding: 20px 24px;
}
.instructions {
  margin-bottom: 16px;
}

/* --- Canvas --- */
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
}
.main-canvas {
  max-width: 100%;
  height: auto;
  display: block;
  box-shadow: var(--shadow-md);
  border-radius: 4px;
}

/* --- Controls --- */
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

/* --- Method Options --- */
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
  min-width: 100px;
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
}
.method-option.active .method-desc {
  color: var(--primary);
  opacity: 0.7;
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
  min-width: 30px;
}

.selection-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Tips Card --- */
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

/* --- AI Status --- */
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* --- AI Loading Overlay --- */
.canvas-container {
  position: relative;
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
@keyframes spin {
  to { transform: rotate(360deg); }
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
  .upload-card {
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
  .method-options {
    flex-direction: column;
  }
  .method-option {
    padding: 14px 16px;
    min-width: auto;
  }
  .method-name {
    font-size: 0.9375rem;
  }
  .method-desc {
    font-size: 0.75rem;
  }
  .tips-grid {
    grid-template-columns: 1fr;
  }
  .tips-card {
    padding: 16px;
  }
  .control-label {
    font-size: 0.9375rem;
  }
  .slider-row {
    gap: 16px;
  }
  .slider-value {
    font-size: 0.9375rem;
    min-width: 36px;
  }
  .selection-actions {
    flex-direction: column;
  }
  .selection-actions .btn {
    flex: 1;
    min-height: 48px;
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
    max-width: 180px;
  }
  .file-meta {
    font-size: 0.7rem;
  }
  .ai-status {
    font-size: 0.7rem;
    padding: 3px 8px;
  }
  .editor-body {
    padding: 8px;
  }
  .canvas-container {
    padding: 4px;
    min-height: 120px;
  }
  .main-canvas {
    border-radius: 2px;
  }
  .method-option {
    padding: 12px;
  }
  .tips-card {
    padding: 12px;
  }
  .tip-item {
    gap: 12px;
  }
  .tip-item strong {
    font-size: 0.875rem;
  }
  .tip-item p {
    font-size: 0.8125rem;
  }
  .ai-loading-text {
    font-size: 0.875rem;
  }
  .ai-loading-hint {
    font-size: 0.7rem;
  }
}
</style>
