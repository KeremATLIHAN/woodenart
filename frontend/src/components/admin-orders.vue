<!--! Tasarimlarin oldugu yer -->
<template>

    <!--! Orders Modal -->
    <Teleport to="body">
        <div ref="orderModalElement" class="modal fade admin-modal" id="orderDetailsModal" tabindex="-1"
            aria-labelledby="orderDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content admin-modal-content">
                    <div class="modal-header admin-modal-header">
                        <h1 class="modal-title fs-5" id="orderDetailsModalLabel">Sipariş Detayları</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                    </div>

                    <div v-if="selectedOrder" class="modal-body row">
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Sipariş No:</label>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">{{ selectedOrder.o_no }}</label>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label fw-bold">Ürünler:</label>
                        </div>
                        <div class="col-md-8">
                            <ul class="mb-0">
                                <li v-for="(product, index) in getOrderProducts(selectedOrder.o_products)"
                                    :key="`${product}-${index}`">
                                    {{ product }}
                                </li>
                            </ul>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label fw-bold">Sipariş Veren:</label>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">{{ selectedOrder.o_person }}</label>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label fw-bold">Sipariş Adresi:</label>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">{{ selectedOrder.o_address }}</label>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label fw-bold">Toplam Tutar:</label>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">{{ formatPrice(selectedOrder.o_amount) }} TL</label>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label fw-bold">Sipariş Tarihi:</label>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">{{ formatOrderDate(selectedOrder.o_date) }}</label>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label fw-bold">Durumu:</label>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">{{ selectedOrder.o_status }}</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>


    <!--! SIPARISLER -->

    <h3>Siparişlerimiz</h3>

    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <p v-else-if="loading" role="status">Siparişler yükleniyor...</p>
    <p v-else-if="orders.length === 0">Henüz görüntülenecek sipariş yok.</p>

    <div v-else class="table-responsive">
        <table class="table table-striped mt-4 orders-table">
            <thead>
                <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Sipariş No</th>
                    <th scope="col">Toplam Fiyat</th>
                    <th scope="col">Verilen Tarih</th>
                    <th scope="col">Sipariş Durumu</th>
                    <th scope="col" class="actions-column">İşlemler</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="order in orders" :key="order.id">
                    <td>{{ order.id }}</td>
                    <td>
                        <input v-if="isAdmin" class="form-control" type="text" v-model="order.o_no">
                        <span v-else>{{ order.o_no }}</span>
                    </td>
                    <td>
                        <input v-if="isAdmin" class="form-control" type="text" inputmode="decimal"
                            :value="formatPrice(order.o_amount)"
                            @change="updateOrderAmount(order, $event)">
                        <span v-else>{{ formatPrice(order.o_amount) }} TL</span>
                    </td>
                    <td>{{ formatOrderDate(order.o_date) }}</td>
                    <td>
                        <select v-if="isAdmin" class="form-control" v-model="order.o_status">
                            <option value="Hazirlaniyor">Hazırlanıyor</option>
                            <option value="Kargoya verildi">Kargoya verildi</option>
                            <option value="Teslim edildi">Teslim edildi</option>
                            <option value="Iptal edildi">İptal edildi</option>
                        </select>
                        <span v-else>{{ order.o_status }}</span>
                    </td>
                    <td class="actions-column">
                        <div class="order-actions">
                            <template v-if="isAdmin">
                                <button type="button" class="btn btn-sm action-btn action-btn-primary"
                                    title="Siparişi güncelle" aria-label="Siparişi güncelle"
                                    @click="updateOrders(order.id, order.o_no, order.o_amount, order.o_date, order.o_status)">
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="m16 3 5 5-12 12H4v-5L16 3Z" />
                                        <path d="m13 6 5 5" />
                                    </svg>
                                </button>
                                <button type="button" class="btn btn-sm action-btn action-btn-danger"
                                    title="Siparişi sil" aria-label="Siparişi sil" @click="deleteOrder(order.id)">
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
                                    </svg>
                                </button>
                            </template>
                            <button @click="openOrderDetail(order.id)" type="button"
                                class="btn btn-sm action-btn action-btn-secondary" title="Sipariş detayları"
                                aria-label="Sipariş detayları">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>

            </tbody>
        </table>
    </div>


</template>

<!--! Program ve fonksiyonlarin oldugu yer -->
<script>
import { Modal } from 'bootstrap';
import { showSiteAlert } from '../services/siteAlert.js'

