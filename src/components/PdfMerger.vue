<script setup>
import { ref, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { I18N_KEY } from '../i18n'
import TipList from './TipList.vue'
import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'

const { t } = inject(I18N_KEY)
const router = useRouter()

const tips = computed(() => t('pdfMerger.tips'))

// State
const fileInput = ref(null)
const files = ref([])
const merging = ref(false)
const merged = ref(false)
const mergedBlob = ref(null)
const mergedFileName = ref('')

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const totalSize = computed(() => {
    return files.value.reduce((sum, f) => sum + f.size, 0)
})

const totalPages = computed(() => {
    return files.value.reduce((sum, f) => sum + (f.pageCount || 0), 0)
})

function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    const droppedFiles = Array.from(e.dataTransfer?.files || [])
    addFiles(droppedFiles)
}

function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
}

function handleFileChange(e) {
    const selectedFiles = Array.from(e.target?.files || [])
    addFiles(selectedFiles)
    if (fileInput.value) fileInput.value.value = ''
}

async function addFiles(newFiles) {
    for (const file of newFiles) {
        if (file.type === 'application/pdf') {
            try {
                const arrayBuffer = await file.arrayBuffer()
                const pdf = await PDFDocument.load(arrayBuffer)
                files.value.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    pageCount: pdf.getPageCount(),
                    arrayBuffer: arrayBuffer,
                })
            } catch (err) {
                console.error('Failed to read PDF:', file.name, err)
            }
        }
    }
    merged.value = false
    mergedBlob.value = null
}

function removeFile(id) {
    files.value = files.value.filter((f) => f.id !== id)
    if (files.value.length === 0) {
        merged.value = false
        mergedBlob.value = null
    }
}

function moveUp(index) {
    if (index === 0) return
    const temp = files.value[index]
    files.value[index] = files.value[index - 1]
    files.value[index - 1] = temp
}

function moveDown(index) {
    if (index === files.value.length - 1) return
    const temp = files.value[index]
    files.value[index] = files.value[index + 1]
    files.value[index + 1] = temp
}

async function doMerge() {
    if (files.value.length < 2) return

    merging.value = true
    merged.value = false

    try {
        const mergedPdf = await PDFDocument.create()

        for (const file of files.value) {
            const pdf = await PDFDocument.load(file.arrayBuffer)
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
            for (const page of copiedPages) {
                mergedPdf.addPage(page)
            }
        }

        const mergedPdfBytes = await mergedPdf.save()
        mergedBlob.value = new Blob([mergedPdfBytes], { type: 'application/pdf' })
        merged.value = true
    } catch (err) {
        console.error('Merge failed:', err)
    } finally {
        merging.value = false
    }
}

function downloadResult() {
    if (!mergedBlob.value) return
    const timestamp = new Date().toISOString().slice(0, 10)
    saveAs(mergedBlob.value, `merged_${timestamp}.pdf`)
}

function resetAll() {
    files.value = []
    merged.value = false
    mergedBlob.value = null
    mergedFileName.value = ''
    if (fileInput.value) fileInput.value.value = ''
}

function goBack() {
    router.push('/toolbox')
}
</script>

