<!--! Tasarimlarin oldugu yer -->
<template>

    <button class="cart-trigger" type="button" data-bs-toggle="offcanvas" data-bs-target="#sepetSidebar"
        aria-controls="sepetSidebar" aria-label="Sepeti aç">
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 7H7" />
            <circle cx="10" cy="19" r="1.5" />
            <circle cx="18" cy="19" r="1.5" />
        </svg>
        <span v-if="gecerliSepet.length" class="cart-count">{{ gecerliSepet.length }}</span>
    </button>
    <!-- ! Sepet Sidebar -->


    <teleport to="body">
        <div class="offcanvas offcanvas-end sepet-sidebar" tabindex="-1" id="sepetSidebar" aria-labelledby="offcanvasExampleLabel">
            <div class="offcanvas-header cart-header">
                <h5 class="offcanvas-title" id="offcanvasExampleLabel">Sepet</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                <div class="row cart-column-head">
                    <div class="col-8"><strong>Ürün Adı</strong></div>
                    <div class="col-4"><strong>Fiyat</strong></div>
                </div>

                <p v-if="gruplanmisSepet.length === 0" class="empty-cart">
                    Sepetiniz boş.
                </p>

                <div v-else>
                    <div class="row cart-item" v-for="item in gruplanmisSepet" :key="item.key">
                        <div class="col-8">{{ item.p_name }}</div>
                        <div class="col-4">{{ formatPrice(item.p_price * item.adet) }} TL</div>
                        <div class="cart-item-actions">
                            <div class="quantity-control" :aria-label="`${item.p_name} ürün adedi`">
                                <button
                                    class="quantity-button"
                                    type="button"
                                    :disabled="item.adet <= 1"
                                    :aria-label="`${item.p_name} ürün adedini azalt`"
                                    @click="decrementItem(item.key)"
                                >−</button>
                                <span>{{ item.adet }}</span>
                                <button
                                    class="quantity-button"
                                    type="button"
                                    :disabled="!canIncrement(item)"
                                    :aria-label="`${item.p_name} ürün adedini artır`"
                                    @click="incrementItem(item)"
                                >+</button>
                            </div>
                            <button
                                class="remove-item"
                                type="button"
                                @click="deleteItem(item.key)"
                                :aria-label="`${item.p_name} ürününü sepetten sil`"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>

                <div class="row cart-total">   
                    <div class="col-8"><strong>Toplam Tutar:</strong></div>
                    <div class="col-4"><strong>{{ formatPrice(toplamTutar) }} TL</strong></div>
                </div>

                <div class="cart-actions">
                    <button class="checkout-button" type="button" @click="goToCheckout">
                        Ödeme Sayfasına Geç
                    </button>
                </div>
            </div>
        </div>
    </teleport>

</template>

<!--! Program ve fonksiyonlarin oldugu yer -->
<script>
import { Offcanvas } from 'bootstrap';
import { showSiteAlert } from '../services/siteAlert.js'

