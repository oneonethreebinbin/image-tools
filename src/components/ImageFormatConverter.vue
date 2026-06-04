<script setup>
import { ref, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { I18N_KEY } from '../i18n'
import TipList from './TipList.vue'

const { t } = inject(I18N_KEY)
const router = useRouter()

const tips = computed(() => t('converter.tips'))

const formats = ['png', 'jpeg', 'webp', 'bmp', 'ico']
const qualityPresets = [
    { label: '50%', value: 0.5 },
    { label: '80%', value: 0.8 },
    { label: '90%', value: 0.9 },
    { label: '100%', value: 1 },
]

// State
const fileInput = ref(null)
const imageLoaded = ref(false)
const originalImage = ref(null)
const originalFileName = ref('')
const originalFormat = ref('')
const originalSize = ref(0)
const outputFormat = ref('png')
const outputQuality = ref(0.8)
const converting = ref(false)

// Result
const resultImage = ref(null)
const resultSize = ref(0)
const resultFileName = ref('')

const canAdjustQuality = computed(() => {
    return outputFormat.value === 'jpeg' || outputFormat.value === 'webp'
})

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

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
    originalFileName.value = file.name || 'image'
    originalSize.value = file.size
    originalFormat.value = file.type.split('/')[1] || 'png'

    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
            originalImage.value = img
            imageLoaded.value = true
            resultImage.value = null
            resultSize.value = 0
        }
        img.src = e.target.result
    }
    reader.readAsDataURL(file)
}

async function doConvert() {
    if (!originalImage.value) return

    converting.value = true

    // Use requestAnimationFrame to allow UI to update
    await new Promise((resolve) => requestAnimationFrame(resolve))

    try {
        const img = originalImage.value
        const canvas = document.createElement('canvas')

        if (outputFormat.value === 'ico') {
            // ICO: generate 16x16, 32x32, 48x48 sizes
            canvas.width = 32
            canvas.height = 32
        } else {
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
        }

        const ctx = canvas.getContext('2d')

        // For ICO, draw scaled
        if (outputFormat.value === 'ico') {
            ctx.drawImage(img, 0, 0, 32, 32)
        } else {
            ctx.drawImage(img, 0, 0)
        }

        const mimeType = `image/${outputFormat.value}`
        const quality = canAdjustQuality.value ? outputQuality.value : undefined

        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, mimeType, quality)
        })

        if (blob) {
            const url = URL.createObjectURL(blob)
            resultImage.value = url
            resultSize.value = blob.size

            const baseName = originalFileName.value.replace(/\.[^.]+$/, '')
            resultFileName.value = `${baseName}.${outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value}`
        }
    } catch (err) {
        console.error('Conversion failed:', err)
    } finally {
        converting.value = false
    }
}

function downloadResult() {
    if (!resultImage.value) return
    const a = document.createElement('a')
    a.href = resultImage.value
    a.download = resultFileName.value
    a.click()
}

function resetAll() {
    imageLoaded.value = false
    originalImage.value = null
    originalFileName.value = ''
    originalFormat.value = ''
    originalSize.value = 0
    resultImage.value = null
    resultSize.value = 0
    resultFileName.value = ''
    if (fileInput.value) fileInput.value.value = ''
}

function goBack() {
    router.push('/toolbox')
}
</script>

