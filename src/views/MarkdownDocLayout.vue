<script setup>
import { computed, inject } from 'vue'
import { I18N_KEY } from '../i18n'

const { t } = inject(I18N_KEY)
const pageMeta = computed(() => t('tabs.markdown'))
</script>

<template>
    <div class="wide-page">
        <div class="container-wide">
            <section class="page-hero">
                <h1 class="page-title">{{ pageMeta.icon }} {{ pageMeta.label }}</h1>
                <p class="page-desc">{{ pageMeta.desc }}</p>
            </section>

            <div class="tool-area-wide">
                <router-view />
            </div>
        </div>
    </div>
</template>

<style scoped>
.wide-page {
    padding-bottom: 48px;
}

.container-wide {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 32px;
}

.page-hero {
    text-align: center;
    padding: 40px 0 32px;
}

.page-title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 8px;
}

.page-desc {
    font-size: 1rem;
    color: var(--text-secondary);
}

.tool-area-wide {
    width: 100%;
}

@media (max-width: 768px) {
    .container-wide {
        padding: 0 16px;
    }

    .page-hero {
        padding: 20px 0 16px;
        text-align: left;
    }

    .page-title {
        font-size: 1.5rem;
    }

    .page-desc {
        font-size: 0.9375rem;
    }

    .wide-page {
        padding-bottom: 32px;
    }
}

@media (max-width: 480px) {
    .container-wide {
        padding: 0 12px;
    }

    .page-hero {
        padding: 16px 0 12px;
    }

    .page-title {
        font-size: 1.375rem;
    }
}
</style>