<script setup>
import { inject, computed } from 'vue'
import { I18N_KEY } from '../i18n'

const { t } = inject(I18N_KEY)

const toolList = computed(() => [
    {
        route: '/toolbox/image-cropper',
        ...t('toolbox.cropper'),
    },
    {
        route: '/toolbox/image-format-converter',
        ...t('toolbox.converter'),
    },
    {
        route: '/toolbox/pdf-to-word',
        ...t('toolbox.pdfToWord'),
    },
    {
        route: '/toolbox/pdf-merger',
        ...t('toolbox.pdfMerger'),
    },
])
</script>

<template>
    <div class="toolbox">
        <section class="toolbox-hero">
            <div class="container">
                <h1 class="toolbox-title">{{ t('toolbox.title') }}</h1>
                <p class="toolbox-subtitle">{{ t('toolbox.subtitle') }}</p>
            </div>
        </section>

        <section class="toolbox-tools">
            <div class="container">
                <div class="toolbox-grid">
                    <router-link v-for="tool in toolList" :key="tool.route" :to="tool.route" class="toolbox-card">
                        <span class="toolbox-card-icon">{{ tool.icon }}</span>
                        <h3 class="toolbox-card-label">{{ tool.label }}</h3>
                        <p class="toolbox-card-desc">{{ tool.desc }}</p>
                        <span class="toolbox-card-cta">{{ t('home.tryNow') }} →</span>
                    </router-link>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.toolbox-hero {
    padding: 64px 0 40px;
    text-align: center;
}

.toolbox-title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 12px;
}

.toolbox-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.7;
}

.toolbox-tools {
    padding: 0 0 64px;
}

.toolbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    max-width: 720px;
    margin: 0 auto;
}

.toolbox-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 28px 28px;
    background: var(--bg-card);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    text-decoration: none;
    color: var(--text);
    transition: all 0.2s ease;
    box-shadow: var(--shadow);
}

.toolbox-card:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-lg);
    transform: translateY(-3px);
}

.toolbox-card-icon {
    font-size: 3rem;
    margin-bottom: 16px;
}

.toolbox-card-label {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 10px;
}

.toolbox-card-desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 20px;
    flex: 1;
}

.toolbox-card-cta {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--primary);
}

@media (max-width: 480px) {
    .toolbox-hero {
        padding: 40px 0 24px;
    }

    .toolbox-title {
        font-size: 1.5rem;
    }

    .toolbox-grid {
        grid-template-columns: 1fr;
    }
}
</style>