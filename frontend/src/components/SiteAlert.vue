<script setup>
import { computed } from 'vue'
import { closeSiteAlert, siteAlertState } from '../services/siteAlert.js'

const alertIcon = computed(() => siteAlertState.type === 'error' ? '!' : '✓')
const alertTitle = computed(() => siteAlertState.type === 'error' ? 'İşlem tamamlanamadı' : 'İşlem başarılı')
</script>

<template>
  <Teleport to="body">
    <Transition name="site-alert">
      <div
        v-if="siteAlertState.visible"
        class="site-alert"
        :class="`site-alert-${siteAlertState.type}`"
        :role="siteAlertState.type === 'error' ? 'alert' : 'status'"
        aria-live="polite"
      >
        <span class="site-alert-icon" aria-hidden="true">{{ alertIcon }}</span>
        <div class="site-alert-content">
          <strong>{{ alertTitle }}</strong>
          <span>{{ siteAlertState.message }}</span>
        </div>
        <button type="button" class="site-alert-close" aria-label="Bildirimi kapat" @click="closeSiteAlert">
          ×
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.site-alert {
    position: fixed;
    z-index: 2200;
    top: 20px;
    right: 20px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    width: min(420px, calc(100vw - 32px));
    padding: 15px 16px;
    color: #4b3621;
    background: #fffaf5;
    border: 1px solid #d8c2ab;
    border-left: 5px solid #8b5e3c;
    border-radius: 15px;
    box-shadow: 0 16px 38px rgba(52, 35, 23, 0.24);
}

.site-alert-error {
    border-left-color: #a5483f;
}

.site-alert-icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    color: #fff;
    background: #8b5e3c;
    border-radius: 50%;
    font-size: 1.1rem;
    font-weight: 800;
}

.site-alert-error .site-alert-icon {
    background: #a5483f;
}

.site-alert-content {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
}

.site-alert-content strong {
    color: #5a3e2b;
    font-size: 0.95rem;
}

.site-alert-content span {
    overflow-wrap: anywhere;
    color: #6e5542;
    font-size: 0.9rem;
}

.site-alert-close {
    align-self: start;
    padding: 0;
    color: #8b735f;
    background: transparent;
    border: 0;
    font-size: 1.45rem;
    line-height: 1;
}

.site-alert-close:hover {
    color: #4b3621;
}

.site-alert-enter-active,
.site-alert-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.site-alert-enter-from,
.site-alert-leave-to {
    opacity: 0;
    transform: translateY(-12px);
}

@media (max-width: 575.98px) {
    .site-alert {
        top: 12px;
        right: 16px;
        left: 16px;
        width: auto;
    }
}
</style>
