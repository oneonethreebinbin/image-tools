<script setup>
import { ref, inject, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { I18N_KEY } from '../i18n'
import TipList from './TipList.vue'

const { t } = inject(I18N_KEY)
const router = useRouter()

const tips = computed(() => t('cropper.tips'))

const aspectRatios = computed(() => {
    const raw = t('cropper.aspectRatios')
    return Array.isArray(raw) ? raw : []
})

// State
const fileInput = ref(null)
const canvasRef = ref(null)
const previewCanvasRef = ref(null)
const imageLoaded = ref(false)
const originalImage = ref(null)
const fileName = ref('')
const aspectRatio = ref(0) // 0 = free
const rotation = ref(0) // 0, 90, 180, 270
const flipH = ref(false)
const flipV = ref(false)

// Crop box state (in image coordinates)
const cropBox = ref({ x: 0, y: 0, w: 0, h: 0 })

// Drag state
const isDragging = ref(false)
const dragType = ref('') // 'move', 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
const dragStart = ref({ x: 0, y: 0 })
const cropBoxStart = ref({ x: 0, y: 0, w: 0, h: 0 })

// Display scale
const displayScale = ref(1)
const displayOffset = ref({ x: 0, y: 0 })

// Cropped result
const croppedImage = ref(null)
const croppedFileName = ref('')

function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('image/')) {
        loadImage(file)
    }
}

function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
}

function handleFileChange(e) {
    const file = e.target?.files?.[0]
    if (file) {
        loadImage(file)
    }
}

function loadImage(file) {
    fileName.value = file.name || 'image'
    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
            originalImage.value = img
            imageLoaded.value = true
            rotation.value = 0
            flipH.value = false
            flipV.value = false
            croppedImage.value = null
            nextTick(() => {
                initCropBox()
                drawCanvas()
            })
        }
        img.src = e.target.result
    }
    reader.readAsDataURL(file)
}

function initCropBox() {
    if (!originalImage.value) return
    const img = originalImage.value
    const w = img.naturalWidth
    const h = img.naturalHeight

    if (aspectRatio.value > 0) {
        let cropW, cropH
        if (w / h > aspectRatio.value) {
            cropH = h * 0.8
            cropW = cropH * aspectRatio.value
        } else {
            cropW = w * 0.8
            cropH = cropW / aspectRatio.value
        }
        cropBox.value = {
            x: (w - cropW) / 2,
            y: (h - cropH) / 2,
            w: cropW,
            h: cropH,
        }
    } else {
        const margin = 0.1
        cropBox.value = {
            x: w * margin,
            y: h * margin,
            w: w * (1 - 2 * margin),
            h: h * (1 - 2 * margin),
        }
    }
}

function getTransformedDimensions() {
    if (!originalImage.value) return { w: 0, h: 0 }
    const w = originalImage.value.naturalWidth
    const h = originalImage.value.naturalHeight
    const isRotated = rotation.value === 90 || rotation.value === 270
    return {
        w: isRotated ? h : w,
        h: isRotated ? w : h,
    }
}

function drawCanvas() {
    const canvas = canvasRef.value
    if (!canvas || !originalImage.value) return

    const img = originalImage.value
    const tw = getTransformedDimensions()
    const container = canvas.parentElement
    const maxW = container ? container.clientWidth : 800

    const scale = Math.min(1, maxW / tw.w)
    canvas.width = tw.w * scale
    canvas.height = tw.h * scale
    displayScale.value = scale

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    if (flipH.value) ctx.scale(-1, 1)
    if (flipV.value) ctx.scale(1, -1)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()

    drawCropOverlay(ctx, scale)
}

