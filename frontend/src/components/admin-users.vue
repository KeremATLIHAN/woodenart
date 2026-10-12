<!--! Tasarimlarin oldugu yer -->
<template>

    <Teleport to="body">
      <!--! Kullanici Ekle Modal -->
      <div class="modal fade admin-modal" id="addUser" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content admin-modal-content">
                <div class="modal-header admin-modal-header">
                    <h1 class="modal-title fs-5" id="addUserModalLabel">Kullanıcı Ekle</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form novalidate @submit.prevent="addUsers">
                    <div class="modal-body row g-3">

                        <div class="col-md-6" mt-2>
                            <label class="form-label">Isim*</label>
                            <input type="text" class="form-control" v-model="newUser[0].u_firstName"
                                @blur="addUserTouched.firstName = true" required>
                            <small v-for="error in addUserFieldErrors('firstName')" :key="error" class="text-danger d-block">{{ error }}</small>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Soyisim*</label>
                            <input type="text" class="form-control" v-model="newUser[0].u_lastName"
                                @blur="addUserTouched.lastName = true" required>
                            <small v-for="error in addUserFieldErrors('lastName')" :key="error" class="text-danger d-block">{{ error }}</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Email*</label>
                            <input type="email" class="form-control" v-model="newUser[0].u_email"
                                @blur="addUserTouched.email = true" placeholder="example@hotmail.com" required>
                            <small v-for="error in addUserFieldErrors('email')" :key="error" class="text-danger d-block">{{ error }}</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Doğum Tarihi*</label>
                            <input type="date" class="form-control" v-model="newUser[0].u_birthday"
                                @blur="addUserTouched.birthday = true" required>
                            <small v-for="error in addUserFieldErrors('birthday')" :key="error" class="text-danger d-block">{{ error }}</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Kod*</label>
                            <div class="dropdown country-picker">
                                <button
                                    id="adminCountryDropdown"
                                    class="form-select country-picker-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    :disabled="countriesLoading || countries.length === 0"
                                    @blur="addUserTouched.code = true"
                                >
                                    <span v-if="countriesLoading">Ülkeler yükleniyor...</span>
                                    <span v-else-if="selectedCountry" class="country-option">
                                        <img
                                            :src="flagImageUrl(selectedCountry.country_code)"
                                            :alt="`${selectedCountry.country_name} bayrağı`"
                                            class="country-flag"
                                        >
                                        <span>{{ selectedCountry.country_name }}</span>
                                    </span>
                                    <span v-else>Ülke seçiniz</span>
                                </button>
                                <ul class="dropdown-menu country-picker-menu">
                                    <li v-for="country in countries" :key="country.id">
                                        <button class="dropdown-item country-option" type="button"
                                            @click="selectCountry(country)">
                                            <img
                                                :src="flagImageUrl(country.country_code)"
                                                :alt="`${country.country_name} bayrağı`"
                                                class="country-flag"
                                                loading="lazy"
                                            >
                                            <span>{{ country.country_name }}</span>
                                        </button>
                                    </li>
                                </ul>
                                <input id="admin_user_code" type="hidden" :value="newUser[0].u_code">
                            </div>
                            <small v-for="error in addUserFieldErrors('code')" :key="error" class="text-danger d-block">{{ error }}</small>
                            <small v-if="countriesError" class="text-danger d-block mt-1">{{ countriesError }}</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Telefon*</label>
                            <input type="tel" class="form-control" v-model="newUser[0].u_tel"
                                @blur="addUserTouched.tel = true" required>
                            <small v-for="error in addUserFieldErrors('tel')" :key="error" class="text-danger d-block">{{ error }}</small>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Parola*</label>
                            <input type="password" class="form-control" v-model="newUser[0].u_pass"
                                @blur="addUserTouched.password = true" required>
                            <small v-for="error in addUserFieldErrors('password')" :key="error" class="text-danger d-block">{{ error }}</small>

                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Parola Tekrar*</label>
                            <input type="password" class="form-control" v-model="newUser[0].u_repeatPass"
                                @blur="addUserTouched.confirmPassword = true" required>
                            <small v-for="error in addUserFieldErrors('confirmPassword')" :key="error" class="text-danger d-block">{{ error }}</small>

                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Rol</label>
                            <select class="form-select" v-model="newUser[0].u_role"
                                @blur="addUserTouched.role = true" required>
                                <option value=0>Kullanıcı</option>
                                <option value=1>Admin</option>
                            </select>
                            <small v-for="error in addUserFieldErrors('role')" :key="error" class="text-danger d-block">{{ error }}</small>
                        </div>

                        <div class="col-12">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" v-model="newUser[0].u_check"
                                    @change="addUserTouched.accepted = true" required>
                                <label class="form-check-label">Bilgilerimin doğruluğunu kabul ediyor ve
                                    onaylıyorum.</label>
                                <small v-for="error in addUserFieldErrors('accepted')" :key="error" class="text-danger d-block">{{ error }}</small>
                            </div>
                        </div>


                        <br>
                        <a href="" data-bs-toggle=" modal" data-bs-target="#login">Hesabin varsa giris yapmak icin
                            tiklayiniz</a>
                    </div>
                    <div class="modal-footer">
                        <button class="btn wooden-btn w-100" type="submit"
                            :disabled="addUserLoading || !canAddUser">
                            {{ addUserLoading ? 'Ekleniyor...' : 'Kullanıcı Ekle' }}
                        </button>
                        <span v-if="userMessage">{{ userMessage }}</span>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </Teleport>


    <!--! KULLANICILAR -->

    <div class="table-toolbar">
        <h3>Kullanıcılarımız</h3>
        <button type="button" class="btn wooden-btn btn-sm" @click="openAddUserModal">
            Kullanıcı Ekle
        </button>
    </div>

    <div class="table-responsive">
    <table class="table table-striped users-table">
        <thead>
            <tr>
                <th scope="col">ID</th>
                <th scope="col">Ad</th>
                <th scope="col">Soyad</th>
                <th scope="col">Email</th>
                <th scope="col">Doğum Tarihi</th>
                <th scope="col">Telefon</th>
                <th scope="col">Yeni Parola</th>
                <th scope="col">Role</th>
                <th scope="col" class="actions-column">İşlem</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(user, index) in users" :key="user.u_id">
                <th scope="row">#{{ index + 1 }}</th>
                <td><input class="form-control" type="text" v-model="user.u_firstName"></td>
                <td><input class="form-control" type="text" v-model="user.u_lastName"></td>
                <td><input class="form-control" type="text" v-model="user.u_email"></td>
                <td><input class="form-control" type="date" v-model="user.u_birthday"></td>
                <td><input class="form-control" type="text" v-model="user.u_tel"></td>
                <td>
                    <input class="form-control" type="password" v-model="user.newPassword"
                        autocomplete="new-password" placeholder="Değiştirmek için yazın"
                        aria-label="Yeni parola">
                </td>
                <td>
                    <select class="form-select mb-4" v-model="user.u_role">
                        <option value=0>Kullanıcı</option>
                        <option value=1>Admin</option>
                    </select>
                </td>
                <td class="actions-column">
                    <div class="user-actions">
                        <button type="button" class="btn btn-sm action-btn action-btn-primary"
                            title="Kullanıcıyı güncelle" aria-label="Kullanıcıyı güncelle"
                            @click="updateUser(user.u_id, user.u_firstName, user.u_lastName, user.u_email, user.u_birthday, user.u_code, user.u_tel, user.newPassword, user.u_role)">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="m16 3 5 5-12 12H4v-5L16 3Z" />
                                <path d="m13 6 5 5" />
                            </svg>
                        </button>
                        <button type="button" class="btn btn-sm action-btn action-btn-danger"
                            title="Kullanıcıyı sil" aria-label="Kullanıcıyı sil" @click="deleteUser(user.u_id)">
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
import { Dropdown, Modal } from 'bootstrap';
import { validateRegistration } from '../validation.js'
import { showSiteAlert } from '../services/siteAlert.js'