<template>
    <div class="converter-page">
        <button class="back-link" @click="goBack">{{ t('common.backToToolbox') }}</button>

        <div class="tool-header">
            <h1 class="tool-title">🔄 {{ t('converter.convert') }}</h1>
        </div>

        <div class="converter-layout" :class="{ 'has-sidebar': imageLoaded }">
            <div class="converter-main">
                <!-- Upload -->
                <div v-if="!imageLoaded" class="upload-area" @click="fileInput?.click()" @drop="handleDrop"
                    @dragover="handleDragOver">
                    <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileChange" />
                    <div class="upload-icon">📤</div>
                    <p class="upload-title">{{ t('converter.uploadTitle') }}</p>
                    <p class="upload-hint">{{ t('converter.formatHint') }}</p>
                </div>

                <!-- Preview -->
                <div v-if="imageLoaded && !resultImage" class="preview-area">
                    <div class="preview-card">
                        <div class="preview-img-wrap">
                            <img :src="originalImage?.src" class="preview-img" />
                        </div>
                        <div class="preview-info">
                            <span class="preview-label">{{ t('compressor.original') }}</span>
                            <span class="preview-size">{{ formatFileSize(originalSize) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Result -->
                <div v-if="resultImage" class="preview-area">
                    <div class="preview-card">
                        <div class="preview-img-wrap">
                            <img :src="resultImage" class="preview-img" />
                        </div>
                        <div class="preview-info">
                            <span class="preview-label">{{ t('converter.preview') }}</span>
                            <span class="preview-size">{{ formatFileSize(resultSize) }}</span>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-primary" @click="downloadResult">
                            ⬇ {{ t('converter.download', { format: outputFormat.toUpperCase() }) }}
                        </button>
                        <button class="btn btn-outline" @click="resetAll">
                            {{ t('converter.reset') }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="converter-sidebar" v-if="imageLoaded">
                <div class="sidebar-card">
                    <!-- Output Format -->
                    <label class="field-label">{{ t('converter.outputFormat') }}</label>
                    <div class="format-list">
                        <label v-for="fmt in formats" :key="fmt" class="format-option"
                            :class="{ active: outputFormat === fmt }">
                            <input type="radio" :value="fmt" v-model="outputFormat" class="format-radio" />
                            <span class="format-name">{{ t(`converter.formats.${fmt}`) }}</span>
                        </label>
                    </div>

                    <!-- Quality -->
                    <div v-if="canAdjustQuality" class="quality-section">
                        <label class="field-label">{{ t('converter.quality') }}</label>
                        <div class="quality-presets">
                            <button v-for="q in qualityPresets" :key="q.value" class="quality-btn"
                                :class="{ active: outputQuality === q.value }" @click="outputQuality = q.value">
                                {{ q.label }}
                            </button>
                        </div>
                        <input type="range" min="0.1" max="1" step="0.05" v-model.number="outputQuality"
                            class="quality-slider" />
                        <p class="quality-hint">{{ t('converter.qualityHint') }}</p>
                    </div>

                    <!-- Actions -->
                    <div class="sidebar-actions">
                        <button class="btn btn-primary" @click="doConvert" :disabled="converting">
                            {{ converting ? t('converter.converting') : '🔄 ' + t('converter.convert') }}
                        </button>
                        <button class="btn btn-outline" @click="resetAll">
                            {{ t('converter.reset') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tips below -->
        <TipList :title="t('converter.tipsTitle')" :tips="tips" />
    </div>
</template>

<style scoped>
.converter-page {
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

.converter-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.converter-layout.has-sidebar {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
}

.converter-main {
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

.preview-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.preview-card {
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}

.preview-img-wrap {
    display: flex;
    justify-content: center;
    padding: 16px;
    background: var(--bg);
}

.preview-img {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    display: block;
}

.preview-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    font-size: 0.8125rem;
}

.preview-label {
    font-weight: 600;
    color: var(--text);
}

.preview-size {
    color: var(--text-secondary);
}

.result-actions {
    display: flex;
    gap: 12px;
    width: 100%;
}

.result-actions .btn {
    flex: 1;
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
    margin-bottom: 10px;
}

.format-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.format-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.15s ease;
    background: white;
}

.format-option:hover {
    border-color: var(--primary);
}

.format-option.active {
    border-color: var(--primary);
    background: rgba(99, 102, 241, 0.05);
}

.format-radio {
    accent-color: var(--primary);
}

.format-name {
    font-size: 0.8125rem;
    color: var(--text);
    font-weight: 500;
}

.quality-section {
    margin-top: 16px;
}

.quality-presets {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
}

.quality-btn {
    flex: 1;
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

.quality-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.quality-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.quality-slider {
    width: 100%;
    accent-color: var(--primary);
}

.quality-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 6px;
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
    .converter-layout {
        grid-template-columns: 1fr;
    }

    .converter-sidebar {
        order: -1;
    }
}
</style>