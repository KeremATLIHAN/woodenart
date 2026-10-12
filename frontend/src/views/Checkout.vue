<template>
    <main class="checkout-page">
        <div class="container checkout-shell">
            <div class="checkout-content">
                <div class="checkout-panel checkout-hero text-center">
                    <img class="checkout-logo d-block mx-auto" src="../assets/img/logo2.png" alt="Woodenart" />
                    <span class="checkout-badge">
                        Güvenli Ödeme
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                            class="bi bi-lock-fill" viewBox="0 0 16 16">
                            <path fill-rule="evenodd"
                                d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4m0 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3" />
                        </svg>
                    </span>
                    <h2 class="checkout-title">Ödeme Sayfası</h2>
                    <p>Sipariş ve teslimat bilgilerinizi güvenle tamamlayın.</p>
                </div>

                <!-- ! Sepet Kismi -->
                <div class="row checkout-grid">
                    <aside class="col-md-5 col-lg-4 order-md-last">
                        <section class="checkout-panel cart-summary-card">
                            <h4 class="panel-title d-flex justify-content-between align-items-center">
                                <span class="text-primary">Sepet</span>
                                <span class="badge bg-primary rounded-pill">{{ gecerliSepet.length }}</span>
                            </h4>
                            <ul class="list-group mb-3">
                                <li class="list-group-item d-flex justify-content-between lh-sm"
                                    v-for="item in gruplanmisSepet" :key="item.key">
                                    <div>
                                        <h6 class="my-0">
                                            {{ item.p_name }}<span v-if="item.adet > 1"> ({{ item.adet }} adet)</span>
                                        </h6>

                                    </div>
                                    <span class="text-body-secondary">{{ formatPrice(Number(item.p_price) * item.adet)
                                    }} ₺</span>
                                </li>
                            </ul>

                            <ul class="list-group mb-3">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span><strong>Toplam (₺)</strong></span> <strong>{{ formatPrice(toplamTutar) }}
                                        ₺</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>KDV (%20) (₺)</span> <span>{{ formatPrice(kdvTutari) }} ₺</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <strong>KDV Dahil (₺)</strong> <strong>{{ formatPrice(kdvDahilTutar) }} ₺</strong>
                                </li>
                            </ul>

                        </section>
                    </aside>

                    <!-- ! Fatura Adresi -->
                    <section class="col-md-7 col-lg-8">
                        <div class="checkout-panel checkout-form-card">
                            <h4 class="panel-title">Fatura Adresi</h4>
                            <form class="needs-validation" @submit.prevent="addUsers">
                                <div class="row g-3">
                                                                        
                                    <div class="col-sm-6">
                                        <label for="billingFirstName" class="form-label">İsim</label>
                                        <input v-model="order[0].name" type="text" class="form-control"
                                            id="billingFirstName" required />

                                    </div>
                                    <div class="col-sm-6">
                                        <label for="billingLastName" class="form-label">Soyisim</label>
                                        <input v-model="order[0].lastName" type="text" class="form-control"
                                            id="billingLastName" required />

                                    </div>

                                    <div class="col-6">
                                        <label for="billingEmail" class="form-label">E-posta
                                            <span class="text-body-secondary">(İsteğe bağlı)</span></label>
                                        <input v-model="order[0].email" type="email" class="form-control"
                                            id="billingEmail" placeholder="you@example.com" />

                                    </div>
                                    <div class="col-6">
                                        <label for="billingPhone" class="form-label">Telefon Numarası
                                            <span class="text-body-secondary">(İsteğe bağlı)</span></label>
                                        <input v-model="order[0].phone" type="tel" class="form-control"
                                            id="billingPhone" placeholder="500 00 00" />

                                    </div>
                                    <div class="col-12 d-flex flex-wrap align-items-center gap-3">
                                        <span class="form-label mb-0">Kayıtlı Adreslerim:</span>
                                        <div v-for="label in addressLabels" :key="label"
                                            class="form-check form-check-inline mb-0">
                                            <input :id="`address-${label}`" v-model="selectedAddressLabel" type="radio"
                                                name="addressType" :value="label" class="form-check-input"
                                                @change="selectAddress(label)" required />
                                            <label class="form-check-label" :for="`address-${label}`">{{ label }}</label>
                                        </div>
                                    </div>
                                    <div v-if="checkoutLoadError || countriesLoadError" class="col-12">
                                        <p class="alert alert-danger mb-0" role="alert">
                                            {{ checkoutLoadError || countriesLoadError }}
                                        </p>
                                    </div>
                                    <div class="col-sm-12">
                                        <label for="tcNumber" class="form-label">TC Kimlik Numarası</label>
                                        <input v-model="order[0].TC" type="text" class="form-control" id="tcNumber"
                                            placeholder="Fatura için gereklidir" required />

                                    </div>
                                    <div class="col-12">
                                        <label for="address" class="form-label">Adres</label>
                                        <textarea v-model="order[0].address" class="form-control" id="address"
                                            placeholder="Mahalle, Sokak, No: 123, Daire: 4" required></textarea>

                                    </div>

                                    <div class="col-md-3">
                                        <label class="form-label">Ülke</label>
                                        <select v-model="order[0].country" class="form-select" required>
                                            <option value="">{{ countriesLoading ? 'Ülkeler yükleniyor...' : 'Seçiniz...' }}</option>
                                            <option v-for="country in countries" :key="country.id"
                                                :value="country.country_name">{{ country.country_name }}</option>
                                        </select>

                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">İl</label>
                                        <input v-model="order[0].city" type="text" class="form-control" required />
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">İlçe</label>
                                        <input v-model="order[0].district" type="text" class="form-control" required />
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Posta Kodu</label>
                                        <input :value="order[0].zip" @input="formatPostalCode" type="text"
                                            class="form-control" inputmode="numeric" autocomplete="postal-code"
                                            maxlength="6" :class="{ 'is-invalid': checkoutSubmitted && checkoutValidation.zip.length }"
                                            required />
                                        <div v-if="checkoutSubmitted && checkoutValidation.zip.length"
                                            class="invalid-feedback d-block">{{ checkoutValidation.zip[0] }}</div>
                                    </div>
                                </div>
                                <hr class="my-4" />
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="same-address" />
                                    <label class="form-check-label" for="same-address">Kargo adresi fatura adresiyle
                                        aynı</label>
                                </div>
                                <div class="form-check">
                                    <template v-if="selectedAddressIsSaved">
                                        <input v-model="updateSavedAddress" type="checkbox" class="form-check-input"
                                            id="update-saved-address" :disabled="!isAuthenticated || !addressesLoaded" />
                                        <label class="form-check-label" for="update-saved-address">
                                            Değişiklikleri kayıtlı adresime uygula
                                        </label>
                                    </template>
                                    <template v-else>
                                        <input v-model="saveInfo" type="checkbox" class="form-check-input"
                                            id="save-info" :disabled="!isAuthenticated || !addressesLoaded" />
                                        <label class="form-check-label" for="save-info">
                                            Bu bilgileri bir sonraki sefere kaydet
                                        </label>
                                    </template>
                                </div>
                                <hr class="my-4" />
                                <h4 class="mb-3">Ödeme</h4>
                                <div class="my-3">
                                    <div class="form-check">
                                        <input id="credit" name="paymentMethod" value="credit" type="radio"
                                            class="form-check-input" checked required />
                                        <label class="form-check-label" for="credit">Kredi Kartı</label>
                                    </div>
                                    <div class="form-check">
                                        <input id="debit" name="paymentMethod" value="debit" type="radio"
                                            class="form-check-input" required />
                                        <label class="form-check-label" for="debit">Banka Kartı</label>
                                    </div>
                                    <div class="form-check">
                                        <input id="paypal" name="paymentMethod" type="radio" class="form-check-input"
                                            value="paypal" required />
                                        <label class="form-check-label" for="paypal">PayPal</label>
                                    </div>
                                </div>
                                <div class="row gy-3">
                                    <div class="col-md-6">
                                        <label for="cc-name" class="form-label">Kart Üzerindeki İsim</label>
                                        <input v-model="payment[0].cardName" type="text" class="form-control"
                                            id="cc-name" placeholder="" required />
                                        <small class="text-body-secondary">Kart üzerinde gösterilen tam isim</small>
                                        <div class="invalid-feedback">Kart üzerindeki isim zorunludur</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="cc-number" class="form-label">Kredi Kartı Numarası</label>
                                        <input :value="payment[0].cardNumber" @input="formatCardNumber" type="text"
                                            class="form-control" id="cc-number" placeholder="0000 0000 0000 0000"
                                            inputmode="numeric" autocomplete="cc-number" maxlength="19"
                                            :class="{ 'is-invalid': checkoutSubmitted && checkoutValidation.cardNumber.length }"
                                            required />
                                        <div v-if="checkoutSubmitted && checkoutValidation.cardNumber.length"
                                            class="invalid-feedback d-block">{{ checkoutValidation.cardNumber[0] }}</div>

                                    </div>
                                    <div class="col-md-3">
                                        <label for="cc-expiration" class="form-label">Son Kullanma Tarihi</label>
                                        <input :value="payment[0].exp" @input="formatExpirationDate" type="text"
                                            class="form-control" id="cc-expiration" placeholder="__/____"
                                            inputmode="numeric" autocomplete="cc-exp" maxlength="7"
                                            :class="{ 'is-invalid': checkoutSubmitted && checkoutValidation.expirationDate.length }"
                                            title="Son kullanma tarihini AA/YYYY biçiminde girin (ör. 06/2026)." required />
                                        <div v-if="checkoutSubmitted && checkoutValidation.expirationDate.length"
                                            class="invalid-feedback d-block">{{ checkoutValidation.expirationDate[0] }}</div>

                                    </div>
                                    <div class="col-md-3">
                                        <label for="cc-cvv" class="form-label">CVV</label>
                                        <input :value="payment[0].cvv" @input="formatCvv" type="text"
                                            class="form-control" id="cc-cvv" inputmode="numeric" autocomplete="cc-csc"
                                            maxlength="3"
                                            :class="{ 'is-invalid': checkoutSubmitted && checkoutValidation.cvv.length }"
                                            required />
                                        <div v-if="checkoutSubmitted && checkoutValidation.cvv.length"
                                            class="invalid-feedback d-block">{{ checkoutValidation.cvv[0] }}</div>

                                    </div>
                                </div>
                                <hr class="my-4" />
                                <button class="w-100 btn btn-primary btn-lg" type="submit"
                                    :disabled="gecerliSepet.length === 0">
                                    Siparişi Tamamla
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>


            <footer class="my-5 pt-5 text-body-secondary text-center text-small">
                <p class="mb-1">&copy; 2026 Woodenart</p>
                <ul class="list-inline">
                    <li class="list-inline-item"><a href="#">Gizlilik</a></li>
                    <li class="list-inline-item"><a href="#">Koşullar</a></li>
                    <li class="list-inline-item"><a href="#">Destek</a></li>
                </ul>
            </footer>
        </div>
    </main>
