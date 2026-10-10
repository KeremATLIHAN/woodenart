<!--! Tasarimlarin oldugu yer -->
<template>
    <Teleport to="body">
        <!--! Urun Ekle Modal -->
        <div class="modal fade admin-modal" id="addProductModal" tabindex="-1" aria-labelledby="addProductModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content admin-modal-content">
                    <div class="modal-header admin-modal-header">
                        <h1 class="modal-title fs-5" id="addProductModalLabel">Ürün Ekle</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form @submit.prevent="addProduct()">
                        <div class="modal-body">
                            <div class="mb-3 row">
                                <label class="col-sm-4 col-form-label">Ürün Adı:</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control" v-model="product.p_name" required>
                                </div>
                            </div>

                            <div class="mb-3 row">
                                <label class="col-sm-4 col-form-label">Stok:</label>
                                <div class="col-sm-8">
                                    <input type="number" min="0" class="form-control" v-model="product.p_stock"
                                        required>
                                </div>
                            </div>

                            <div class="mb-3 row">
                                <label class="col-sm-4 col-form-label">Ürün Fiyatı:</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control" v-model.number="product.p_price"
                                        pattern="[0-9]+([.][0-9]{1,2})?" required>

                                </div>
                            </div>

                            <div class="mb-3 row">
                                <label class="col-sm-4 col-form-label" for="productType">Ürün Türü:</label>
                                <div class="col-sm-8">
                                    <select id="productType" class="form-select" v-model.number="product.p_type" required>
                                        <option disabled value="">Ürün türü seçiniz</option>
                                        <option :value="1">Tamamlanan Ürün</option>
                                        <option :value="2">Devam Eden Ürün</option>
                                        <option :value="3">Aletler</option>
                                    </select>
                                </div>
                            </div>

                            <div class="mb-3 row">
                                <label class="col-sm-4 col-form-label">Kapak Resmi:</label>
                                <div class="col-sm-8">
                                    <input ref="mainImageInput" type="file" class="form-control" accept="image/*"
                                        @change="handleMainImageUpload" required>
                                    <small v-if="product.p_imgMain" class="selected-files">{{ product.p_imgMain
                                    }}</small>
                                </div>
                            </div>
                            <div class="mb-3 row">
                                <label class="col-sm-4 col-form-label">Detay Resimler:</label>
                                <div class="col-sm-8">
                                    <input ref="detailImagesInput" type="file" class="form-control" accept="image/*" multiple
                                        @change="handleDetailImagesUpload" required>
                                    <small v-if="detailImageNames.length" class="selected-files">
                                        {{ detailImageNames.join(', ') }}
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn wooden-btn w-100" type="submit">Ürün Ekle</button>
                            <label>{{ productMessage }}</label>
                        </div>
                        <div v-if="error" class="alert alert-danger mx-3" role="alert">
                            {{ error }}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>


    <!--! URUNLERIMIZ -->
    <div class="table-toolbar">
        <h3>Ürünlerimiz</h3>
        <button type="button" class="btn wooden-btn btn-sm" @click="openAddProductModal()">
            Ürün Ekle
        </button>
    </div>
    <div class="table-responsive">
        <table class="table table-striped products-table">
            <thead>
                <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Ürün Adı</th>
                    <th scope="col">Ürün Türü</th>
                    <th scope="col">Stok</th>
                    <th scope="col">Fiyat</th>
                    <th scope="col">Fiyat(KDV Dahil)</th>
                    <th scope="col" class="actions-column">İşlem</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="product in products" :key="product.p_id">
                    <th scope="row">{{ product.p_id }}</th>
                    <td><input class="form-control" type="text" v-model="product.p_name"></td>
                    <td>
                        <select class="form-control" v-model.number="product.p_type">
                            <option value="">Tür seçiniz</option>
                            <option :value="1">Tamamlanan Ürün</option>
                            <option :value="2">Devam Eden Ürün</option>
                            <option :value="3">Aletler</option>
                        </select>
                    </td>
                    <td><input class="form-control" type="number" min="0" v-model="product.p_stock"></td>
                    <td><input class="form-control" type="number" min="0" v-model="product.p_price"></td>
                <td><input class="form-control" type="number" min="0" :value="product.p_price * 1.20" readonly></td>
                <td class="actions-column">
                    <div class="product-actions">
                        <button type="button" class="btn btn-sm action-btn action-btn-primary"
                            title="Ürünü güncelle" aria-label="Ürünü güncelle"
                            @click="updateProduct(product.p_id, product.p_name, Number(product.p_type), product.p_stock, product.p_price)">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="m16 3 5 5-12 12H4v-5L16 3Z" />
                                <path d="m13 6 5 5" />
                            </svg>
                        </button>
                        <button type="button" class="btn btn-sm action-btn action-btn-danger"
                            title="Ürünü sil" aria-label="Ürünü sil" @click="deleteProduct(product.p_id)">
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
</template>

