<script setup>
import { inject, ref, computed, onBeforeUnmount, nextTick, watch } from 'vue'
import { I18N_KEY } from '../i18n'
import AdSenseSlot from './AdSenseSlot.vue'
import {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, TableCell, TableRow, Table, WidthType, ImageRun,
    BorderStyle
} from 'docx'
import { saveAs } from 'file-saver'
import { marked } from 'marked'
import mermaid from 'mermaid'

const { t } = inject(I18N_KEY)

const markdownInput = ref('')
const isProcessing = ref(false)
const error = ref('')
const fileName = ref('converted')
const conversionMode = ref('md-to-word') // 'md-to-word' or 'word-to-md'

// Editor refs for sync scroll
const textareaRef = ref(null)
const previewRef = ref(null)
let syncScrollEnabled = true

function onEditorScroll() {
    if (!syncScrollEnabled || !textareaRef.value || !previewRef.value) return
    const el = textareaRef.value
    const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1)
    const previewEl = previewRef.value
    previewEl.scrollTop = ratio * (previewEl.scrollHeight - previewEl.clientHeight || 1)
}

function onPreviewScroll() {
    if (!syncScrollEnabled || !textareaRef.value || !previewRef.value) return
    const el = previewRef.value
    const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1)
    const textareaEl = textareaRef.value
    textareaEl.scrollTop = ratio * (textareaEl.scrollHeight - textareaEl.clientHeight || 1)
}

onBeforeUnmount(() => {
    syncScrollEnabled = false
})

// Word to Markdown
const wordFile = ref(null)
const wordFileName = ref('')
const extractedText = ref('')
const extractedMarkdown = ref('')
const isWordProcessing = ref(false)
const wordError = ref('')
const wordFileInput = ref(null)

const toolAdSlot = import.meta.env.VITE_ADSENSE_SLOT_TOOL || import.meta.env.VITE_ADSENSE_SLOT_INLINE || ''

// Initialize mermaid
let mermaidIdCounter = 0
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
})

// Track rendered mermaid elements
const renderedMermaidIds = new Set()

async function renderMermaidElements() {
    await nextTick()
    const containers = document.querySelectorAll('.mermaid-container[data-processed="false"]')
    for (const container of containers) {
        const code = container.querySelector('code')
        if (!code) continue
        const id = `mermaid-${++mermaidIdCounter}`
        try {
            const { svg } = await mermaid.render(id, code.textContent)
            container.innerHTML = svg
            container.setAttribute('data-processed', 'true')
        } catch (e) {
            console.error('Mermaid render error:', e)
            container.innerHTML = `<pre style="color:red;">Mermaid Error: ${e.message}</pre>`
            container.setAttribute('data-processed', 'true')
        }
    }
}

const hasMarkdown = computed(() => markdownInput.value.trim().length > 0)
const htmlPreview = computed(() => {
    if (!markdownInput.value.trim()) return ''
    try {
        return marked.parse(markdownInput.value)
    } catch {
        return ''
    }
})

// Watch for HTML preview changes to render Mermaid diagrams
watch(htmlPreview, async () => {
    await nextTick()
    await renderMermaidElements()
})

// Configure marked for better parsing with mermaid support
const renderer = new marked.Renderer()
const originalCodeRenderer = renderer.code.bind(renderer)

renderer.code = function ({ text, lang }) {
    if (lang === 'mermaid') {
        return `<div class="mermaid-container" data-processed="false"><code>${text}</code></div>`
    }
    return originalCodeRenderer({ text, lang })
}

marked.setOptions({
    gfm: true,
    breaks: true,
    renderer: renderer,
})

// Parse markdown heading level
function getHeadingLevel(token) {
    const map = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
    }
    return map[token.depth] || HeadingLevel.HEADING_1
}