</template>

<script>
import { showSiteAlert } from '../services/siteAlert.js'
import {
    validateCardNumber,
    validateCvv,
    validateExpirationDate,
    validatePostalCode
} from '../validation.js'

export default {
    name: 'CheckoutPage',
    inject: {
        sepet: {
            default: () => []
        }
    },
    data() {
        return {
            baseUrl: "http://localhost:3001",
            order: [{ TC: "", name: "", lastName: "", email: "", phone: "", address: "", addressType: "Ev", addressId: null, country: "", city: "", district: "", zip: "" }],
            payment: [{ cardName: "", cardNumber: "", exp: "", cvv: "" }],
            addresses: [],
            countries: [],
            countriesLoading: true,
            countriesLoadError: "",
            addressesLoaded: false,
            addressLabels: ["Ev", "İş", "Diğer"],
            selectedAddressLabel: "Ev",
            isAuthenticated: false,
            saveInfo: false,
            updateSavedAddress: false,
            checkoutLoadError: "",
            checkoutSubmitted: false,
        };
    },

    async mounted() {
        await Promise.all([this.loadCountries(), this.loadCheckoutProfile()]);
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
            const products = new Map();
            this.gecerliSepet.forEach((item) => {
                const key = item.p_id ?? `${item.p_name}-${item.p_price}`;
                const existingItem = products.get(key);
                if (existingItem) {
                    existingItem.adet += Number(item.adet ?? 1);
                } else {
                    products.set(key, {
                        ...item,
                        key,
                        adet: Number(item.adet ?? 1)
                    });
                }
            });
            return Array.from(products.values());
        },
        toplamTutar() {
            return this.gruplanmisSepet.reduce(
                (total, item) => total + Number(item.p_price) * item.adet,
                0
            );
        },
        kdvTutari() {
            return this.toplamTutar * 0.2;
        },
        kdvDahilTutar() {
            return this.toplamTutar * 1.2;
        },
        selectedAddressIsSaved() {
            const normalizedLabel = this.selectedAddressLabel.trim().toLocaleLowerCase("tr-TR");
            return this.addresses.some(
                (address) => String(address.a_label).trim().toLocaleLowerCase("tr-TR") === normalizedLabel
            );
        },
        checkoutValidation() {
            return {
                zip: validatePostalCode(this.order[0].zip),
                cardNumber: validateCardNumber(this.payment[0].cardNumber),
                expirationDate: validateExpirationDate(this.payment[0].exp),
                cvv: validateCvv(this.payment[0].cvv)
            };
        }
    },

    methods: {
        formatPrice(price) {
            return new Intl.NumberFormat("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price);
        },
        formatCardNumber(event) {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
            const formatted = digits.match(/.{1,4}/g)?.join(" ") || "";
            this.payment[0].cardNumber = formatted;
            event.target.value = formatted;
        },
        formatPostalCode(event) {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
            this.order[0].zip = digits;
            event.target.value = digits;
        },
        formatExpirationDate(event) {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
            const formatted = digits.length > 2
                ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                : digits;
            this.payment[0].exp = formatted;
            event.target.value = formatted;
        },
        formatCvv(event) {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
            this.payment[0].cvv = digits;
            event.target.value = digits;
        },
        async loadCountries() {
            this.countriesLoading = true;
            this.countriesLoadError = "";
            try {
                const response = await fetch(`${this.baseUrl}/countries`, { cache: "no-store" });
                const countries = await response.json();
                if (!response.ok || !Array.isArray(countries)) {
                    throw new Error(countries?.message || `Ülkeler alınamadı (HTTP ${response.status}).`);
                }
                this.countries = countries;
            } catch (error) {
                this.countriesLoadError = error.message || "Ülkeler yüklenirken hata oluştu.";
            } finally {
                this.countriesLoading = false;
            }
        },
        async loadCheckoutProfile() {
            this.checkoutLoadError = "";
            try {
                const userResponse = await fetch(`${this.baseUrl}/api/auth/me`, {
                    credentials: "include",
                    cache: "no-store"
                });
                if (userResponse.status === 401) return;
                const user = await userResponse.json();
                if (!userResponse.ok) {
                    throw new Error(user.error || `Kullanıcı bilgileri alınamadı (HTTP ${userResponse.status}).`);
                }
                this.isAuthenticated = true;

                Object.assign(this.order[0], {
                    name: user.u_firstName || "",
                    lastName: user.u_lastName || "",
                    email: user.u_email || "",
                    phone: user.u_tel || ""
                });

                const addressesResponse = await fetch(`${this.baseUrl}/api/addresses`, {
                    credentials: "include",
                    cache: "no-store"
                });
                const addresses = await addressesResponse.json();
                if (!addressesResponse.ok) {
                    throw new Error(addresses.error || `Adresler alınamadı (HTTP ${addressesResponse.status}).`);
                }
                if (!Array.isArray(addresses)) {
                    throw new Error("Kayıtlı adres bilgileri beklenen biçimde değil.");
                }

                this.addresses = addresses;
                this.addressesLoaded = true;
                this.selectAddress(this.selectedAddressLabel);
            } catch (error) {
                this.checkoutLoadError = error.message || "Kullanıcı ve adres bilgileri yüklenirken hata oluştu.";
            }
        },
        selectAddress(label) {
            this.saveInfo = false;
            this.updateSavedAddress = false;
            this.selectedAddressLabel = label;
            this.order[0].addressType = label;
            const normalizedLabel = label.trim().toLocaleLowerCase("tr-TR");
            const selectedAddress = this.addresses.find(
                (address) => String(address.a_label).trim().toLocaleLowerCase("tr-TR") === normalizedLabel
            );
            if (!selectedAddress) {
                this.order[0].addressId = null;
                if (this.isAuthenticated) {
                    Object.assign(this.order[0], {
                        TC: "",
                        address: "",
                        country: "",
                        city: "",
                        district: "",
                        zip: ""
                    });
                }
                return;
            }

            this.checkoutLoadError = "";
            Object.assign(this.order[0], {
                addressId: selectedAddress.a_id,
                TC: selectedAddress.a_tckn,
                address: selectedAddress.a_address,
                country: selectedAddress.a_country,
                city: selectedAddress.a_province,
                district: selectedAddress.a_district,
                zip: selectedAddress.a_postal_code
            });
        },
        async saveCheckoutAddress() {
            if ((!this.saveInfo && !this.updateSavedAddress) || !this.isAuthenticated) return;
            if (!this.addressesLoaded) {
                throw new Error("Kayıtlı adresler yüklenemediği için adresiniz kaydedilemedi.");
            }
            const address = this.order[0];
            const isUpdate = address.addressId !== null;
            if (this.updateSavedAddress && !isUpdate) {
                throw new Error("Güncellenecek kayıtlı adres bulunamadı. Lütfen adres seçiminizi kontrol edin.");
            }
            const response = await fetch(
                `${this.baseUrl}/api/addresses${isUpdate ? `/${address.addressId}` : ""}`,
                {
                    method: isUpdate ? "PUT" : "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tckn: address.TC,
                        label: this.selectedAddressLabel,
                        country: address.country,
                        province: address.city,
                        district: address.district,
                        postalCode: address.zip,
                        address: address.address
                    })
                }
            );
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(result?.error || `Adres kaydedilemedi (HTTP ${response.status}).`);
            }

            address.addressId = result.a_id;
            const savedAddress = {
                a_id: result.a_id,
                a_tckn: address.TC,
                a_label: this.selectedAddressLabel,
                a_country: address.country,
                a_province: address.city,
                a_district: address.district,
                a_postal_code: address.zip,
                a_address: address.address
            };
            const existingIndex = this.addresses.findIndex(
                (item) => String(item.a_id) === String(result.a_id)
            );
            if (existingIndex === -1) {
                this.addresses.push(savedAddress);
            } else {
                this.addresses.splice(existingIndex, 1, savedAddress);
            }
            this.saveInfo = false;
            this.updateSavedAddress = false;
        },
        async addUsers() {
            this.productMessage = null;
            this.checkoutSubmitted = true;
            if (this.gecerliSepet.length === 0) {
                showSiteAlert("Boş sepet ile sipariş oluşturulamaz.", "error");
                return;
            }
            const validationErrors = Object.values(this.checkoutValidation).flat();
            if (validationErrors.length > 0) {
                showSiteAlert(validationErrors[0], "error");
                return;
            }
            try {
                await this.saveCheckoutAddress();
                const res = await fetch(`${this.baseUrl}/api/orders`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sepet: this.gecerliSepet,
                        order: this.order
                    })
                });
                const result = await res.json().catch(() => null);
                if (!res.ok) {
                    throw new Error(result?.error || `Sipariş oluşturulamadı (HTTP ${res.status}).`);
                }
                this.sepet.splice(0, this.sepet.length);
                showSiteAlert("Siparişiniz başarıyla alındı. Teşekkür ederiz!");

            }

            catch (e) {
                this.productMessage = e.message;
                showSiteAlert(e.message || "Sipariş oluşturulamadı.", "error");
            }
        },


    }
};
</script>