export default {
    props: {
        isAdmin: {
            type: Boolean,
            default: false
        }
    },
    //! Data degisken tanimladigimiz yer
    data() {
        return {
            detailID: null,
            orders: [],
            baseUrl: "http://localhost:3001",
            error: null,
            loading: false,
            orderModal: null,

            // orders: [{ o_no: "23455", o_products: "nike,adidas,nike", o_person: "Ahmet Cinar", o_address: "Istanbul", o_amount: 550, o_date: "27/06/2026", o_status: "Hazirlaniyor" },
            // { o_no: "23450", o_products: "hp,dell", o_person: "Kerem ATLIHAN", o_address: "Istanbul", o_amount: 1000, o_date: "27/06/2026", o_status: "Hazirlaniyor" }
            // ],


        };
    },
    //! Sayfa ilk yuklendiginde direkt calisacak kodlar
    mounted() {
        this.getOrders();
        this.$nextTick(() => {
            const modalEl = this.$refs.orderModalElement;
            if (!modalEl) return;
            this.orderModal = Modal.getOrCreateInstance(modalEl);
            modalEl.addEventListener('hidden.bs.modal', this.handleOrderModalHidden);
        });
    },
    beforeUnmount() {
        const modalEl = this.$refs.orderModalElement;
        if (modalEl) {
            modalEl.removeEventListener('hidden.bs.modal', this.handleOrderModalHidden);
        }
        if (this.orderModal) {
            if (modalEl?.classList.contains('show')) {
                this.orderModal.hide();
            } else {
                this.orderModal.dispose();
            }
        }
    },
    //! Degiskeni izler, Degiskenlerde bir degisiklik yapildiginda degismesini izledigimiz kodlar
    watch: {

    },
    //! Var olan dizi uzerinde degisiklik yapacaksak ve yeni deger ureteceksek kullaniriz.Orn; kdv hesaplama, indirim hesaplama gibi islemler yapacaksak kullaniriz.
    computed: {
        selectedOrder() {
            return this.orders.find(order => order.id === this.detailID) || null;
        }
    },
    //! Bildigimiz fonksiyonlarin oldugu yer.Bir etkilesime girince calisacak fonksiyonlari burada tanimlariz.
    methods: {
        handleOrderModalHidden() {
            this.detailID = null;
        },
        openOrderDetail(id) {
            this.detailID = id;
            this.$nextTick(() => {
                const modalEl = this.$refs.orderModalElement;
                if (!modalEl) return;
                this.orderModal = Modal.getOrCreateInstance(modalEl);
                this.orderModal.show();
            });
        },

        formatOrderDate(date) {
            if (!date) return "";
            const value = date instanceof Date ? date.toISOString() : String(date);
            return value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || value;
        },

        formatPrice(amount) {
            const value = Number(amount);
            if (!Number.isFinite(value)) return "0,00";
            return new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        },

        updateOrderAmount(order, event) {
            const rawAmount = event.target.value.trim().replace(/\./g, "").replace(",", ".");
            const amount = Number(rawAmount);
            if (!rawAmount || !Number.isFinite(amount) || amount < 0) {
                this.error = "Geçerli bir sipariş tutarı giriniz (ör. 16.800,00).";
                return;
            }
            this.error = null;
            order.o_amount = amount;
        },

        getOrderProducts(products) {
            if (Array.isArray(products)) return products;
            if (typeof products === "string") {
                try {
                    const parsedProducts = JSON.parse(products);
                    if (Array.isArray(parsedProducts)) return parsedProducts;
                } catch {
                    // Retain compatibility with older comma-separated order records.
                }
                return products.split(",").map(product => product.trim()).filter(Boolean);
            }
            return [];
        },


        deleteItem(value, index) {


            if (value == "order") {
                this.orders.splice(index, 1);
                    this.detailID = 0
            }
        },

        async getOrders() {
            this.error = null;
            this.loading = true;
            try {
                const res = await fetch(`${this.baseUrl}/api/orders`, { credentials: "include" });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || `Siparişler alınamadı (HTTP ${res.status}).`);
                }
                if (!Array.isArray(data)) {
                    throw new Error("Sipariş yanıtı beklenen formatta değil.");
                }
                this.orders = data;
            } catch (error) {
                this.orders = [];
                this.error = error instanceof Error ? error.message : "Siparişler alınırken bilinmeyen bir hata oluştu.";
            } finally {
                this.loading = false;
            }
        },

        async updateOrders(id, o_no, o_amount, o_date, o_status) {
            this.error = null;
            const allowedStatuses = ["Hazirlaniyor", "Kargoya verildi", "Teslim edildi", "Iptal edildi"];
            if (!Number.isInteger(Number(id)) || Number(id) < 1 ||
                typeof o_no !== "string" || !o_no.trim() ||
                !Number.isFinite(Number(o_amount)) || Number(o_amount) < 0 || !o_date) {
                this.error = "Sipariş numarası, geçerli bir tutar ve tarih giriniz.";
                return;
            }
            if (!allowedStatuses.includes(o_status)) {
                this.error = "Geçersiz sipariş durumu.";
                return;
            }
            try {
                const res = await fetch(`${this.baseUrl}/api/orders/${id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        o_no: o_no,
                        o_amount: o_amount,
                        o_date: o_date,
                        o_status: o_status
                    })
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || `Sipariş güncellenemedi (HTTP ${res.status}).`);
                }

                showSiteAlert("Sipariş başarıyla güncellendi!");
                await this.getOrders();
            } catch (error) {
                this.error = error instanceof Error ? error.message : "Sipariş güncellenirken bilinmeyen bir hata oluştu.";
            }
        },

        async deleteOrder(id) {
            this.error = null;
            if (!Number.isInteger(Number(id)) || Number(id) < 1) {
                this.error = "Geçersiz sipariş numarası.";
                return;
            }
            try {
                const res = await fetch(`${this.baseUrl}/api/orders/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || `Sipariş silinemedi (HTTP ${res.status}).`);
                }
                showSiteAlert("Sipariş başarıyla silindi!");
                await this.getOrders();
            } catch (error) {
                this.error = error instanceof Error ? error.message : "Sipariş silinirken bilinmeyen bir hata oluştu.";
            }
        }

    }
};
</script>