export default {
    //! Data degisken tanimladigimiz yer
    data() {
        return {
            userMessage: null,
            baseUrl: "http://localhost:3001",
            users: [],
            countries: [],
            countriesLoading: true,
            countriesError: "",
            newUser: [
                {
                    u_firstName: "",
                    u_lastName: "",
                    u_email: "",
                    u_birthday: "",
                    u_code: "+90",
                    u_tel: "",
                    u_pass: "",
                    u_repeatPass: "",
                    u_check: false,
                    u_role: "0",

                }
            ],
            addUserTouched: {
                firstName: false,
                lastName: false,
                email: false,
                birthday: false,
                code: false,
                tel: false,
                password: false,
                confirmPassword: false,
                role: false,
                accepted: false,
            },
            addUserLoading: false,
            userModal: null,
            countryDropdown: null,

        };
    },
    //! Sayfa ilk yuklendiginde direkt calisacak kodlar
    mounted() {
        this.getUsers();
        this.loadCountries();
        this.$nextTick(() => {
            const modalEl = document.getElementById('addUser');
            if (!modalEl) return;
            this.userModal = Modal.getOrCreateInstance(modalEl);
            modalEl.addEventListener('hidden.bs.modal', this.handleModalHidden);
            const dropdownEl = document.getElementById('adminCountryDropdown');
            if (dropdownEl) this.countryDropdown = Dropdown.getOrCreateInstance(dropdownEl);
        });
    },
    beforeUnmount() {
        if (this.userModal) {
            this.userModal.hide();
            this.userModal.dispose();
            this.userModal = null;
        }
        if (this.countryDropdown) {
            this.countryDropdown.dispose();
            this.countryDropdown = null;
        }
        const modalEl = document.getElementById('addUser');
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
        selectedCountry() {
            return this.countries.find((country) => country.phone_code === this.newUser[0].u_code);
        },
        addUserValidation() {
            const registration = validateRegistration({
                firstName: this.newUser[0].u_firstName,
                lastName: this.newUser[0].u_lastName,
                email: this.newUser[0].u_email,
                password: this.newUser[0].u_pass,
                confirmPassword: this.newUser[0].u_repeatPass,
            });
            const phone = this.newUser[0].u_tel.trim();
            const phoneDigits = phone.replace(/\D/g, "");
            const errors = {
                ...registration.errors,
                birthday: this.newUser[0].u_birthday ? [] : ["Doğum tarihi alanı boş bırakılamaz."],
                code: this.newUser[0].u_code ? [] : ["Ülke kodu seçilmelidir."],
                tel: !phone
                    ? ["Telefon alanı boş bırakılamaz."]
                    : !/^[0-9\s()+-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15
                        ? ["Geçerli bir telefon numarası giriniz (7-15 rakam)."]
                        : [],
                role: ["0", "1"].includes(String(this.newUser[0].u_role))
                    ? []
                    : ["Geçerli bir rol seçilmelidir."],
                accepted: this.newUser[0].u_check
                    ? []
                    : ["Bilgilerin doğruluğunu onaylamanız gerekmektedir."],
            };
            return {
                ...registration,
                errors,
                isValid: Object.values(errors).every((fieldErrors) => fieldErrors.length === 0),
            };
        },
        canAddUser() {
            return this.addUserValidation.isValid &&
                !this.countriesLoading &&
                this.countries.length > 0;
        },

    },
    //! Bildigimiz fonksiyonlarin oldugu yer.Bir etkilesime girince calisacak fonksiyonlari burada tanimlariz.
    methods: {
        handleModalHidden() {
            this.userMessage = null;
        },
        openAddUserModal() {
            this.loadCountries();
            this.$nextTick(() => {
                if (!this.userModal) {
                    const modalEl = document.getElementById('addUser');
                    if (modalEl) this.userModal = Modal.getOrCreateInstance(modalEl);
                }
                this.userModal?.show();
            });
        },
        closeAddUserModal() {
            this.userModal?.hide();
        },
        addUserFieldErrors(field) {
            return this.addUserTouched[field] ? this.addUserValidation.errors[field] : [];
        },
        touchAllAddUserFields() {
            Object.keys(this.addUserTouched).forEach((field) => {
                this.addUserTouched[field] = true;
            });
        },
        flagImageUrl(countryCode) {
            return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
        },
        selectCountry(country) {
            this.newUser[0].u_code = country.phone_code;
            this.addUserTouched.code = true;
            this.countryDropdown?.hide();
        },
        async loadCountries() {
            this.countriesLoading = true;
            this.countriesError = "";
            try {
                const res = await fetch(`${this.baseUrl}/countries`);
                if (!res.ok) throw new Error("Ülkeler getirilemedi");

                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) throw new Error("Ülke listesi boş");

                this.countries = data;
                const currentSelectionExists = data.some(
                    (country) => country.phone_code === this.newUser[0].u_code
                );
                if (!currentSelectionExists) {
                    const turkey = data.find((country) => country.phone_code === "+90");
                    this.newUser[0].u_code = turkey?.phone_code ?? data[0].phone_code;
                }
            } catch (e) {
                this.countries = [];
                this.newUser[0].u_code = "";
                this.countriesError = "Ülkeler yüklenemedi. Backend bağlantısını kontrol edin.";
                console.error(e.message);
            } finally {
                this.countriesLoading = false;
            }
        },
        
        async getUsers() {
            this.error = null;
            try {
                const res = await fetch(`${this.baseUrl}/api/users`, { cache: "no-store", credentials: "include" });
                if (!res.ok) throw new Error("Users endpoint hatası");
                const users = await res.json();
                this.users = users.map((user) => ({
                    ...user,
                    u_birthday: this.normalizeBirthday(user.u_birthday),
                    newPassword: "",
                }));
            } catch (e) {
                this.error = e.message;
            }
        },
        normalizeBirthday(value) {
            if (typeof value !== "string") return "";
            const match = value.trim().match(/^\d{4}-\d{2}-\d{2}/);
            return match?.[0] || "";
        },
        async addUsers() {
            if (this.addUserLoading) return;

            this.userMessage = null;
            this.touchAllAddUserFields();
            if (!this.canAddUser) {
                this.userMessage = "Lütfen kullanıcı formundaki alanları kontrol edin.";
                return;
            }
            try {
                this.addUserLoading = true;
                const validatedValues = this.addUserValidation.values;
                const res = await fetch(`${this.baseUrl}/api/users`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        firstName: validatedValues.firstName,
                        lastName: validatedValues.lastName,
                        email: validatedValues.email,
                        birthday: this.newUser[0].u_birthday,
                        code: this.newUser[0].u_code,
                        tel: this.newUser[0].u_tel,
                        pass: this.newUser[0].u_pass,
                        role:this.newUser[0].u_role
                    })
                });
                if (!res.ok) {
                    const errorBody = await res.json().catch(() => null);
                    throw new Error(errorBody?.error || errorBody || `Sunucu hatası (${res.status})`);
                }

                const data = await res.json();
                this.userMessage = data;
                await this.getUsers(); // Kullanıcıları tekrar yükle
                showSiteAlert("Kullanıcı başarıyla eklendi!");
                this.newUser = [{
                    u_firstName: "",
                    u_lastName: "",
                    u_email: "",
                    u_birthday: "",
                    u_code: "+90",
                    u_tel: "",
                    u_pass: "",
                    u_repeatPass: "",
                    u_check: false,
                    u_role: "0"
                }];
                Object.keys(this.addUserTouched).forEach((field) => this.addUserTouched[field] = false);
                this.closeAddUserModal();
            }

            catch (e) {
                this.userMessage = e.message;
            }
            finally {
                this.addUserLoading = false;
            }
        },

        async updateUser(id, firstName, lastName, email, birthday, code, tel, pass, role) {
            this.productMessage = null;
            try {
                const res = await fetch(`${this.baseUrl}/api/users/${id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        birthday: birthday,
                        code: code,
                        tel: tel,
                        pass: pass,
                        role:role
                    })
                });
                if (!res.ok) throw new Error("updateUsers endpoint hatası");

                const data = await res.json();
                if (data) showSiteAlert("Kullanıcı başarıyla güncellendi!");
                this.getUsers(); // Kullanıcıları tekrar yükle

            }

            catch (e) {
                console.error(e.message);
            }


        },
        async deleteUser(id) {
            this.productMessage = null;
            try {
                const res = await fetch(`${this.baseUrl}/api/users/${id}`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },

                });
                if (!res.ok) throw new Error("deleteUsers endpoint hatası");

                const data = await res.json();
                if (data) showSiteAlert("Kullanıcı başarıyla silindi!");
                this.getUsers(); // Ürünleri tekrar yükle

            }

            catch (e) {
                console.error(e.message);
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
.admin-modal .form-select,
.admin-modal .form-check-input {
    border-radius: 12px;
    border: 1px solid #d8c2ab;
    background: rgba(255, 255, 255, 0.75);
    color: #4b3621;
}

.admin-modal .form-control:focus,
.admin-modal .form-select:focus {
    border-color: #8b5e3c;
    box-shadow: 0 0 0 0.2rem rgba(139, 94, 60, 0.18);
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

.user-actions {
    display: flex;
    gap: 6px;
    width: max-content;
}

.action-btn svg {
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
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.country-picker-toggle {
    min-height: 46px;
    background-color: rgba(255, 255, 255, 0.75);
}

.country-picker-menu {
    width: 100%;
    max-height: min(320px, 45dvh);
    overflow-y: auto;
}

.country-option {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
}

.country-option span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.country-flag {
    flex: 0 0 auto;
    width: 24px;
    height: 18px;
    object-fit: cover;
    border: 1px solid rgba(75, 54, 33, 0.16);
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

.users-table {
    min-width: 1080px;
    width: 100%;
}

.users-table th,
.users-table td {
    vertical-align: middle;
}

.users-table .actions-column {
    width: 90px;
    white-space: nowrap;
}

.user-actions {
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

    .users-table {
        min-width: 760px;
    }
}
</style>