// Create TextRun from inline tokens with nested formatting support
function createTextRuns(tokens, overrides = {}) {
    if (!tokens) return [new TextRun({ text: '', ...overrides })]
    const runs = []
    for (const token of tokens) {
        if (token.type === 'text') {
            runs.push(new TextRun({ text: token.text, font: 'Arial', ...overrides }))
        } else if (token.type === 'strong') {
            if (token.tokens && token.tokens.length > 0) {
                runs.push(...createTextRuns(token.tokens, { ...overrides, bold: true }))
            } else {
                runs.push(new TextRun({ text: token.text, bold: true, font: 'Arial', ...overrides }))
            }
        } else if (token.type === 'em') {
            if (token.tokens && token.tokens.length > 0) {
                runs.push(...createTextRuns(token.tokens, { ...overrides, italics: true }))
            } else {
                runs.push(new TextRun({ text: token.text, italics: true, font: 'Arial', ...overrides }))
            }
        } else if (token.type === 'del') {
            if (token.tokens && token.tokens.length > 0) {
                runs.push(...createTextRuns(token.tokens, { ...overrides, strike: true }))
            } else {
                runs.push(new TextRun({ text: token.text, strike: true, font: 'Arial', ...overrides }))
            }
        } else if (token.type === 'codespan') {
            runs.push(new TextRun({ text: token.text, font: 'Courier New', shading: { fill: 'F3F4F6' }, color: 'E11D48', size: 20, ...overrides }))
        } else if (token.type === 'link') {
            if (token.tokens && token.tokens.length > 0) {
                runs.push(...createTextRuns(token.tokens, { ...overrides, color: '4F46E5', underline: { type: 'single' } }))
            } else {
                runs.push(new TextRun({ text: token.text || token.href, color: '4F46E5', underline: { type: 'single' }, font: 'Arial', ...overrides }))
            }
        } else if (token.type === 'br') {
            runs.push(new TextRun({ break: 1, ...overrides }))
        } else if (token.type === 'image') {
            runs.push(new TextRun({ text: `[图片: ${token.text || 'image'}]`, italics: true, color: '9CA3AF', ...overrides }))
        } else if (token.type === 'space') {
            // skip space tokens
        } else {
            const text = token.text || token.raw || ''
            if (text.trim()) {
                runs.push(new TextRun({ text, font: 'Arial', ...overrides }))
            }
        }
    }
    return runs.length > 0 ? runs : [new TextRun({ text: '', ...overrides })]
}