<template>
    <div class="pdf-tool-page">
        <button class="back-link" @click="goBack">{{ t('common.backToToolbox') }}</button>

        <div class="tool-header">
            <h1 class="tool-title">📑 {{ t('pdfMerger.title') }}</h1>
        </div>

        <div class="pdf-tool-layout" :class="{ 'has-sidebar': files.length > 0 }">
            <div class="pdf-tool-main">
                <!-- Upload -->
                <div class="upload-area" @click="fileInput?.click()" @drop="handleDrop" @dragover="handleDragOver">
                    <input ref="fileInput" type="file" accept="application/pdf" multiple hidden
                        @change="handleFileChange" />
                    <div class="upload-icon">📤</div>
                    <p class="upload-title">{{ t('pdfMerger.uploadTitle') }}</p>
                    <p class="upload-hint">{{ t('pdfMerger.formatHint') }}</p>
                </div>

                <!-- File List -->
                <div v-if="files.length > 0" class="file-list">
                    <div v-for="(file, index) in files" :key="file.id" class="file-item">
                        <div class="file-item-icon">📄</div>
                        <div class="file-item-info">
                            <p class="file-item-name">{{ file.name }}</p>
                            <p class="file-item-meta">{{ formatFileSize(file.size) }} · {{ file.pageCount }}
                                {{ t('pdfToWord.pages') }}</p>
                        </div>
                        <div class="file-item-actions">
                            <button class="icon-btn" @click="moveUp(index)" :disabled="index === 0"
                                :title="t('pdfMerger.moveUp')">↑</button>
                            <button class="icon-btn" @click="moveDown(index)" :disabled="index === files.length - 1"
                                :title="t('pdfMerger.moveDown')">↓</button>
                            <button class="icon-btn icon-btn-danger" @click="removeFile(file.id)"
                                :title="t('pdfMerger.remove')">✕</button>
                        </div>
                    </div>
                </div>

                <!-- Success -->
                <div v-if="merged" class="success-card">
                    <div class="success-icon">✅</div>
                    <p class="success-text">{{ t('pdfMerger.success', { count: files.length }) }}</p>
                    <div class="success-actions">
                        <button class="btn btn-primary" @click="downloadResult">
                            ⬇ {{ t('pdfMerger.download') }}
                        </button>
                        <button class="btn btn-outline" @click="resetAll">{{ t('pdfMerger.reset') }}</button>
                    </div>
                </div>

                <!-- Progress -->
                <div v-if="merging" class="progress-card">
                    <div class="spinner"></div>
                    <p class="progress-text">{{ t('pdfMerger.merging') }}</p>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="pdf-tool-sidebar" v-if="files.length > 0">
                <div class="sidebar-card">
                    <label class="field-label">{{ t('pdfMerger.summary') }}</label>
                    <div class="summary-list">
                        <div class="summary-item">
                            <span class="summary-label">{{ t('pdfMerger.fileCount') }}</span>
                            <span class="summary-value">{{ files.length }}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">{{ t('pdfMerger.totalPages') }}</span>
                            <span class="summary-value">{{ totalPages }}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">{{ t('pdfMerger.totalSize') }}</span>
                            <span class="summary-value">{{ formatFileSize(totalSize) }}</span>
                        </div>
                    </div>

                    <div class="sidebar-actions">
                        <button class="btn btn-primary" @click="doMerge"
                            :disabled="files.length < 2 || merging || merged">
                            {{ merging ? t('pdfMerger.merging') : '📑 ' + t('pdfMerger.merge') }}
                        </button>
                        <button class="btn btn-outline" @click="resetAll" :disabled="merging">
                            {{ t('pdfMerger.reset') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <TipList :title="t('pdfMerger.tipsTitle')" :tips="tips" />
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

.file-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: border-color 0.15s ease;
}

.file-item:hover {
    border-color: var(--primary);
}

.file-item-icon {
    font-size: 1.5rem;
}

.file-item-info {
    flex: 1;
    min-width: 0;
}

.file-item-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-item-meta {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 2px;
}

.file-item-actions {
    display: flex;
    gap: 4px;
}

.icon-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: white;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.15s ease;
}

.icon-btn:hover:not(:disabled) {
    border-color: var(--primary);
    color: var(--primary);
}

.icon-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.icon-btn-danger:hover:not(:disabled) {
    border-color: #ef4444;
    color: #ef4444;
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

.success-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 400px;
}

.success-actions .btn {
    flex: 1;
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

.summary-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8125rem;
}

.summary-label {
    color: var(--text-secondary);
}

.summary-value {
    font-weight: 600;
    color: var(--text);
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