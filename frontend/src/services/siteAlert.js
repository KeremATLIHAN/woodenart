import { reactive } from 'vue'

export const siteAlertState = reactive({
    visible: false,
    message: '',
    type: 'success',
})

let closeTimer = null

export function closeSiteAlert() {
    siteAlertState.visible = false
    if (closeTimer) {
        clearTimeout(closeTimer)
        closeTimer = null
    }
}

export function showSiteAlert(message, type = 'success', duration = 3500) {
    if (!message) return

    if (closeTimer) clearTimeout(closeTimer)
    siteAlertState.message = String(message)
    siteAlertState.type = type
    siteAlertState.visible = true
    closeTimer = setTimeout(closeSiteAlert, duration)
}