export default {
    name: 'ShoppingCart',
    inject: {
        sepet: {
            default: () => []
        }
    },
    data() {
        return {

        };
    },

    mounted() {

    },
    watch: {

    },

    computed: {
        gecerliSepet() {
            return this.sepet.filter((item) => item
                && typeof item.p_name === "string"
                && item.p_name.trim() !== ""
                && Number.isFinite(Number(item.p_price))
                && Number(item.p_price) >= 0);
        },
        gruplanmisSepet() {
            const urunler = new Map();

            this.gecerliSepet.forEach((item) => {
                const key = item.p_id ?? `${item.p_name}-${item.p_price}`;
                const mevcutUrun = urunler.get(key);

                if (mevcutUrun) {
                    mevcutUrun.adet += 1;
                } else {
                    urunler.set(key, { ...item, key, adet: 1 });
                }
            });

            return Array.from(urunler.values());
        },
        toplamTutar() {
            return this.gruplanmisSepet.reduce(
                (toplam, item) => toplam + Number(item.p_price) * item.adet,
                0
            );
        }
    },

    methods: {

        goToCheckout() {
            if (this.gecerliSepet.length === 0) {
                showSiteAlert("Ödeme sayfasına geçmek için sepetinize ürün ekleyin.", "error");
                return;
            }

            const offcanvasElement = document.getElementById('sepetSidebar');
            const offcanvas = offcanvasElement ? Offcanvas.getOrCreateInstance(offcanvasElement) : null;

            if (!offcanvasElement || !offcanvas) {
                this.$router.push({ name: 'checkout' });
                return;
            }

            offcanvasElement.addEventListener(
                'hidden.bs.offcanvas',
                () => this.$router.push({ name: 'checkout' }),
                { once: true }
            );
            offcanvas.hide();
        },

        canIncrement(item) {
            const stock = Number(item.p_stock);
            const limit = Number.isFinite(stock) && stock > 0 ? stock : 1;
            return item.adet + 1 <= limit;
        },

        incrementItem(item) {
            if (!this.canIncrement(item)) {
                showSiteAlert(
                    Number(item.p_stock) > 0
                        ? `Bu üründen en fazla ${item.p_stock} adet sipariş verebilirsiniz.`
                        : 'Stokta olmayan üründen en fazla 1 adet sipariş verebilirsiniz.',
                    'error'
                );
                return;
            }

            const cartItem = this.sepet.find((product) => {
                const productKey = product.p_id ?? `${product.p_name}-${product.p_price}`;
                return productKey === item.key;
            });
            if (cartItem) this.sepet.push({ ...cartItem });
        },

        decrementItem(key) {
            for (let index = this.sepet.length - 1; index >= 0; index--) {
                const item = this.sepet[index];
                const itemKey = item.p_id ?? `${item.p_name}-${item.p_price}`;

                if (itemKey === key) {
                    this.sepet.splice(index, 1);
                    return;
                }
            }
        },

        deleteItem(key) {
            for (let index = this.sepet.length - 1; index >= 0; index--) {
                const item = this.sepet[index];
                const itemKey = item.p_id ?? `${item.p_name}-${item.p_price}`;

                if (itemKey === key) {
                    this.sepet.splice(index, 1);
                }
            }
        },

        formatPrice(price) {
            return Number(price).toLocaleString('tr-TR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
        }

    }
};
</script>


<!--! CSS kodlarimizin oldugu yer -->
<!--! scoped yazmamin nedeni yazacagim kodlarin sadece bu sayfada gecerli olmasi -->
<style scoped>
.cart-trigger {
    position: fixed;
    top: 50%;
    right: 0;
    z-index: 1040;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 58px;
    height: 58px;
    padding: 0;
    color: #fff;
    background: #8b5e3c;
    border: 0;
    border-radius: 18px 0 0 18px;
    box-shadow: 0 10px 24px rgba(52, 35, 23, 0.28);
    transform: translateY(-50%);
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.cart-trigger svg {
    width: 30px;
    height: 30px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
}

.cart-trigger:hover {
    background: #c38a4e;
    color: #fff;
    transform: translateY(-50%) translateX(-3px);
}

.cart-trigger:focus-visible {
    outline: 3px solid rgba(230, 189, 141, 0.8);
    outline-offset: 3px;
}

.cart-count {
    position: absolute;
    top: -7px;
    left: -7px;
    display: grid;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    place-items: center;
    color: #fff;
    background: #dc3545;
    border: 2px solid #fff;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
}

.sepet-sidebar {
    z-index: 1200 !important;
    width: min(420px, 92vw) !important;
    color: #4b3621;
    background:
        linear-gradient(rgba(255, 250, 245, 0.94), rgba(255, 250, 245, 0.94)),
        url("../assets/img/background.png") center / cover;
    border-left: 1px solid rgba(94, 61, 39, 0.24);
    box-shadow: -18px 0 42px rgba(52, 35, 23, 0.24);
}

.cart-header {
    padding: 22px 24px;
    color: #fff;
    background: linear-gradient(135deg, #5a3e2b, #8b5e3c);
    border-bottom: 3px solid #e6bd8d;
}

.cart-header .offcanvas-title {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.04em;
}

.cart-header .btn-close {
    filter: brightness(0) invert(1);
    opacity: 0.9;
}

.offcanvas-body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 24px;
}

.cart-column-head {
    padding: 10px 4px;
    color: #6e472e;
    border-bottom: 1px solid rgba(139, 94, 60, 0.3);
}

.offcanvas-backdrop.show {
    opacity: 0.45;
}

.empty-cart {
    margin: 18px 0;
    padding: 36px 18px;
    color: #6e472e;
    text-align: center;
    background: rgba(255, 255, 255, 0.62);
    border: 1px dashed #c38a4e;
    border-radius: 14px;
}

.cart-item {
    position: relative;
    width: 100%;
    margin-right: 0;
    margin-left: 0;
    margin-bottom: 12px;
    padding: 16px 12px 54px;
    background: rgba(255, 255, 255, 0.68);
    border: 1px solid rgba(139, 94, 60, 0.18);
    border-radius: 14px;
    box-shadow: 0 8px 18px rgba(95, 64, 39, 0.08);
}

.cart-item-actions {
    position: absolute;
    right: 12px;
    bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    width: auto;
}

.quantity-control {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4b3621;
    font-weight: 700;
}

.quantity-button {
    display: inline-grid;
    width: 30px;
    height: 30px;
    padding: 0;
    place-items: center;
    color: #6e472e;
    background: rgba(230, 189, 141, 0.2);
    border: 1px solid rgba(139, 94, 60, 0.4);
    border-radius: 50%;
    font-size: 1.1rem;
    line-height: 1;
}

.quantity-button:hover:not(:disabled) {
    color: #fff;
    background: #8b5e3c;
}

.quantity-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
}

.remove-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: auto;
    min-width: 56px;
    padding: 2px 10px;
    color: #b02a37;
    background: transparent;
    border: 1px solid rgba(220, 53, 69, 0.35);
    border-radius: 999px;
    font-size: 0.875rem;
    line-height: 1.25;
    transition: all 0.2s ease;
}

.remove-item:hover {
    color: #fff;
    background: #dc3545;
    border-color: #dc3545;
}

.cart-total {
    margin: auto 0 0;
    padding: 16px 12px;
    background: rgba(230, 189, 141, 0.26);
    border: 1px solid rgba(139, 94, 60, 0.24);
    border-radius: 14px;
}

.cart-actions {
    padding-top: 2px;
}

.checkout-button {
    width: 100%;
    padding: 12px 18px;
    color: #fff;
    background: linear-gradient(135deg, #8b5e3c, #6e472e);
    border: 2px solid #c38a4e;
    border-radius: 999px;
    font-weight: 700;
    letter-spacing: 0.02em;
    box-shadow: 0 10px 20px rgba(95, 64, 39, 0.2);
    transition: all 0.2s ease;
}

.checkout-button:hover {
    background: #c38a4e;
    transform: translateY(-2px);
}

.checkout-button:focus-visible {
    outline: 3px solid rgba(195, 138, 78, 0.4);
    outline-offset: 3px;
}

@media (max-width: 767.98px) {
    .cart-trigger {
        top: auto;
        right: 16px;
        bottom: 20px;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        transform: none;
    }

    .cart-trigger:hover {
        transform: translateY(-3px);
    }
}
</style>
