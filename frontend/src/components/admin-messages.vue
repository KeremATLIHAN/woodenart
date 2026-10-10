<!--! Tasarimlarin oldugu yer -->
<template>

    <h3>Mesajlar</h3>

    <div class="table-responsive">
    <table class="table table-striped mt-4 messages-table">
        <thead>
            <tr>
                <th scope="col">ID</th>
                <th scope="col">Isim Soyisim</th>
                <th scope="col">Email</th>
                <th scope="col">Mesaj</th>
                <th scope="col">Tarih</th>
                <th scope="col">Durum</th>
                <th scope="col" class="actions-column">İşlem</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="message, index in  messages" :key="message.m_id">
                <td><label for="">{{ index + 1 }}</label></td>
                <td><label for="">{{ message.m_firstName }} {{ message.m_lastName }}</label></td>
                <td><label for="">{{ message.m_email }}</label></td>
                
                <td><label for="">{{ message.m_message }}</label></td>
                <td><label for="">{{ message.m_created_at?.split('T')[0] }}</label></td>
                <td>
                    <select :style="message.m_status==0 ? 'color:red' : 'color:green'" v-model="message.m_status" class="form-select">
                        <option style="color:black" value=1 >Yanıtlandı</option>
                        <option style="color:black" value=0 >Yanıtlanmadı</option>
                    </select>
                </td>

                <td class="actions-column">
                    <div class="message-actions">
                        <button type="button" class="btn btn-sm action-btn action-btn-primary"
                            title="Durumu güncelle" aria-label="Durumu güncelle"
                            @click="updateMessage(message.m_id, message.m_status)">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20 7v5h-5M4 17v-5h5" />
                                <path d="M5.6 9a7 7 0 0 1 11.5-2L20 12M4 12l2.9 5a7 7 0 0 0 11.5-2" />
                            </svg>
                        </button>
                        <button type="button" class="btn btn-sm action-btn action-btn-success"
                            title="Yanıtla" aria-label="Yanıtla" @click="openReply(message)">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 5h16v14H4z" />
                                <path d="m4 7 8 6 8-6" />
                            </svg>
                        </button>
                        <button type="button" class="btn btn-sm action-btn action-btn-danger"
                            title="Mesajı sil" aria-label="Mesajı sil" @click="deleteMessage(message.m_id)">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>

        </tbody>
    </table>
    </div>

    <Teleport to="body">
        <div ref="replyModal" class="modal fade" tabindex="-1" aria-labelledby="replyModalTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <form @submit.prevent="sendReply">
                        <div class="modal-header">
                            <h5 id="replyModalTitle" class="modal-title">E-posta ile yanıtla</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                        </div>
                        <div class="modal-body">
                            <p v-if="replyTarget" class="mb-3">
                                Alıcı: <strong>{{ replyTarget.m_email }}</strong>
                            </p>
                            <textarea v-model.trim="replyText" class="form-control" rows="6" maxlength="5000"
                                placeholder="Yanıtınızı yazın..." required></textarea>
                            <div v-if="replyError" class="alert alert-danger mt-3 mb-0" role="alert">{{ replyError }}</div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" :disabled="replySending">Vazgeç</button>
                            <button type="submit" class="btn action-btn-success" :disabled="replySending || !replyText">
                                {{ replySending ? 'Gönderiliyor...' : 'E-postayı Gönder' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<!--! Program ve fonksiyonlarin oldugu yer -->
<script>
import { Modal } from 'bootstrap'
import { showSiteAlert } from '../services/siteAlert.js'

export default {
    //! Data degisken tanimladigimiz yer
    data() {
        return {
            // inject :['products'],
            messages: [],
            messagesMessage: null,
            error: null,
            baseUrl: "http://localhost:3001",
            replyTarget: null,
            replyText: "",
            replyError: "",
            replySending: false,

        };
    },
    //! Sayfa ilk yuklendiginde direkt calisacak kodlar
    mounted() {
        this.getMessages();

    },
    beforeUnmount() {
        const modalElement = this.$refs.replyModal
        if (!modalElement) return

        const modal = Modal.getInstance(modalElement)
        if (modal) {
            modal.hide()
            modal.dispose()
        }
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove())
        document.body.classList.remove('modal-open')
        document.body.style.removeProperty('overflow')
        document.body.style.removeProperty('padding-right')
    },
    //! Degiskeni izler, Degiskenlerde bir degisiklik yapildiginda degismesini izledigimiz kodlar
    watch: {
    },
    //! Var olan dizi uzerinde degisiklik yapacaksak ve yeni deger ureteceksek kullaniriz.Orn; kdv hesaplama, indirim hesaplama gibi islemler yapacaksak kullaniriz.
    computed: {
    },
    //! Bildigimiz fonksiyonlarin oldugu yer.Bir etkilesime girince calisacak fonksiyonlari burada tanimlariz.
    methods: {

        openReply(message) {
            this.replyTarget = message;
            this.replyText = "";
            this.replyError = "";
            Modal.getOrCreateInstance(this.$refs.replyModal).show();
        },

        async sendReply() {
            if (!this.replyTarget || this.replySending || !this.replyText.trim()) return;
            this.replySending = true;
            this.replyError = "";
            try {
                const response = await fetch(`${this.baseUrl}/api/messages/${this.replyTarget.m_id}/reply`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reply: this.replyText }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || "Yanıt e-posta ile gönderilemedi.");

                showSiteAlert(data.message || "Yanıt e-posta ile gönderildi.");
                Modal.getOrCreateInstance(this.$refs.replyModal).hide();
                this.replyTarget.m_status = 1;
                this.replyText = "";
            } catch (error) {
                this.replyError = error.message;
            } finally {
                this.replySending = false;
            }
        },

        async getMessages() {

            try {
                const res = await fetch(`${this.baseUrl}/api/messages`, { credentials: "include" });
                if (!res.ok) throw new Error("Message endpoint hatası");
                this.messages = await res.json();
            } catch (e) {
                this.error = e.message;
            }
        },

        async updateMessage(m_id, m_status) {
            this.messageMessage = null;
            try {
                const res = await fetch(`${this.baseUrl}/api/messages/${m_id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: m_status
                    })
                });
                if (!res.ok) throw new Error("updateMessage endpoint hatası");

                const data = await res.json();
                if (data) showSiteAlert("Mesaj durumu başarıyla güncellendi!");
                this.getMessages(); // Mesajları tekrar yükle

            }

            catch (e) {
                console.error(e.message);
            }


        },

        async deleteMessage(id) {

            try {
                const res = await fetch(`${this.baseUrl}/api/messages/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },

                });
                if (!res.ok) throw new Error("deleteMessages endpoint hatası");

                const data = await res.json();
                if (data) showSiteAlert("Mesaj başarıyla silindi!");
                this.getMessages(); // Mesajları tekrar yükle

            }

            catch (e) {
                console.error(e.message);
            }


        }

    },
};
</script>


