<script setup>
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  slot: {
    type: String,
    default: '',
  },
  className: {
    type: String,
    default: '',
  },
  format: {
    type: String,
    default: 'auto',
  },
})

const client = import.meta.env.VITE_ADSENSE_CLIENT || ''
const isEnabled = computed(() => Boolean(client && props.slot))
const pushed = ref(false)

function pushAd() {
  if (!isEnabled.value || pushed.value || !window.adsbygoogle) return

  try {
    window.adsbygoogle.push({})
    pushed.value = true
  } catch (error) {
    console.warn('[AdSense] Failed to render ad slot:', error)
  }
}

onMounted(pushAd)
watch(isEnabled, pushAd)
</script>

<template>
  <ins
    v-if="isEnabled"
    class="adsbygoogle ad-slot ad-live"
    :class="className"
    style="display:block"
    :data-ad-client="client"
    :data-ad-slot="slot"
    :data-ad-format="format"
    data-full-width-responsive="true"
  ></ins>
  <div v-else class="ad-slot" :class="className">
    {{ label }}
  </div>
</template>