function drawCropOverlay(ctx, scale) {
    const cb = cropBox.value
    const cw = canvasRef.value.width
    const ch = canvasRef.value.height

    // Dim area outside crop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(0, 0, cw, ch)

    // Clear crop area
    ctx.clearRect(cb.x * scale, cb.y * scale, cb.w * scale, cb.h * scale)

    // Re-draw image in crop area
    const img = originalImage.value
    ctx.save()
    ctx.translate(cw / 2, ch / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    if (flipH.value) ctx.scale(-1, 1)
    if (flipV.value) ctx.scale(1, -1)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()

    // Crop border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(cb.x * scale, cb.y * scale, cb.w * scale, cb.h * scale)

    // Rule of thirds lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 2; i++) {
        const lx = (cb.x + (cb.w * i) / 3) * scale
        const ly = (cb.y + (cb.h * i) / 3) * scale
        ctx.beginPath()
        ctx.moveTo(lx, cb.y * scale)
        ctx.lineTo(lx, (cb.y + cb.h) * scale)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cb.x * scale, ly)
        ctx.lineTo((cb.x + cb.w) * scale, ly)
        ctx.stroke()
    }

    // Corner handles
    const corners = [
        [cb.x, cb.y],
        [cb.x + cb.w, cb.y],
        [cb.x, cb.y + cb.h],
        [cb.x + cb.w, cb.y + cb.h],
    ]
    ctx.fillStyle = '#ffffff'
    for (const [cx, cy] of corners) {
        ctx.fillRect(cx * scale - 5, cy * scale - 5, 10, 10)
    }
}

function getHitType(mx, my) {
    const s = displayScale.value
    const cb = cropBox.value
    const x = mx / s
    const y = my / s
    const handleSize = 12 / s

    const corners = [
        { type: 'nw', x: cb.x, y: cb.y },
        { type: 'ne', x: cb.x + cb.w, y: cb.y },
        { type: 'sw', x: cb.x, y: cb.y + cb.h },
        { type: 'se', x: cb.x + cb.w, y: cb.y + cb.h },
    ]

    for (const c of corners) {
        if (Math.abs(x - c.x) < handleSize && Math.abs(y - c.y) < handleSize) {
            return c.type
        }
    }

    if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
        return 'move'
    }

    return ''
}

function onCanvasMouseDown(e) {
    const rect = canvasRef.value.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = getHitType(mx, my)

    if (hit) {
        isDragging.value = true
        dragType.value = hit
        dragStart.value = { x: mx, y: my }
        cropBoxStart.value = { ...cropBox.value }
        e.preventDefault()
    }
}

function onCanvasMouseMove(e) {
    if (!isDragging.value) {
        // Update cursor
        const rect = canvasRef.value.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const hit = getHitType(mx, my)
        if (hit === 'move') {
            canvasRef.value.style.cursor = 'move'
        } else if (hit) {
            canvasRef.value.style.cursor = hit === 'nw' || hit === 'se' ? 'nwse-resize' : hit === 'ne' || hit === 'sw' ? 'nesw-resize' : 'pointer'
        } else {
            canvasRef.value.style.cursor = 'default'
        }
        return
    }

    const rect = canvasRef.value.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const s = displayScale.value
    const dx = (mx - dragStart.value.x) / s
    const dy = (my - dragStart.value.y) / s

    const img = originalImage.value
    const maxW = img.naturalWidth
    const maxH = img.naturalHeight
    const bs = cropBoxStart.value

    if (dragType.value === 'move') {
        let nx = bs.x + dx
        let ny = bs.y + dy
        nx = Math.max(0, Math.min(maxW - bs.w, nx))
        ny = Math.max(0, Math.min(maxH - bs.h, ny))
        cropBox.value = { ...cropBox.value, x: nx, y: ny }
    } else {
        let { x: nx, y: ny, w: nw, h: nh } = bs

        if (dragType.value.includes('w')) {
            nx = Math.max(0, bs.x + dx)
            nw = bs.w - (nx - bs.x)
        }
        if (dragType.value.includes('e')) {
            nw = Math.min(maxW - nx, bs.w + dx)
        }
        if (dragType.value.includes('n')) {
            ny = Math.max(0, bs.y + dy)
            nh = bs.h - (ny - bs.y)
        }
        if (dragType.value.includes('s')) {
            nh = Math.min(maxH - ny, bs.h + dy)
        }

        // Enforce minimum size
        if (nw < 20) nw = 20
        if (nh < 20) nh = 20

        // Enforce aspect ratio
        if (aspectRatio.value > 0) {
            if (dragType.value === 'nw' || dragType.value === 'ne' || dragType.value === 'sw' || dragType.value === 'se') {
                const targetW = nh * aspectRatio.value
                const targetH = nw / aspectRatio.value
                if (targetW <= maxW - nx) {
                    nw = targetW
                } else {
                    nh = (maxW - nx) / aspectRatio.value
                }
                if (targetH <= maxH - ny) {
                    nh = targetH
                } else {
                    nw = (maxH - ny) * aspectRatio.value
                }
            } else if (dragType.value === 'n' || dragType.value === 's') {
                nw = nh * aspectRatio.value
                if (nx + nw > maxW) {
                    nw = maxW - nx
                    nh = nw / aspectRatio.value
                }
            } else if (dragType.value === 'w' || dragType.value === 'e') {
                nh = nw / aspectRatio.value
                if (ny + nh > maxH) {
                    nh = maxH - ny
                    nw = nh * aspectRatio.value
                }
            }
        }

        cropBox.value = { x: nx, y: ny, w: nw, h: nh }
    }

    drawCanvas()
}