// Parse tokens into docx paragraphs and elements
async function tokensToDocxElements(tokens, level = 0) {
    const elements = []

    for (const token of tokens) {
        if (token.type === 'heading') {
            elements.push(
                new Paragraph({
                    children: createTextRuns(token.tokens),
                    heading: getHeadingLevel(token),
                    spacing: { before: 360, after: 200 },
                })
            )
        } else if (token.type === 'paragraph') {
            const flatTokens = flattenTokens(token.tokens)
            elements.push(
                new Paragraph({
                    children: createTextRuns(flatTokens),
                    spacing: { after: 160, line: 360 },
                })
            )
        } else if (token.type === 'list') {
            for (const [index, item] of token.items.entries()) {
                const prefix = token.ordered ? `${index + 1}. ` : '• '
                // Flatten item tokens to handle paragraphs/lists inside list items
                const flatItemTokens = flattenTokens(item.tokens)
                elements.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: prefix, bold: true, font: 'Arial' }),
                            ...createTextRuns(flatItemTokens),
                        ],
                        indent: { left: 720 * (level + 1) },
                        spacing: { after: 60 },
                    })
                )
                // Handle nested lists inside item tokens
                if (item.tokens) {
                    const nestedLists = item.tokens.filter(t => t.type === 'list')
                    for (const nested of nestedLists) {
                        const nestedElements = await tokensToDocxElements([nested], level + 1)
                        elements.push(...nestedElements)
                    }
                }
            }
        } else if (token.type === 'code') {
            if (token.lang === 'mermaid') {
                // Render mermaid as PNG image in Word
                try {
                    const pngBlob = await renderMermaidToPng(token.text)
                    const arrayBuffer = await pngBlob.arrayBuffer()
                    const uint8Array = new Uint8Array(arrayBuffer)
                    elements.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: uint8Array,
                                    transformation: { width: 500, height: Math.round(500 * 0.6) },
                                    type: 'png',
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 200, after: 200 },
                        })
                    )
                } catch (e) {
                    console.error('Mermaid export error:', e)
                    elements.push(
                        new Paragraph({
                            children: [new TextRun({ text: '[Mermaid Diagram]', italics: true, color: '888888' })],
                            spacing: { before: 80, after: 40 },
                        })
                    )
                }
            } else {
                // Regular code block with border and background
                const lang = token.lang ? ` (${token.lang})` : ''
                if (lang) {
                    elements.push(
                        new Paragraph({
                            children: [new TextRun({ text: lang.trim(), font: 'Courier New', italics: true, color: '6B7280', size: 18 })],
                            spacing: { before: 160, after: 40 },
                        })
                    )
                }
                const codeLines = token.text.split('\n')
                codeLines.forEach((line, idx) => {
                    const isFirst = idx === 0
                    const isLast = idx === codeLines.length - 1
                    elements.push(
                        new Paragraph({
                            children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: '1F2937' })],
                            shading: { fill: 'F3F4F6' },
                            border: {
                                left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                                right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                                ...(isFirst ? { top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' } } : {}),
                                ...(isLast ? { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' } } : {}),
                            },
                            indent: { left: 120, right: 120 },
                            spacing: { after: 0, before: isFirst ? 40 : 0, line: 276 },
                        })
                    )
                })
                elements.push(new Paragraph({ children: [], spacing: { after: 160 } }))
            }
        } else if (token.type === 'blockquote') {
            if (token.tokens) {
                for (const innerToken of token.tokens) {
                    if (innerToken.type === 'paragraph' && innerToken.tokens) {
                        const flatTokens = flattenTokens(innerToken.tokens)
                        elements.push(
                            new Paragraph({
                                children: createTextRuns(flatTokens, { italics: true, color: '4B5563' }),
                                indent: { left: 480 },
                                border: {
                                    left: { style: BorderStyle.SINGLE, size: 12, color: '6366F1', space: 8 },
                                },
                                shading: { fill: 'F5F3FF' },
                                spacing: { after: 120, line: 360 },
                            })
                        )
                    } else {
                        const nestedElements = await tokensToDocxElements([innerToken], level)
                        elements.push(...nestedElements)
                    }
                }
            }
        } else if (token.type === 'table') {
            if (token.header && token.rows) {
                const allRows = [token.header, ...token.rows]
                const colCount = token.header.length
                const colWidth = Math.floor(9000 / colCount)
                const tableRows = allRows.map((row, rowIndex) => {
                    const isHeader = rowIndex === 0
                    return new TableRow({
                        tableHeader: isHeader,
                        children: row.map(cell =>
                            new TableCell({
                                children: [new Paragraph({
                                    children: createTextRuns(cell.tokens, isHeader ? { bold: true, color: '1F2937' } : {}),
                                    spacing: { after: 40, before: 40 },
                                })],
                                width: { size: colWidth, type: WidthType.DXA },
                                shading: isHeader ? { fill: 'F3F4F6' } : undefined,
                            })
                        ),
                    })
                })
                elements.push(
                    new Table({
                        rows: tableRows,
                        width: { size: 9000, type: WidthType.DXA },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                            left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                            right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                        },
                    })
                )
                elements.push(new Paragraph({ children: [], spacing: { after: 160 } }))
            }
        } else if (token.type === 'hr') {
            elements.push(
                new Paragraph({
                    children: [new TextRun({ text: '────────────────────────────', color: 'CCCCCC' })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 },
                })
            )
        } else if (token.type === 'space') {
            // skip
        } else {
            // Fallback: try to extract text
            const rawText = token.raw || token.text || ''
            if (rawText.trim()) {
                elements.push(
                    new Paragraph({
                        children: [new TextRun({ text: rawText, font: 'Arial' })],
                        spacing: { after: 120 },
                    })
                )
            }
        }
    }

    return elements
}

// Flatten nested tokens (e.g. paragraph > list) into a single array
function flattenTokens(tokens) {
    if (!tokens) return []
    const result = []
    for (const token of tokens) {
        if (token.type === 'text' || token.type === 'strong' || token.type === 'em' ||
            token.type === 'codespan' || token.type === 'link' || token.type === 'br' ||
            token.type === 'image' || token.type === 'del') {
            result.push(token)
        } else if (token.type === 'paragraph' && token.tokens) {
            result.push(...flattenTokens(token.tokens))
        } else {
            result.push(token)
        }
    }
    return result
}