<!--! CSS kodlarimizin oldugu yer -->
<!--! scoped yazmamin nedeni yazacagim kodlarin sadece bu sayfada gecerli olmasi -->
<style scoped>
.admin-modal {
    z-index: 1060;
}

.admin-modal .modal-dialog {
    width: min(90vw, 760px);
    max-width: 760px;
    margin: 1.5rem auto;
}

.admin-modal-content {
    border: 1px solid rgba(94, 61, 39, 0.18);
    border-radius: 18px;
    overflow: hidden;
    background: #f8f3ee;
    box-shadow: 0 18px 45px rgba(52, 35, 23, 0.22);
    max-height: 92vh;
}

.admin-modal-header {
    background: linear-gradient(135deg, #5a3e2b, #8b5e3c);
    color: #fff;
    border-bottom: none;
    padding: 18px 20px;
}

.admin-modal-header .modal-title {
    color: #fff;
    font-weight: 700;
    letter-spacing: 0.03em;
}

.admin-modal .btn-close {
    filter: brightness(0) invert(1);
    opacity: 0.9;
}

.admin-modal .modal-body {
    padding: 24px 22px;
    color: #4b3621;
    max-height: 72vh;
    overflow-y: auto;
}

.admin-modal .form-control,
.admin-modal .form-select {
    border-radius: 12px;
    border: 1px solid #d8c2ab;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.75);
    color: #4b3621;
}

.admin-modal .form-control:focus,
.admin-modal .form-select:focus {
    border-color: #8b5e3c;
    box-shadow: 0 0 0 0.2rem rgba(139, 94, 60, 0.18);
}

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

.action-btn-secondary {
    background: rgba(91, 94, 100, 0.08);
    color: #4b3621;
    border: 1px solid rgba(91, 94, 100, 0.23);
}

.action-btn-secondary:hover {
    background: #5a3e2b;
    color: #fff;
    border-color: #5a3e2b;
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

.orders-table {
    min-width: 900px;
    width: 100%;
}

.orders-table th,
.orders-table td {
    vertical-align: middle;
}

.orders-table .actions-column {
    width: 116px;
    white-space: nowrap;
}

.order-actions {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 6px;
    width: max-content;
}

@media (max-width: 768px) {
    .admin-modal .modal-dialog {
        width: calc(100vw - 20px);
        margin: 10px auto;
    }

    .admin-modal-content {
        max-height: calc(100dvh - 20px);
        border-radius: 14px;
    }

    .admin-modal .modal-body {
        max-height: calc(100dvh - 176px);
        padding: 18px 14px;
    }

    .orders-table {
        min-width: 760px;
    }
}
</style>
