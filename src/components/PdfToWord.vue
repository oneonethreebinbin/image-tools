<script setup>
import { ref, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { I18N_KEY } from '../i18n'
import TipList from './TipList.vue'
import * as pdfjsLib from 'pdfjs-dist'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href

const { t } = inject(I18N_KEY)
const router = useRouter()

const tips = computed(() => t('pdfToWord.tips'))

// State
const fileInput = ref(null)
const fileLoaded = ref(false)
const fileName = ref('')
const fileSize = ref(0)
const pageCount = ref(0)
const converting = ref(false)
const converted = ref(false)
const progress = ref('')

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
    if (file && file.type === 'application/pdf') {
        loadFile(file)
    }
}

function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
}

function handleFileChange(e) {
    const file = e.target?.files?.[0]
    if (file) {
        loadFile(file)
    }
}

async function loadFile(file) {
    fileName.value = file.name || 'document.pdf'
    fileSize.value = file.size
    fileLoaded.value = true
    converted.value = false
    progress.value = ''

    // Get page count
    try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        pageCount.value = pdf.numPages
        // Store the file for later use
        fileLoaded.value = true
    } catch (err) {
        console.error('Failed to read PDF:', err)
        fileLoaded.value = false
    }
}

async function doConvert() {
    converting.value = true
    progress.value = t('pdfToWord.progress.reading')
    converted.value = false

    try {
        // Re-read the file
        const inputEl = fileInput.value
        const file = inputEl?.files?.[0]
        if (!file) return

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

        const paragraphs = []

        for (let i = 1; i <= pdf.numPages; i++) {
            progress.value = t('pdfToWord.progress.extracting', { current: i, total: pdf.numPages })

            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()

            let lastY = null
            let lineTexts = []

            for (const item of textContent.items) {
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    // New line
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: lineTexts.join(' '),
                                    size: 24,
                                }),
                            ],
                        })
                    )
                    lineTexts = []
                }
                lineTexts.push(item.str)
                lastY = item.transform[5]
            }

            // Push remaining text
            if (lineTexts.length > 0) {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: lineTexts.join(' '),
                                size: 24,
                            }),
                        ],
                    })
                )
            }

            // Add page break (except for last page)
            if (i < pdf.numPages) {
                paragraphs.push(
                    new Paragraph({
                        children: [],
                        pageBreakBefore: true,
                    })
                )
            }
        }

        progress.value = t('pdfToWord.progress.generating')

        const doc = new Document({
            sections: [
                {
                    children: paragraphs,
                },
            ],
        })

        const blob = await Packer.toBlob(doc)
        const baseName = fileName.value.replace(/\.pdf$/i, '')
        saveAs(blob, `${baseName}.docx`)

        converted.value = true
        progress.value = ''
    } catch (err) {
        console.error('Conversion failed:', err)
        progress.value = t('pdfToWord.progress.error')
    } finally {
        converting.value = false
    }
}

function resetAll() {
    fileLoaded.value = false
    fileName.value = ''
    fileSize.value = 0
    pageCount.value = 0
    converting.value = false
    converted.value = false
    progress.value = ''
    if (fileInput.value) fileInput.value.value = ''
}

function goBack() {
    router.push('/toolbox')
}
</script>

<template>
    <div class="pdf-tool-page">
        <button class="back-link" @click="goBack">← {{ t('common.backToToolbox') }}</button>

        <div class="tool-header">
            <h1 class="tool-title">📄 {{ t('pdfToWord.title') }}</h1>
        </div>

        <div class="pdf-tool-layout" :class="{ 'has-sidebar': fileLoaded }">
            <div class="pdf-tool-main">
                <!-- Upload -->
                <div v-if="!fileLoaded" class="upload-area" @click="fileInput?.click()" @drop="handleDrop"
                    @dragover="handleDragOver">
                    <input ref="fileInput" type="file" accept="application/pdf" hidden @change="handleFileChange" />
                    <div class="upload-icon">📤</div>
                    <p class="upload-title">{{ t('pdfToWord.uploadTitle') }}</p>
                    <p class="upload-hint">{{ t('pdfToWord.formatHint') }}</p>
                </div>

                <!-- File Info -->
                <div v-if="fileLoaded" class="file-info-card">
                    <div class="file-icon">📑</div>
                    <div class="file-details">
                        <p class="file-name">{{ fileName }}</p>
                        <p class="file-meta">{{ formatFileSize(fileSize) }} · {{ pageCount }} {{ t('pdfToWord.pages') }}
                        </p>
                    </div>
                </div>

                <!-- Success Message -->
                <div v-if="converted" class="success-card">
                    <div class="success-icon">✅</div>
                    <p class="success-text">{{ t('pdfToWord.success') }}</p>
                    <button class="btn btn-outline" @click="resetAll">{{ t('pdfToWord.convertAnother') }}</button>
                </div>

                <!-- Progress -->
                <div v-if="converting" class="progress-card">
                    <div class="spinner"></div>
                    <p class="progress-text">{{ progress }}</p>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="pdf-tool-sidebar" v-if="fileLoaded">
                <div class="sidebar-card">
                    <label class="field-label">{{ t('pdfToWord.settings') }}</label>
                    <p class="setting-desc">{{ t('pdfToWord.settingDesc') }}</p>

                    <div class="sidebar-actions">
                        <button class="btn btn-primary" @click="doConvert" :disabled="converting || converted">
                            {{ converting ? t('pdfToWord.converting') : '📄 ' + t('pdfToWord.convert') }}
                        </button>
                        <button class="btn btn-outline" @click="resetAll" :disabled="converting">
                            {{ t('pdfToWord.reset') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <TipList :title="t('pdfToWord.tipsTitle')" :tips="tips" />
    </div>
</template>

<style scoped>
.pdf-tool-page {
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

.pdf-tool-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.pdf-tool-layout.has-sidebar {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
}

.pdf-tool-main {
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

.file-info-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.file-icon {
    font-size: 2.5rem;
}

.file-details {
    flex: 1;
}

.file-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
}

.file-meta {
    font-size: 0.8125rem;
    color: var(--text-secondary);
}

.success-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
    background: rgba(34, 197, 94, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: var(--radius);
}

.success-icon {
    font-size: 2.5rem;
}

.success-text {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
}

.progress-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.progress-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
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

.setting-desc {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
}

.sidebar-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sidebar-actions .btn {
    width: 100%;
}

@media (max-width: 768px) {
    .pdf-tool-layout {
        grid-template-columns: 1fr;
    }

    .pdf-tool-sidebar {
        order: -1;
    }
}
</style>