<!--! Program ve fonksiyonlarin oldugu yer -->
<script>
import { Modal } from 'bootstrap';
import { showSiteAlert } from '../services/siteAlert.js'

export default {
    //! Data degisken tanimladigimiz yer
    data() {
        return {
            // inject :['products'],
            product: {
                p_name: "",
                p_stock: 0,
                p_price: 0,
                p_type: "",
                p_imgMain: "",
                p_imgDetails: "",

            },
            productTypeOptions: [
                { value: 1, label: "Tamamlanan Ürün" },
                { value: 2, label: "Devam Eden Ürün" },
                { value: 3, label: "Aletler" }
            ],
            detailImageNames: [],
            products: [],
            productMessage: null,
            baseUrl: "http://localhost:3001",
            productModal: null

        };
    },
    //! Sayfa ilk yuklendiginde direkt calisacak kodlar
    mounted() {
        this.getProducts();
        this.$nextTick(() => {
            const modalEl = document.getElementById('addProductModal');
            if (!modalEl) return;
            this.productModal = Modal.getOrCreateInstance(modalEl);
            modalEl.addEventListener('hidden.bs.modal', this.handleModalHidden);
        });
    },
    beforeUnmount() {
        if (this.productModal) {
            this.productModal.hide();
            this.productModal.dispose();
            this.productModal = null;
        }
        const modalEl = document.getElementById('addProductModal');
        if (modalEl) {
            modalEl.removeEventListener('hidden.bs.modal', this.handleModalHidden);
        }
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
    },
    //! Degiskeni izler, Degiskenlerde bir degisiklik yapildiginda degismesini izledigimiz kodlar
    watch: {
    },
    //! Var olan dizi uzerinde degisiklik yapacaksak ve yeni deger ureteceksek kullaniriz.Orn; kdv hesaplama, indirim hesaplama gibi islemler yapacaksak kullaniriz.
    computed: {
    },
    //! Bildigimiz fonksiyonlarin oldugu yer.Bir etkilesime girince calisacak fonksiyonlari burada tanimlariz.
    methods: {
        handleModalHidden() {
            this.productMessage = null;
        },
        openAddProductModal() {
            this.$nextTick(() => {
                if (!this.productModal) {
                    const modalEl = document.getElementById('addProductModal');
                    if (modalEl) this.productModal = Modal.getOrCreateInstance(modalEl);
                }
                this.productModal?.show();
            });
        },
        closeAddProductModal() {
            this.productModal?.hide();
        },
        productImagePath(file) {
            const folder = Number(this.product.p_type) === 3 ? "Tools/" : "";
            return `src/assets/img/products/${folder}${file.name}`;
        },
        handleMainImageUpload(event) {
            const [file] = Array.from(event.target.files || []);
            this.product.p_imgMain = file ? this.productImagePath(file) : "";
        },
        handleDetailImagesUpload(event) {
            const files = Array.from(event.target.files || []);
            this.detailImageNames = files.map((file) => file.name);
            this.product.p_imgDetails = files.map((file) => this.productImagePath(file)).join(";");
        },
        resetImageInputs() {
            if (this.$refs.mainImageInput) this.$refs.mainImageInput.value = "";
            if (this.$refs.detailImagesInput) this.$refs.detailImagesInput.value = "";
            this.detailImageNames = [];
        },

        async getProducts() {

            try {
                const res = await fetch(`${this.baseUrl}/api/products`, { credentials: "include" });
                if (!res.ok) throw new Error("Products endpoint hatası");
                this.products = await res.json();
            } catch (e) {
                console.error(e.message);
            }
        },

        async addProduct() {
            this.productMessage = null;
            try {
                const res = await fetch(`${this.baseUrl}/api/products`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: this.product.p_name,
                        stock: Number(this.product.p_stock),
                        price: Number(this.product.p_price),
                        type: Number(this.product.p_type),
                        imgMain: this.product.p_imgMain,
                        imgDetails: this.product.p_imgDetails
                    })
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    throw new Error(data?.error || (typeof data === "string" && data) || `Ürün eklenemedi (HTTP ${res.status})`);
                }
                this.productMessage = data;
                await this.getProducts(); // Ürünleri tekrar yükle
                this.product = {
                    p_name: "",
                    p_stock: 0,
                    p_price: 0,
                    p_type: "",
                    p_imgMain: "",
                    p_imgDetails: ""
                };
                this.resetImageInputs();
                this.closeAddProductModal();
            }

            catch (e) {
                this.productMessage = e.message;
            }


        },

        getProductTypeLabel(type) {
            const productType = this.productTypeOptions.find((option) => Number(option.value) === Number(type));
            return productType ? productType.label : "Bilinmeyen";
        },
        async updateProduct(p_id, p_name, p_type, p_stock, p_price) {
            this.productMessage = null;
            try {
                const payload = {
                    name: p_name,
                    stock: Number(p_stock),
                    price: Number(p_price),
                    type: Number(p_type)
                };

                const res = await fetch(`${this.baseUrl}/api/products/${p_id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    throw new Error(data?.error || `Ürün güncellenemedi (HTTP ${res.status})`);
                }

                if (data) showSiteAlert("Ürün başarıyla güncellendi!");
                await this.getProducts();

            }

            catch (e) {
                console.error(e.message);
            }


        },

        async deleteProduct(p_id) {
            this.productMessage = null;
            try {
                const res = await fetch(`${this.baseUrl}/api/products/${p_id}`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },

                });
                if (!res.ok) throw new Error("deleteProducts endpoint hatası");

                const data = await res.json();
                if (data) showSiteAlert("Ürün başarıyla silindi!");
                this.getProducts(); // Ürünleri tekrar yükle

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

.selected-files {
    display: block;
    margin-top: 6px;
    color: #6e472e;
    overflow-wrap: anywhere;
}

.admin-modal .modal-footer {
    border-top: 1px solid rgba(94, 61, 39, 0.08);
    background: rgba(255, 255, 255, 0.28);
    padding: 18px 22px 22px;
}

.wooden-btn {
    background: #e6bd8d;
    border: 2px solid #c38a4e;
    color: #4b3621;
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    transition: all 0.3s ease;
    box-shadow: 0 8px 18px rgba(95, 64, 39, 0.12);
}

.wooden-btn:hover {
    background: #c38a4e;
    border-color: #c38a4e;
    color: #fff;
    transform: translateY(-2px);
}

.action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 999px;
    font-weight: 600;
    transition: all 0.2s ease;
}

.product-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    width: max-content;
}

.action-btn svg {
    display: block;
    width: 18px;
    height: 18px;
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
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    margin-bottom: 12px;
}

.table-toolbar h3 {
    margin: 0;
}

.products-table {
    min-width: 940px;
    width: 100%;
}

.products-table th,
.products-table td {
    vertical-align: middle;
}

.products-table .actions-column {
    width: 90px;
    white-space: nowrap;
}

.product-actions {
    flex-wrap: nowrap;
    white-space: nowrap;
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

    .admin-modal .modal-footer {
        gap: 8px;
        padding: 14px;
    }

    .products-table {
        min-width: 760px;
    }

}
</style>