function onCanvasMouseUp() {
    isDragging.value = false
    dragType.value = ''
}

function onAspectRatioChange(ratio) {
    aspectRatio.value = ratio
    if (imageLoaded.value) {
        initCropBox()
        drawCanvas()
    }
}

function doRotate(deg) {
    rotation.value = (rotation.value + deg + 360) % 360
    // Adjust crop box to fit after rotation
    if (imageLoaded.value) {
        initCropBox()
        drawCanvas()
    }
}

function doFlip(axis) {
    if (axis === 'h') flipH.value = !flipH.value
    else flipV.value = !flipV.value
    drawCanvas()
}

function doCrop() {
    if (!originalImage.value) return
    const img = originalImage.value
    const cb = cropBox.value

    const offCanvas = document.createElement('canvas')
    offCanvas.width = cb.w
    offCanvas.height = cb.h
    const ctx = offCanvas.getContext('2d')

    // Draw the transformed image, then crop
    const tempCanvas = document.createElement('canvas')
    const tw = getTransformedDimensions()
    tempCanvas.width = tw.w
    tempCanvas.height = tw.h
    const tctx = tempCanvas.getContext('2d')

    tctx.save()
    tctx.translate(tw.w / 2, tw.h / 2)
    tctx.rotate((rotation.value * Math.PI) / 180)
    if (flipH.value) tctx.scale(-1, 1)
    if (flipV.value) tctx.scale(1, -1)
    tctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    tctx.restore()

    ctx.drawImage(tempCanvas, cb.x, cb.y, cb.w, cb.h, 0, 0, cb.w, cb.h)

    croppedImage.value = offCanvas.toDataURL('image/png')
    const baseName = fileName.value.replace(/\.[^.]+$/, '')
    croppedFileName.value = `${baseName}_cropped.png`
}

function downloadCropped() {
    if (!croppedImage.value) return
    const a = document.createElement('a')
    a.href = croppedImage.value
    a.download = croppedFileName.value
    a.click()
}

function resetAll() {
    imageLoaded.value = false
    originalImage.value = null
    croppedImage.value = null
    fileName.value = ''
    rotation.value = 0
    flipH.value = false
    flipV.value = false
    aspectRatio.value = 0
    if (fileInput.value) fileInput.value.value = ''
}

function goBack() {
    router.push('/toolbox')
}

onBeforeUnmount(() => {
    document.removeEventListener('mousemove', onCanvasMouseMove)
    document.removeEventListener('mouseup', onCanvasMouseUp)
})
</script>

