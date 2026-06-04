<template>
    <div class="tip-list" v-if="tips && tips.length">
        <h3>{{ title }}</h3>
        <div class="tip-grid">
            <div class="tip-card" v-for="(tip, idx) in tips" :key="idx">
                <div class="tip-icon">{{ tip.icon }}</div>
                <div class="tip-content">
                    <div class="tip-title">{{ tip.title }}</div>
                    <div class="tip-text">{{ tip.text }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: { type: String, default: "" },
    tips: { type: Array, default: () => [] },
});
</script>

<style scoped>
.tip-list {
    margin-top: 2rem;
}

.tip-list h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text);
}

.tip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.75rem;
}

.tip-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem;
    border-radius: 10px;
    background: var(--panel);
    border: 1px solid var(--border);
}

.tip-icon {
    font-size: 1.25rem;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 2px;
}

.tip-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    color: var(--text);
}

.tip-text {
    font-size: 0.8125rem;
    color: var(--muted);
    line-height: 1.5;
}
</style>