// Render mermaid code to PNG image
async function renderMermaidToPng(code) {
    const id = `mermaid-export-${++mermaidIdCounter}`
    const { svg } = await mermaid.render(id, code)
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml')
    const svgEl = svgDoc.querySelector('svg')
    const vb = svgEl?.getAttribute('viewBox')
    let width = 800, height = 600
    if (vb) {
        const parts = vb.split(/\s+/).map(Number)
        width = parts[2] || 800
        height = parts[3] || 600
    } else {
        width = parseInt(svgEl?.getAttribute('width') || '800', 10)
        height = parseInt(svgEl?.getAttribute('height') || '600', 10)
    }
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    const img = new Image()
    // Use data URL instead of blob URL to avoid tainted canvas
    const svgBase64 = btoa(unescape(encodeURIComponent(svg)))
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`
    return new Promise((resolve, reject) => {
        img.onload = () => {
            try {
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob)
                    else reject(new Error('Failed to create PNG blob'))
                }, 'image/png')
            } catch (e) {
                reject(e)
            }
        }
        img.onerror = () => { reject(new Error('Failed to load SVG')) }
        img.src = dataUrl
    })
}

// Convert Markdown to Word
async function convertToWord() {
    if (!markdownInput.value.trim()) return

    isProcessing.value = true
    error.value = ''

    try {
        const tokens = marked.lexer(markdownInput.value)
        const elements = await tokensToDocxElements(tokens)

        if (elements.length === 0) {
            error.value = t('markdown.emptyResult')
            isProcessing.value = false
            return
        }

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: 'Arial',
                            size: 22,
                            color: '374151',
                        },
                        paragraph: {
                            spacing: { line: 360, after: 120 },
                        },
                    },
                    heading1: {
                        run: {
                            font: 'Arial',
                            size: 36,
                            bold: true,
                            color: '111827',
                        },
                        paragraph: {
                            spacing: { before: 400, after: 200 },
                            border: {
                                bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB', space: 4 },
                            },
                        },
                    },
                    heading2: {
                        run: {
                            font: 'Arial',
                            size: 30,
                            bold: true,
                            color: '1F2937',
                        },
                        paragraph: {
                            spacing: { before: 320, after: 160 },
                        },
                    },
                    heading3: {
                        run: {
                            font: 'Arial',
                            size: 26,
                            bold: true,
                            color: '374151',
                        },
                        paragraph: {
                            spacing: { before: 280, after: 120 },
                        },
                    },
                },
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: elements,
            }],
        })

        const blob = await Packer.toBlob(doc)
        const safeName = fileName.value.trim() || 'converted'
        saveAs(blob, `${safeName}.docx`)
    } catch (e) {
        console.error('Conversion error:', e)
        error.value = t('markdown.conversionError')
    } finally {
        isProcessing.value = false
    }
}

// Handle Word file upload for Word to Markdown
function handleWordFile(file) {
    if (!file) return
    wordError.value = ''

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'docx' && ext !== 'doc') {
        wordError.value = t('markdown.invalidWordFile')
        return
    }

    if (ext === 'doc') {
        wordError.value = t('markdown.docNotSupported')
        return
    }

    wordFile.value = file
    wordFileName.value = file.name.replace(/\.[^.]+$/, '')
    isWordProcessing.value = true

    const reader = new FileReader()
    reader.onload = async (e) => {
        try {
            const arrayBuffer = e.target.result
            const result = await import('mammoth')
            const mammoth = result.default || result

            // Convert to HTML
            const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
            const html = htmlResult.value

            // Convert HTML to markdown-like text
            const markdown = htmlToMarkdown(html)
            extractedMarkdown.value = markdown
            extractedText.value = html

            isWordProcessing.value = false
        } catch (err) {
            console.error('Word parse error:', err)
            wordError.value = t('markdown.wordParseError')
            isWordProcessing.value = false
        }
    }

    reader.onerror = () => {
        wordError.value = t('markdown.fileReadError')
        isWordProcessing.value = false
    }

    reader.readAsArrayBuffer(file)
}

// Simple HTML to Markdown converter
function htmlToMarkdown(html) {
    let md = html

    // Headers
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')

    // Bold and Italic
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

    // Links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

    // Code
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

    // Pre / code blocks
    md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
    md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n')

    // Lists
    md = md.replace(/<ul[^>]*>/gi, '\n')
    md = md.replace(/<\/ul>/gi, '\n')
    md = md.replace(/<ol[^>]*>/gi, '\n')
    md = md.replace(/<\/ol>/gi, '\n')
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

    // Paragraphs
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

    // Line breaks
    md = md.replace(/<br\s*\/?>/gi, '\n')
    md = md.replace(/<hr\s*\/?>/gi, '\n---\n')

    // Blockquotes
    md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')

    // Tables (simple)
    md = md.replace(/<table[^>]*>/gi, '\n')
    md = md.replace(/<\/table>/gi, '\n')
    md = md.replace(/<thead[^>]*>/gi, '')
    md = md.replace(/<\/thead>/gi, '')
    md = md.replace(/<tbody[^>]*>/gi, '')
    md = md.replace(/<\/tbody>/gi, '')
    md = md.replace(/<tr[^>]*>(.*?)<\/tr>/gi, '$1\n')
    md = md.replace(/<th[^>]*>(.*?)<\/th>/gi, '| $1 ')
    md = md.replace(/<td[^>]*>(.*?)<\/td>/gi, '| $1 ')

    // Images
    md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)')
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')

    // Remove remaining HTML tags
    md = md.replace(/<[^>]+>/g, '')

    // Decode HTML entities
    md = md.replace(/&/g, '&')
    md = md.replace(/</g, '<')
    md = md.replace(/>/g, '>')
    md = md.replace(/&nbsp;/g, ' ')
    md = md.replace(/"/g, '"')
    md = md.replace(/&#39;/g, "'")
    md = md.replace(/&#[0-9]+;/g, '')

    // Clean up extra blank lines
    md = md.replace(/\n{3,}/g, '\n\n')
    md = md.trim()

    return md
}

function onWordFileChange(event) {
    const file = event.target.files?.[0]
    if (file) handleWordFile(file)
}

function onWordDrop(event) {
    const file = event.dataTransfer?.files?.[0]
    if (file) handleWordFile(file)
}

function triggerWordUpload() {
    wordFileInput.value?.click()
}

function downloadMarkdown() {
    if (!extractedMarkdown.value) return
    const blob = new Blob([extractedMarkdown.value], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, `${wordFileName.value || 'converted'}.md`)
}

function downloadHtml() {
    if (!extractedText.value) return
    const blob = new Blob([extractedText.value], { type: 'text/html;charset=utf-8' })
    saveAs(blob, `${wordFileName.value || 'converted'}.html`)
}

function resetWord() {
    wordFile.value = null
    wordFileName.value = ''
    extractedText.value = ''
    extractedMarkdown.value = ''
    wordError.value = ''
    if (wordFileInput.value) wordFileInput.value.value = ''
}

function resetMarkdown() {
    markdownInput.value = ''
    error.value = ''
    fileName.value = 'converted'
}
</script>

<template>
    <div class="markdown-converter">
        <!-- Mode selector tabs -->
        <div class="mode-tabs">
            <button class="mode-tab" :class="{ active: conversionMode === 'md-to-word' }"
                @click="conversionMode = 'md-to-word'; error = ''; wordError = ''">
                <span class="mode-icon">📝</span>
                <span>{{ t('markdown.modeMdToWord') }}</span>
            </button>
            <button class="mode-tab" :class="{ active: conversionMode === 'word-to-md' }"
                @click="conversionMode = 'word-to-md'; error = ''; wordError = ''">
                <span class="mode-icon">📄</span>
                <span>{{ t('markdown.modeWordToMd') }}</span>
            </button>
        </div>

        <!-- Error display -->
        <div v-if="error || wordError" class="alert alert-error" style="margin-bottom: 16px;">
            {{ error || wordError }}
        </div>

        <!-- Markdown to Word mode -->
        <div v-if="conversionMode === 'md-to-word'" class="card editor-card">
            <div class="editor-body">
                <div class="control-group">
                    <label class="control-label">{{ t('markdown.fileNameLabel') }}</label>
                    <input type="text" v-model="fileName" class="file-name-input"
                        :placeholder="t('markdown.fileNamePlaceholder')" />
                </div>

                <div class="split-pane">
                    <div class="pane-left">
                        <label class="control-label">{{ t('markdown.markdownInputLabel') }}</label>
                        <textarea ref="textareaRef" v-model="markdownInput" class="markdown-textarea"
                            :placeholder="t('markdown.markdownPlaceholder')" rows="18"
                            @scroll="onEditorScroll"></textarea>
                    </div>
                    <div class="pane-right">
                        <label class="control-label">{{ t('markdown.livePreview') }}</label>
                        <div ref="previewRef" class="preview-area" v-html="htmlPreview" @scroll="onPreviewScroll"></div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" :disabled="!hasMarkdown || isProcessing" @click="convertToWord">
                        <span v-if="isProcessing" class="mini-spinner"></span>
                        {{ isProcessing ? t('markdown.converting') : t('markdown.convertToWord') }}
                    </button>
                    <button class="btn btn-secondary" @click="resetMarkdown" v-if="markdownInput">
                        {{ t('common.reset') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Word to Markdown mode -->
        <div v-if="conversionMode === 'word-to-md'" class="card editor-card">
            <div class="editor-body">
                <div v-if="!wordFile" class="upload-card">
                    <div class="drop-zone" @click="triggerWordUpload" @drop.prevent="onWordDrop" @dragover.prevent>
                        <span class="drop-zone-icon">📄</span>
                        <p class="drop-zone-title">{{ t('markdown.uploadWordTitle') }}</p>
                        <p class="drop-zone-hint">{{ t('markdown.uploadWordHint') }}</p>
                    </div>
                    <input ref="wordFileInput" type="file" accept=".docx,.doc" hidden @change="onWordFileChange" />
                </div>

                <div v-if="wordFile" class="result-section">
                    <div class="editor-header">
                        <div class="file-info">
                            <span class="file-name">{{ wordFile.name }}</span>
                            <span class="file-meta">{{ t('markdown.wordFileSize') }}: {{ (wordFile.size /
                                1024).toFixed(1) }} KB</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" @click="resetWord">{{ t('common.reset') }}</button>
                    </div>

                    <div v-if="isWordProcessing" class="processing-overlay">
                        <span class="mini-spinner"></span>
                        {{ t('common.processing') }}
                    </div>

                    <div v-if="extractedMarkdown" class="result-content">
                        <div class="result-header">
                            <h3 class="result-title">{{ t('markdown.extractedResult') }}</h3>
                            <div class="download-buttons">
                                <button class="btn btn-success btn-sm" @click="downloadMarkdown">
                                    ↓ {{ t('markdown.downloadMarkdown') }}
                                </button>
                                <button class="btn btn-secondary btn-sm" @click="downloadHtml">
                                    ↓ {{ t('markdown.downloadHtml') }}
                                </button>
                            </div>
                        </div>
                        <textarea class="markdown-textarea result-textarea" :value="extractedMarkdown" readonly
                            rows="20"></textarea>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tips card -->
        <div class="card tips-card" v-if="conversionMode === 'md-to-word'">
            <h2 class="tips-title">{{ t('markdown.tipsTitle') }}</h2>
            <div class="tips-grid">
                <div v-for="tip in t('markdown.tips')" :key="tip.title" class="tip-item">
                    <span class="tip-icon">{{ tip.icon }}</span>
                    <div>
                        <strong>{{ tip.title }}</strong>
                        <p>{{ tip.text }}</p>
                    </div>
                </div>
            </div>
        </div>

        <AdSenseSlot class-name="ad-inline" :label="t('site.toolAd')" :slot="toolAdSlot" />
    </div>
</template>

<style scoped>
.mode-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}

.mode-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: white;
    transition: all 0.15s ease;
    flex: 1;
    justify-content: center;
    font-size: 1rem;
    font-weight: 600;
}

.mode-tab:hover {
    border-color: var(--primary);
}

.mode-tab.active {
    background: var(--primary-light);
    border-color: var(--primary);
    color: var(--primary);
}

.mode-icon {
    font-size: 1.25rem;
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

.input-section {
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

.file-name-input {
    padding: 10px 14px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    outline: none;
    font-size: 0.9375rem;
    max-width: 300px;
}

.file-name-input:focus {
    border-color: var(--border-focus);
}

.markdown-textarea {
    width: 100%;
    min-height: 450px;
    padding: 14px 16px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    outline: none;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    resize: vertical;
}

.markdown-textarea:focus {
    border-color: var(--border-focus);
}

.result-textarea {
    background: #FAFAFA;
    cursor: default;
}

.action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
}

.action-buttons .btn {
    padding: 12px 28px;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Upload card */
.upload-card {
    padding: 24px;
}

.drop-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius-sm);
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.drop-zone:hover {
    border-color: var(--primary);
    background: var(--primary-light);
}

.drop-zone-icon {
    font-size: 3rem;
}

.drop-zone-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
}

.drop-zone-hint {
    font-size: 0.8125rem;
    color: var(--text-muted);
}

/* Result section */
.result-section {
    display: flex;
    flex-direction: column;
}

.processing-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px;
    color: var(--text-muted);
    font-size: 0.9375rem;
}

.result-content {
    display: flex;
    flex-direction: column;
}

.result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
}

.result-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
}

.download-buttons {
    display: flex;
    gap: 8px;
}

/* Spinner */
.mini-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #E5E7EB;
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: md-spin 0.6s linear infinite;
}

@keyframes md-spin {
    to {
        transform: rotate(360deg);
    }
}

/* Tips */
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

/* Split pane: editor + live preview */
.split-pane {
    display: flex;
    gap: 16px;
    margin-top: 4px;
}

.pane-left,
.pane-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.pane-left .markdown-textarea {
    min-height: 300px;
    max-height: 600px;
    flex: 1;
    overflow-y: auto;
}

.preview-area {
    flex: 1;
    min-height: 300px;
    max-height: 600px;
    padding: 14px 16px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    background: #FAFAFA;
    overflow-y: auto;
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--text);
}

.preview-area:empty::before {
    content: '';
    display: block;
}

.preview-area :deep(h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
}

.preview-area :deep(h2) {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 16px 0 8px;
}

.preview-area :deep(h3) {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 14px 0 6px;
}

.preview-area :deep(h4),
.preview-area :deep(h5),
.preview-area :deep(h6) {
    font-weight: 700;
    margin: 12px 0 6px;
}

.preview-area :deep(p) {
    margin: 0 0 10px;
}

.preview-area :deep(ul),
.preview-area :deep(ol) {
    margin: 0 0 10px;
    padding-left: 24px;
}

.preview-area :deep(li) {
    margin-bottom: 4px;
}

.preview-area :deep(code) {
    background: #E8E8E8;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.875em;
}

.preview-area :deep(pre) {
    background: #F5F5F5;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    overflow-x: auto;
    margin: 0 0 10px;
}

.preview-area :deep(pre code) {
    background: none;
    padding: 0;
}

.preview-area :deep(blockquote) {
    border-left: 3px solid var(--primary);
    margin: 0 0 10px;
    padding: 4px 16px;
    color: var(--text-secondary);
    background: var(--primary-light);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.preview-area :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 10px;
}

.preview-area :deep(th),
.preview-area :deep(td) {
    border: 1px solid var(--border);
    padding: 6px 10px;
    text-align: left;
}

.preview-area :deep(th) {
    background: #F5F5F5;
    font-weight: 600;
}

.preview-area :deep(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 12px 0;
}

.preview-area :deep(a) {
    color: #0563C1;
    text-decoration: none;
}

.preview-area :deep(a:hover) {
    text-decoration: underline;
}

.preview-area :deep(img) {
    max-width: 100%;
    border-radius: var(--radius-sm);
}

.preview-area :deep(strong) {
    font-weight: 700;
}

.preview-area :deep(em) {
    font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
    .editor-body {
        padding: 16px;
    }

    .markdown-textarea {
        min-height: 200px;
    }

    .split-pane {
        flex-direction: column;
    }

    .pane-left .markdown-textarea {
        min-height: 250px;
        max-height: 500px;
    }

    .preview-area {
        min-height: 250px;
        max-height: 500px;
    }

    .action-buttons {
        flex-direction: column;
    }

    .action-buttons .btn {
        width: 100%;
        justify-content: center;
    }

    .result-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .download-buttons {
        width: 100%;
    }

    .download-buttons .btn {
        flex: 1;
    }

    .tips-card {
        padding: 16px;
    }
}

@media (max-width: 480px) {
    .editor-body {
        padding: 12px;
    }

    .file-name-input {
        max-width: 100%;
        width: 100%;
    }

    .tips-grid {
        grid-template-columns: 1fr;
    }
}
</style>