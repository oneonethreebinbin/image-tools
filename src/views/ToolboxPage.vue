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
            <div class="toolbox-hero-bg">
                <div class="toolbox-orb toolbox-orb-1"></div>
                <div class="toolbox-orb toolbox-orb-2"></div>
                <div class="toolbox-hero-grid"></div>
            </div>
            <div class="container toolbox-hero-content">
                <h1 class="toolbox-title">{{ t('toolbox.title') }}</h1>
                <p class="toolbox-subtitle">{{ t('toolbox.subtitle') }}</p>
            </div>
        </section>

        <section class="toolbox-tools">
            <div class="container">
                <div class="toolbox-grid">
                    <router-link v-for="tool in toolList" :key="tool.route" :to="tool.route" class="toolbox-card">
                        <div class="toolbox-card-icon-wrap">
                            <span class="toolbox-card-icon">{{ tool.icon }}</span>
                        </div>
                        <h3 class="toolbox-card-label">{{ tool.label }}</h3>
                        <p class="toolbox-card-desc">{{ tool.desc }}</p>
                        <span class="toolbox-card-cta">
                            {{ t('home.tryNow') }}
                            <span class="toolbox-card-arrow">→</span>
                        </span>
                    </router-link>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.toolbox-hero {
    position: relative;
    padding: 72px 0 48px;
    text-align: center;
    overflow: hidden;
    background: linear-gradient(180deg, #f0f2ff 0%, var(--bg) 100%);
}

.toolbox-hero-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.toolbox-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;
    animation: toolbox-float 18s ease-in-out infinite;
}

.toolbox-orb-1 {
    width: 300px;
    height: 300px;
    background: rgba(99, 102, 241, 0.12);
    top: -80px;
    right: -60px;
}

.toolbox-orb-2 {
    width: 250px;
    height: 250px;
    background: rgba(139, 92, 246, 0.1);
    bottom: -60px;
    left: -40px;
    animation-delay: -9s;
}

.toolbox-hero-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
}

@keyframes toolbox-float {

    0%,
    100% {
        transform: translateY(0) scale(1);
    }

    50% {
        transform: translateY(-20px) scale(1.04);
    }
}

.toolbox-hero-content {
    position: relative;
    z-index: 1;
}

.toolbox-title {
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 12px;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, var(--text) 0%, #4338ca 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.toolbox-subtitle {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    max-width: 420px;
    margin: 0 auto;
    line-height: 1.7;
}

.toolbox-tools {
    padding: 0 0 72px;
}

.toolbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.toolbox-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 36px 24px 28px;
    background: var(--bg-card);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    text-decoration: none;
    color: var(--text);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
}

.toolbox-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--gradient-primary);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
}

.toolbox-card:hover {
    border-color: rgba(79, 70, 229, 0.3);
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-4px);
}

.toolbox-card:hover::before {
    transform: scaleX(1);
}

.toolbox-card-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: var(--gradient-mesh);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    transition: all 0.3s ease;
}

.toolbox-card:hover .toolbox-card-icon-wrap {
    background: var(--primary-light);
    transform: scale(1.05);
}

.toolbox-card-icon {
    font-size: 2rem;
}

.toolbox-card-label {
    font-size: 1.0625rem;
    font-weight: 700;
    margin-bottom: 8px;
}

.toolbox-card-desc {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 18px;
    flex: 1;
}

.toolbox-card-cta {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--primary);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: gap 0.2s ease;
}

.toolbox-card:hover .toolbox-card-cta {
    gap: 8px;
}

.toolbox-card-arrow {
    transition: transform 0.2s ease;
}

.toolbox-card:hover .toolbox-card-arrow {
    transform: translateX(2px);
}

@media (max-width: 480px) {
    .toolbox-hero {
        padding: 48px 0 32px;
    }

    .toolbox-title {
        font-size: 1.75rem;
    }

    .toolbox-grid {
        grid-template-columns: 1fr;
    }

    .toolbox-card {
        padding: 28px 16px 24px;
    }

    .toolbox-card-icon-wrap {
        width: 52px;
        height: 52px;
    }
}
</style>