<template>
    <div class="cropper-page">
        <!-- Back button -->
        <button class="back-link" @click="goBack">{{ t('common.backToToolbox') }}</button>

        <div class="tool-header">
            <h1 class="tool-title">✂️ {{ t('cropper.crop') }}</h1>
        </div>

        <div class="cropper-layout" :class="{ 'has-sidebar': imageLoaded }">
            <!-- Main area -->
            <div class="cropper-main">
                <!-- Upload -->
                <div v-if="!imageLoaded" class="upload-area" @click="fileInput?.click()" @drop="handleDrop"
                    @dragover="handleDragOver">
                    <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileChange" />
                    <div class="upload-icon">📤</div>
                    <p class="upload-title">{{ t('cropper.uploadTitle') }}</p>
                    <p class="upload-hint">{{ t('cropper.formatHint') }}</p>
                </div>

                <!-- Canvas -->
                <div v-else class="canvas-wrap">
                    <canvas ref="canvasRef" @mousedown="onCanvasMouseDown" @mousemove="onCanvasMouseMove"
                        @mouseup="onCanvasMouseUp" @mouseleave="onCanvasMouseUp" class="crop-canvas"></canvas>
                </div>

                <!-- Cropped result -->
                <div v-if="croppedImage" class="cropped-result">
                    <h3 class="cropped-label">{{ t('cropper.preview') }}</h3>
                    <div class="cropped-img-wrap">
                        <img :src="croppedImage" class="cropped-img" />
                    </div>
                    <button class="btn btn-primary" @click="downloadCropped">
                        ⬇ {{ t('cropper.download') }}
                    </button>
                    <button class="btn btn-outline" @click="croppedImage = null">
                        {{ t('cropper.undo') }}
                    </button>
                </div>
            </div>

            <!-- Sidebar controls -->
            <div class="cropper-sidebar" v-if="imageLoaded">
                <div class="sidebar-card">
                    <!-- Aspect Ratio -->
                    <label class="field-label">{{ t('cropper.aspectRatio') }}</label>
                    <div class="ratio-grid">
                        <button v-for="r in aspectRatios" :key="r.label" class="ratio-btn"
                            :class="{ active: aspectRatio === r.value }" @click="onAspectRatioChange(r.value)">
                            {{ r.label }}
                        </button>
                    </div>

                    <!-- Rotate / Flip -->
                    <label class="field-label" style="margin-top: 16px;">{{ t('cropper.rotate') }}</label>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-outline" @click="doRotate(-90)">
                            ↶ {{ t('cropper.rotateLeft') }}
                        </button>
                        <button class="btn btn-sm btn-outline" @click="doRotate(90)">
                            ↷ {{ t('cropper.rotateRight') }}
                        </button>
                    </div>
                    <div class="action-btns" style="margin-top: 8px;">
                        <button class="btn btn-sm btn-outline" @click="doFlip('h')">
                            ⇆ {{ t('cropper.flipH') }}
                        </button>
                        <button class="btn btn-sm btn-outline" @click="doFlip('v')">
                            ⇅ {{ t('cropper.flipV') }}
                        </button>
                    </div>

                    <!-- Actions -->
                    <div class="sidebar-actions">
                        <button class="btn btn-primary" @click="doCrop">
                            ✂️ {{ t('cropper.crop') }}
                        </button>
                        <button class="btn btn-outline" @click="resetAll">
                            {{ t('cropper.reset') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tips below -->
        <TipList :title="t('cropper.tipsTitle')" :tips="tips" />
    </div>
</template>

<style scoped>
.cropper-page {
    padding-bottom: 48px;
}

.back-link {
    display: inline-block;
    margin-bottom: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-decoration: none;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
}

.back-link:hover {
    color: var(--primary);
}

.tool-header {
    margin-bottom: 20px;
}

.tool-title {
    font-size: 1.375rem;
    font-weight: 700;
}

.cropper-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.cropper-layout.has-sidebar {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    align-items: start;
}

.cropper-main {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.upload-area {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.upload-area:hover {
    border-color: var(--primary);
    background: var(--bg);
}

.upload-icon {
    font-size: 3rem;
    margin-bottom: 12px;
}

.upload-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
}

.upload-hint {
    font-size: 0.8125rem;
    color: var(--text-muted);
}

.canvas-wrap {
    display: flex;
    justify-content: center;
    background: #1a1a2e;
    border-radius: var(--radius);
    padding: 16px;
    overflow: hidden;
}

.crop-canvas {
    max-width: 100%;
    display: block;
}

.cropped-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.cropped-label {
    font-size: 1rem;
    font-weight: 700;
}

.cropped-img-wrap {
    max-width: 100%;
    overflow: hidden;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
}

.cropped-img {
    max-width: 100%;
    max-height: 400px;
    display: block;
    object-fit: contain;
}

.sidebar-card {
    background: var(--bg-card);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow);
}

.field-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 8px;
}

.ratio-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}

.ratio-btn {
    padding: 8px 4px;
    font-size: 0.8125rem;
    font-weight: 600;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: white;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
}

.ratio-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.ratio-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.action-btns {
    display: flex;
    gap: 8px;
}

.action-btns .btn {
    flex: 1;
}

.sidebar-actions {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sidebar-actions .btn {
    width: 100%;
}

@media (max-width: 768px) {
    .cropper-layout {
        grid-template-columns: 1fr;
    }

    .cropper-sidebar {
        order: -1;
    }
}
</style>