<!--! CSS kodlarimizin oldugu yer -->
<!--! scoped yazmamin nedeni yazacagim kodlarin sadece bu sayfada gecerli olmasi -->
<style scoped>
.action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 999px;
    font-weight: 600;
    transition: all 0.2s ease;
}

.action-btn svg {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.action-btn:focus-visible {
    outline: 2px solid #8b5e3c;
    outline-offset: 2px;
}

.action-btn-primary {
    background: rgba(230, 189, 141, 0.18);
    color: #4b3621;
    border: 1px solid rgba(139, 94, 60, 0.4);
}

.action-btn-primary:hover {
    background: #c38a4e;
    color: #fff;
    border-color: #c38a4e;
}

.action-btn-success {
    background: rgba(40, 167, 69, 0.12);
    color: #1e5c32;
    border: 1px solid rgba(40, 167, 69, 0.35);
}

.action-btn-success:hover {
    background: #218838;
    color: #fff;
    border-color: #218838;
}

.action-btn-danger {
    background: rgba(220, 53, 69, 0.08);
    color: #b02a37;
    border: 1px solid rgba(220, 53, 69, 0.3);
}

.action-btn-danger:hover {
    background: #dc3545;
    color: #fff;
    border-color: #dc3545;
}

.table-responsive {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.messages-table {
    min-width: 1000px;
    width: 100%;
}

.messages-table th,
.messages-table td {
    vertical-align: middle;
}

.messages-table .actions-column {
    width: 128px;
    white-space: nowrap;
}

.message-actions {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 6px;
    width: max-content;
}

.messages-table td:nth-child(4) {
    min-width: 220px;
    max-width: 360px;
    overflow-wrap: anywhere;
}

.messages-table .form-select {
    min-width: 116px;
}

@media (max-width: 768px) {
    .messages-table {
        min-width: 900px;
    }
}
</style>