<style scoped>
.checkout-page {
    position: relative;
    width: 100%;
    min-height: calc(100dvh - 80px);
    padding: 32px 0 24px;
    color: #4b3621;
    background-image: url("../assets/img/background.png");
    background-position: center 40%;
    background-size: cover;
    background-repeat: no-repeat;
    background-attachment: fixed;
    isolation: isolate;
}

.checkout-page::before {
    position: absolute;
    z-index: 0;
    content: "";
    inset: 0;
    background: rgba(0, 0, 0, 0.24);
}

.checkout-shell {
    position: relative;
    z-index: 1;
    width: calc(100% - clamp(24px, 4vw, 72px));
    max-width: 1760px;
    padding-right: 0;
    padding-left: 0;
}

.checkout-panel {
    width: 100%;
    padding: 26px;
    background: rgba(255, 250, 245, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 20px;
    box-shadow: 0 18px 42px rgba(52, 35, 23, 0.2);
    backdrop-filter: blur(6px);
}

.checkout-hero {
    margin-bottom: clamp(20px, 3vw, 34px);
}

.checkout-grid {
    --bs-gutter-x: clamp(20px, 3vw, 40px);
    --bs-gutter-y: clamp(20px, 3vw, 32px);
    align-items: flex-start;
}

.checkout-grid>[class*="col-"] {
    display: flex;
}

.checkout-logo {
    width: clamp(190px, 18vw, 250px);
    height: auto;
    margin-bottom: 14px;
}

.checkout-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    padding: 5px 13px;
    color: #8b5e3c;
    background: rgba(230, 189, 141, 0.28);
    border: 1px solid rgba(195, 138, 78, 0.35);
    border-radius: 999px;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.checkout-hero h2 {
    margin-bottom: 6px;
    color: #5a3e2b;
    font-weight: 800;
}

.checkout-hero p {
    margin: 0;
    color: #6e5542;
}

.cart-summary-card,
.checkout-form-card {
    background: rgba(255, 250, 245, 0.92);
}

.cart-summary-card {
    position: sticky;
    top: 20px;
}

.panel-title {
    margin: 0 0 22px;
    padding-bottom: 13px;
    border-bottom: 2px solid rgba(195, 138, 78, 0.32);
}

.checkout-page h4,
.checkout-page .text-primary {
    color: #5a3e2b !important;
    font-weight: 750;
}

.checkout-page .badge {
    background: #8b5e3c !important;
}

.checkout-page .list-group-item {
    color: #4b3621;
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(139, 94, 60, 0.2);
}

.checkout-page .form-label,
.checkout-page .form-check-label {
    color: #4b3621;
    font-weight: 600;
}

.checkout-page .form-control,
.checkout-page .form-select {
    min-height: 44px;
    color: #4b3621;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(139, 94, 60, 0.34);
    border-radius: 11px;
}

.checkout-page textarea.form-control {
    min-height: 110px;
}

.checkout-page .form-control:focus,
.checkout-page .form-select:focus,
.checkout-page .form-check-input:focus {
    border-color: #8b5e3c;
    box-shadow: 0 0 0 0.2rem rgba(139, 94, 60, 0.18);
}

.checkout-page .form-check-input:checked {
    background-color: #8b5e3c;
    border-color: #8b5e3c;
}

.checkout-page hr {
    border-color: rgba(139, 94, 60, 0.22);
    opacity: 1;
}

.checkout-page .btn-primary {
    padding: 12px 18px;
    color: #fff;
    background: linear-gradient(135deg, #8b5e3c, #6e472e);
    border: 2px solid #c38a4e;
    border-radius: 999px;
    font-weight: 700;
    box-shadow: 0 10px 22px rgba(95, 64, 39, 0.2);
    transition: all 0.2s ease;
}

.checkout-page .btn-primary:hover {
    background: #c38a4e;
    border-color: #c38a4e;
    transform: translateY(-2px);
}

.checkout-page footer {
    margin-bottom: 0 !important;
    color: #f7f3ee !important;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.checkout-page footer a {
    color: #f5e6d3;
    font-weight: 600;
}

@media (max-width: 767.98px) {
    .checkout-page {
        padding: 18px 0;
        background-attachment: scroll;
    }

    .checkout-panel {
        padding: 20px 16px;
        border-radius: 16px;
    }

    .cart-summary-card {
        position: static;
    }

    .checkout-grid {
        --bs-gutter-x: 0;
        --bs-gutter-y: 20px;
    }
}
</style>
