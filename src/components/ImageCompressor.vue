<script setup>
import { ref, computed, watch } from 'vue'

// --- State ---
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

// --- Computed ---
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

// --- Watch quality changes to auto-recompress ---
watch([quality, outputFormat, maxWidth, maxHeight], () => {
  if (originalImage.value) {
    compressImage()
  }
}, { debounce: 300 })

// --- Helpers ---
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function getFormatLabel(format) {
  const labels = { jpeg: 'JPEG', webp: 'WebP', png: 'PNG' }
  return labels[format] || format.toUpperCase()
}

// --- File Handling ---
function handleFile(file) {
  error.value = ''
  if (!file || !file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  originalImage.value = file
  originalSize.value = file.size
  originalFormat.value = file.type.split('/')[1].toUpperCase()

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalDimensions.value = `${img.naturalWidth} × ${img.naturalHeight}`
      previewUrl.value = e.target.result
      // Draw original on preview canvas
      if (originalCanvasRef.value) {
        const canvas = originalCanvasRef.value
        const ctx = canvas.getContext('2d')
        const scale = Math.min(400 / img.naturalWidth, 300 / img.naturalHeight, 1)
        canvas.width = img.naturalWidth * scale
        canvas.height = img.naturalHeight * scale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      compressImage()
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

// --- Compression ---
function compressImage() {
  if (!originalImage.value) return

  isProcessing.value = true
  error.value = ''

  const img = new Image()
  img.onload = () => {
    const canvas = canvasRef.value
    if (!canvas) return

    let w = img.naturalWidth
    let h = img.naturalHeight

    // Apply max dimension constraints
    if (maxWidth.value > 0 && w > maxWidth.value) {
      h = Math.round(h * (maxWidth.value / w))
      w = maxWidth.value
    }
    if (maxHeight.value > 0 && h > maxHeight.value) {
      w = Math.round(w * (maxHeight.value / h))
      h = maxHeight.value
    }

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)

    const mimeType = outputFormat.value === 'jpeg' ? 'image/jpeg' :
                     outputFormat.value === 'webp' ? 'image/webp' : 'image/png'

    const q = outputFormat.value === 'png' ? undefined : quality.value

    canvas.toBlob((blob) => {
      if (blob) {
        compressedBlob.value = blob
        compressedSize.value = blob.size
        if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
        compressedUrl.value = URL.createObjectURL(blob)
      }
      isProcessing.value = false
    }, mimeType, q)
  }
  img.onerror = () => {
    error.value = '图片加载失败，请重试'
    isProcessing.value = false
  }
  img.src = previewUrl.value
}

// --- Download ---
function download() {
  if (!compressedUrl.value) return
  const a = document.createElement('a')
  a.href = compressedUrl.value
  a.download = compressedFileName.value
  a.click()
}

// --- Reset ---
function reset() {
  originalImage.value = null
  originalSize.value = 0
  originalDimensions.value = ''
  previewUrl.value = ''
  compressedBlob.value = null
  compressedSize.value = 0
  if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
  compressedUrl.value = ''
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// --- Preset qualities ---
const presets = [
  { label: '极致压缩', quality: 0.3, desc: '体积最小' },
  { label: '推荐', quality: 0.8, desc: '质量与大小平衡' },
  { label: '无损', quality: 1.0, desc: '最佳质量' },
]
</script>

<template>
  <div class="compressor">
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
        <span class="drop-zone-icon">📁</span>
        <p class="drop-zone-title">拖拽图片到这里，或点击上传</p>
        <p class="drop-zone-hint">支持 JPEG · PNG · WebP · BMP · GIF · SVG</p>
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
          <span class="file-meta">{{ originalDimensions }} · {{ originalFormat.value }} · {{ formatSize(originalSize) }}</span>
        </div>
        <button class="btn btn-secondary btn-sm" @click="reset">重新上传</button>
      </div>

      <div class="editor-body">
        <!-- Previews -->
        <div class="previews">
          <div class="preview-panel">
            <div class="preview-label">
              <span class="size-badge original">原始 {{ formatSize(originalSize) }}</span>
            </div>
            <div class="preview-image-wrapper">
              <canvas ref="originalCanvasRef" class="preview-canvas"></canvas>
            </div>
          </div>

          <div class="preview-arrow">
            <span v-if="compressionRatio > 0" class="ratio-badge">
              -{{ compressionRatio }}%
            </span>
            <span v-else class="ratio-arrow">→</span>
          </div>

          <div class="preview-panel">
            <div class="preview-label">
              <span class="size-badge compressed" v-if="compressedSize">
                压缩后 {{ formatSize(compressedSize) }}
              </span>
              <span class="size-badge compressed" v-else>处理中...</span>
            </div>
            <div class="preview-image-wrapper">
              <canvas ref="canvasRef" class="preview-canvas" style="display:none;"></canvas>
              <img v-if="compressedUrl" :src="compressedUrl" class="preview-img" alt="压缩预览" />
              <div v-else class="preview-placeholder">处理中...</div>
              <!-- 绝对定位的处理遮罩，不参与文档流 -->
              <div v-if="isProcessing" class="preview-processing-overlay">
                <span class="mini-spinner"></span>
                压缩中...
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls">
          <!-- Quality Presets -->
          <div class="control-group">
            <label class="control-label">压缩质量</label>
            <div class="preset-buttons">
              <button
                v-for="preset in presets"
                :key="preset.quality"
                class="preset-btn"
                :class="{ active: quality === preset.quality }"
                @click="quality = preset.quality"
              >
                <span class="preset-name">{{ preset.label }}</span>
                <span class="preset-desc">{{ preset.desc }}</span>
              </button>
            </div>
            <div class="slider-row">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                v-model.number="quality"
              />
              <span class="slider-value">{{ Math.round(quality * 100) }}%</span>
            </div>
          </div>

          <!-- Format Selector -->
          <div class="control-group">
            <label class="control-label">输出格式</label>
            <select v-model="outputFormat">
              <option value="jpeg">JPEG（通用，体积小）</option>
              <option value="webp">WebP（最优压缩，推荐）</option>
              <option value="png">PNG（无损，支持透明）</option>
            </select>
            <p class="control-hint" v-if="outputFormat === 'png'">PNG 为无损格式，压缩质量设置不生效</p>
          </div>

          <!-- Dimensions -->
          <div class="control-group">
            <label class="control-label">最大尺寸（可选，0 表示不限制）</label>
            <div class="dimension-inputs">
              <input
                type="number"
                v-model.number="maxWidth"
                placeholder="宽度 (px)"
                min="0"
                class="dim-input"
              />
              <span class="dim-sep">×</span>
              <input
                type="number"
                v-model.number="maxHeight"
                placeholder="高度 (px)"
                min="0"
                class="dim-input"
              />
            </div>
          </div>

          <!-- Download -->
          <button
            class="btn btn-success btn-download"
            :disabled="!compressedUrl"
            @click="download"
          >
            ⬇ 下载压缩图片 ({{ compressedSize ? formatSize(compressedSize) : '...' }})
          </button>
        </div>
      </div>
    </div>

    <!-- Ad Inline (inside tool) -->
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

/* --- Editor Body --- */
.editor-body {
  padding: 24px;
}

/* --- Previews --- */
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
  /* Prevent layout shift during image src swap */
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

/* --- Processing overlay (absolute, never affects layout) --- */
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
  to { transform: rotate(360deg); }
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

/* --- Controls --- */
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

/* --- Presets --- */
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
  opacity: 0.7;
}

/* --- Slider --- */
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

/* --- Dimensions --- */
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

/* --- Download --- */
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
  .ratio-badge {
    font-size: 0.8125rem;
    padding: 6px 12px;
  }
  .preset-buttons {
    flex-direction: column;
  }
  .preset-btn {
    padding: 14px 16px;
    min-width: auto;
  }
  .preset-name {
    font-size: 0.9375rem;
  }
  .preset-desc {
    font-size: 0.75rem;
  }
  .control-label {
    font-size: 0.9375rem;
  }
  .dimension-inputs {
    gap: 12px;
  }
  .dim-input {
    min-width: auto;
    padding: 10px 12px;
    min-height: 44px;
  }
  .btn-download {
    padding: 14px 24px;
    font-size: 0.9375rem;
    min-height: 50px;
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
  .preset-btn {
    padding: 12px;
  }
  .dimension-inputs {
    flex-direction: column;
    gap: 8px;
  }
  .dim-input {
    width: 100%;
  }
  .btn-download {
    padding: 12px 20px;
    font-size: 0.9375rem;
  }
}
</style>
