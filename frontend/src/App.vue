<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router' //! vue kutuphanesinden RouterLink ve RouterView bileşenlerini içe aktarır. RouterLink, gezinme bağlantıları oluşturmak için kullanılırken, RouterView, geçerli rotaya karşılık gelen bileşeni görüntülemek için kullanılır.
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { Dropdown, Modal } from 'bootstrap'
import Sepet from './components/sepet.vue' // Sepet.vue bileşenini Sepet adiyla import ettik.
import { validateEmail, validatePassword, validateConfirmPassword, validateRegistration } from './validation.js'
import SiteAlert from './components/SiteAlert.vue'
import { showSiteAlert } from './services/siteAlert.js'
import { currentUser as cartAuthUser } from './services/auth.js'
//import HelloWorld from './components/HelloWorld.vue' // HelloWorld.vue componentini HElloWorld adiyla import ettik.

const LEGACY_CART_STORAGE_KEY = 'woodenart_cart'
const GUEST_CART_OWNER = 'guest'
const route = useRoute()
const currentYear = new Date().getFullYear()

function cartStorageKey(owner) {
  return `woodenart_cart_${owner}`
}

function loadStoredCart(owner) {
  try {
    const ownerKey = cartStorageKey(owner)
    let storedValue = window.localStorage.getItem(ownerKey)
    const legacyCart = window.localStorage.getItem(LEGACY_CART_STORAGE_KEY)
    if (storedValue === null && legacyCart !== null) {
      storedValue = legacyCart
      window.localStorage.setItem(ownerKey, legacyCart)
    }
    if (legacyCart !== null) window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
    const storedCart = JSON.parse(storedValue || '[]')
    return Array.isArray(storedCart) ? storedCart.filter((item) => item && typeof item === 'object') : []
  } catch {
    window.localStorage.removeItem(cartStorageKey(owner))
    window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
    return []
  }
}

function getCartOwner() {
  return cartAuthUser.value?.u_id || GUEST_CART_OWNER
}

const activeCartOwner = ref(getCartOwner())
const sepet = reactive(loadStoredCart(activeCartOwner.value))
provide('sepet', sepet)

watch(sepet, (items) => {
  window.localStorage.setItem(cartStorageKey(activeCartOwner.value), JSON.stringify(items))
}, { deep: true })

function syncCartOwner() {
  const nextOwner = getCartOwner()
  if (nextOwner === activeCartOwner.value) return

  window.localStorage.setItem(cartStorageKey(activeCartOwner.value), JSON.stringify(sepet))
  activeCartOwner.value = nextOwner
  sepet.splice(0, sepet.length, ...loadStoredCart(nextOwner))
}

watch(() => route.fullPath, syncCartOwner)

function handleCartOwnerChange() {
  syncCartOwner()
}

const registerForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  birthday: '',
  tel: '',
  password: '',
  confirmPassword: '',
  accepted: false,
})
const registrationLoading = ref(false)
const registrationError = ref('')
const registrationMessage = ref('')

const countries = ref([])
const countriesLoading = ref(true)
const countriesError = ref('')
const selectedPhoneCode = ref('')
const selectedCountry = computed(() => (
  countries.value.find((country) => country.phone_code === selectedPhoneCode.value)
))

function flagImageUrl(countryCode) {
  return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`
}

function selectCountry(country) {
  selectedPhoneCode.value = country.phone_code
}

async function loadCountries() {
  countriesLoading.value = true
  countriesError.value = ''

  try {
    const response = await fetch('http://localhost:3001/countries')
    if (!response.ok) throw new Error('Ülkeler getirilemedi')

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) throw new Error('Ülke listesi boş')

    countries.value = data
    const hasTurkey = data.some((country) => country.phone_code === '+90')
    selectedPhoneCode.value = hasTurkey ? '+90' : data[0].phone_code
  } catch (error) {
    countries.value = []
    selectedPhoneCode.value = ''
    countriesError.value = 'Ülkeler yüklenemedi. Backend bağlantısını kontrol edin.'
    console.error(error.message)
  } finally {
    countriesLoading.value = false
  }
}

function handleRegisterModalShow() {
  registrationError.value = ''
  registrationMessage.value = ''
  loadCountries()
}

function openLoginAfterRegistration() {
  const registerElement = document.getElementById('register')
  const loginElement = document.getElementById('login')
  if (!registerElement || !loginElement) {
    console.error('Kayıt sonrası giriş penceresi açılamadı: modal elementi bulunamadı.')
    return
  }

  const loginModal = Modal.getOrCreateInstance(loginElement)
  const showLogin = () => {
    loginModal.show()
  }
  const registerModal = Modal.getOrCreateInstance(registerElement)
  if (!registerElement.classList.contains('show')) {
    showLogin()
    return
  }

  const handleRegisterHidden = () => {
    showLogin()
  }
  registerElement.addEventListener('hidden.bs.modal', handleRegisterHidden, { once: true })
  registerModal.hide()
}

async function registerUser() {
  registrationError.value = ''
  registrationMessage.value = ''

  const validation = validateRegistration(registerForm)
  const errors = Object.values(validation.errors).flat()

  if (!registerForm.birthday) errors.push('Doğum tarihi alanı boş bırakılamaz.')
  if (!registerForm.tel.trim()) errors.push('Telefon alanı boş bırakılamaz.')
  if (!selectedPhoneCode.value) errors.push('Ülke seçimi yapılmalıdır.')
  if (!registerForm.accepted) errors.push('Bilgilerinizi onaylamanız gerekmektedir.')

  if (errors.length > 0) {
    registrationError.value = errors[0]
    return
  }

  registrationLoading.value = true

  try {
    const localPhone = registerForm.tel.trim().replace(/\s+/g, '').replace(/^0/, '')
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: validation.values.firstName,
        lastName: validation.values.lastName,
        email: validation.values.email,
        birthday: registerForm.birthday,
        tel: `${selectedPhoneCode.value}${localPhone}`,
        pass: validation.values.password,
      }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw new Error(data?.error || data?.message || `Kayıt işlemi başarısız (${response.status})`)

    registrationMessage.value = data?.message || 'Kayıt işlemi başarıyla tamamlandı.'
    await new Promise((resolve) => window.setTimeout(resolve, 3000))
    openLoginAfterRegistration()
    Object.assign(registerForm, {
      firstName: '',
      lastName: '',
      email: '',
      birthday: '',
      tel: '',
      password: '',
      confirmPassword: '',
      accepted: false,
    })
  } catch (error) {
    registrationError.value = error.message
  } finally {
    registrationLoading.value = false
  }
}

loadCountries()

onMounted(() => {
  syncCartOwner()
  document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((element) => {
    Dropdown.getOrCreateInstance(element)
  })

  document.getElementById('register')?.addEventListener('show.bs.modal', handleRegisterModalShow)
  window.addEventListener('woodenart:cart-owner-change', handleCartOwnerChange)
})

onBeforeUnmount(() => {
  document.getElementById('register')?.removeEventListener('show.bs.modal', handleRegisterModalShow)
  window.removeEventListener('woodenart:cart-owner-change', handleCartOwnerChange)
})

</script>

<template>
  <SiteAlert />
  <!--! NAVBAR -->
  <nav class="navbar navbar-expand-lg site-navbar">
    <div class="container-fluid site-navbar-inner">
      <RouterLink class="navbar-brand navbar-brand-medallion" to="/" aria-label="The WoodenArt ana sayfa">
        <span class="navbar-logo-oval">
          <img src="./assets/img/logo2.png" alt="" class="logo">
        </span>
      </RouterLink>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll"
        aria-controls="navbarScroll" aria-expanded="false" aria-label="Menüyü aç veya kapat">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarScroll">
        <ul class="navbar-nav site-nav-links">

          <li class="nav-item">
            <router-link class="nav-link" to="/" exact-active-class="active">Ana Sayfa</router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/about">Hakkımızda</router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/products">Ürünlerimiz</router-link>
          </li>

          <li class="nav-item dropdown">
            <button id="galleryDropdown" class="nav-link dropdown-toggle" type="button" data-bs-toggle="dropdown"
              aria-expanded="false">
              Galeri
            </button>
            <ul class="dropdown-menu" aria-labelledby="galleryDropdown">
              <li><router-link class="dropdown-item" to="/finished">Tamamlanan Ürünler</router-link></li>
              <li><router-link class="dropdown-item" to="/coming">Devam Eden Çalışmalar</router-link></li>
              <li><router-link class="dropdown-item" to="/tools">Araçlar</router-link></li>
            </ul>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/contact">İletişim</router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/sss">S.S.S</router-link>
          </li>

        </ul>

        <form class="d-flex navbar-search" role="search" @submit.prevent="searchProducts">
          <input v-model.trim="search" class="form-control me-2" type="search" placeholder="Sitemizde Ara..."
            aria-label="Ürün adına göre ara" @input="clearSearchResults">
          <button class="btn btn-outline-success" type="submit" :disabled="!search || searchLoading"
            :aria-label="searchLoading ? 'Aranıyor...' : 'Ara'" :title="searchLoading ? 'Aranıyor...' : 'Ara'">
            <svg class="search-button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              fill="none" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8"></circle>
              <path d="m16 16 5 5"></path>
            </svg>
          </button>
          <div v-if="searchSubmitted" class="search-results shadow" role="status" aria-live="polite">
            <p v-if="searchLoading" class="search-results-message">Ürünler aranıyor...</p>
            <p v-else-if="searchError" class="search-results-message text-danger">{{ searchError }}</p>
            <template v-else-if="searchResults.length">
              <button v-for="product in searchResults" :key="`${product.p_type}-${product.p_id}`"
                class="search-result-item" type="button" @click="openSearchResult(product)">
                <span>{{ product.p_name }}</span>
                <small>{{ product.category }}</small>
              </button>
            </template>
            <p v-else class="search-results-message">“{{ search }}” ile eşleşen ürün bulunamadı.</p>
          </div>
        </form>
        <div class="navbar-account">
            <button type="button" class="nav-link navbar-login" aria-label="Giriş yap veya paneli aç"
              @click="pageRouter()">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor"
                class="bi bi-person-circle" viewBox="0 0 18 18">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                <path fill-rule="evenodd"
                  d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
              </svg>
            </button>
        </div>
      </div>
    </div>
  </nav>

  <!--! LOGIN MODAL -->
  <div class="modal fade" id="login" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="exampleModalLabel">Giriş Yap</h5>
          <button class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <form v-if="!showResetForm" id="loginForm" @submit.prevent="submitLogin">
            <div class="mb-3">
              <label>Email*</label>
              <input id="login_email" v-model="user[0].email" required type="email" autocomplete="email"
                class="form-control">
              <div id="login_email_sonuc"></div>
            </div>

            <div class="mb-3">
              <label>Parola*</label>
              <input id="login_pass" v-model="user[0].pass" required type="password" autocomplete="current-password"
                class="form-control">
            </div>

            <!-- ! Uyari Kismi -->
            <div style="display: none;" id="uyari_div" class="alert alert-warning alert-dismissible fade show"
              role="alert">
              <small id="uyariMetni">Uyari Metni</small>
              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>

            <div v-if="loginMessage && !loginSuccess" class="alert alert-danger" role="alert">{{ loginMessage }}</div>
            <button id="loginButton" class="btn w-100 btn-primary" type="submit" :disabled="loginLoading">
              {{ loginLoading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
            </button>
          </form>

          <!--! E-posta koduyla sifre yenileme -->
          <form v-else id="resetForm" novalidate @submit.prevent="repeat_pass">
            <div class="alert alert-warning" role="alert">
              Üç kez hatalı giriş yaptınız. Şifrenizi yenilemek için e-posta doğrulaması yapın.
            </div>
            <div class="mb-3">
              <label>Email*</label>
              <input id="reset_email" v-model="user[0].email" required type="email" autocomplete="email"
                :disabled="resetLoading || resetCodeSent" @blur="resetTouched.email = true" class="form-control">
              <small v-if="resetTouched.email" class="text-danger">{{ resetValidation.email[0] }}</small>
            </div>
            <button v-if="!resetCodeSent" class="btn w-100 btn-primary" type="button"
              :disabled="!canRequestResetCode || resetLoading" @click="requestResetCode">
              {{ resetLoading ? 'Kod gönderiliyor...' : 'Doğrulama Kodu Gönder' }}
            </button>
            <template v-else>
              <div class="alert alert-info" role="status">{{ resetMessage }}</div>
              <div class="mb-3">
                <label for="reset_code">E-posta Doğrulama Kodu*</label>
                <input id="reset_code" v-model="resetCode" required type="text" inputmode="numeric"
                  autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" :disabled="resetLoading"
                  class="form-control">
              </div>
              <div class="mb-3">
                <label>Parola*</label>
                <input id="reset_pass" v-model="user[0].pass" required type="password" autocomplete="new-password"
                  :disabled="resetLoading" @blur="resetTouched.password = true" class="form-control">
                <template v-if="resetTouched.password">
                  <small v-for="error in resetValidation.password" :key="error" class="text-danger d-block">{{ error }}</small>
                </template>
              </div>
              <div class="mb-3">
                <label>Parola Tekrar*</label>
                <input id="reset_pass_confirm" v-model="user[0].passConfirm" required type="password"
                  autocomplete="new-password" :disabled="resetLoading" @blur="resetTouched.confirmPassword = true" class="form-control">
                <small v-if="resetTouched.confirmPassword" class="text-danger">{{ resetValidation.confirmPassword[0] }}</small>
              </div>
              <button class="btn w-100 btn-primary" type="submit" :disabled="!canResetPassword || !/^\d{6}$/.test(resetCode) || resetLoading">
                {{ resetLoading ? 'Güncelleniyor...' : 'Parolayı Güncelle' }}
              </button>
              <button class="btn btn-link w-100 mt-2" type="button" :disabled="resetLoading" @click="requestResetCode">
                Yeni kod gönder
              </button>
            </template>
            <div v-if="resetError" class="alert alert-danger" role="alert">{{ resetError }}</div>
            <button v-if="resetCodeSent" class="btn btn-link w-100" type="button" :disabled="resetLoading"
              @click="cancelPasswordReset">Giriş ekranına dön</button>
          </form>


          <br>

          <a href="#" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#register">
            Hesabın yoksa kayıt ol
          </a>
        </div>
      </div>
    </div>
  </div>

  <!--! REGISTER MODAL -->
  <div class="modal fade" id="register" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5>Kayıt Ol</h5>
          <button class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <form class="row g-3" novalidate @submit.prevent="registerUser">

            <div class="col-md-6">
              <input v-model="registerForm.firstName" type="text" id="register_name" class="form-control"
                placeholder="İsim*" required>
              <div id="register_name_sonuc"></div>
            </div>

            <div class="col-md-6">
              <input v-model="registerForm.lastName" type="text" id="register_surname" class="form-control"
                placeholder="Soyisim*" required>
              <div id="register_surname_sonuc"></div>
            </div>

            <div class="col-md-6">
              <input v-model="registerForm.email" type="email" id="register_email" class="form-control"
                placeholder="Email*" required>
              <div id="register_email_sonuc"></div>
            </div>

            <div class="col-md-6">
              <input v-model="registerForm.birthday" type="date" id="register_birthday" class="form-control"
                placeholder="Doğum Tarihi*" required>
              <div id="register_birthday_sonuc"></div>
            </div>

            <div class="col-md-6">
              <div class="dropdown country-picker">
                <button class="form-select country-picker-toggle" type="button" data-bs-toggle="dropdown"
                  aria-expanded="false" :disabled="countriesLoading || countries.length === 0">
                  <span v-if="countriesLoading">Ülkeler yükleniyor...</span>
                  <span v-if="selectedCountry" class="country-option">
                    <img :src="flagImageUrl(selectedCountry.country_code)"
                      :alt="`${selectedCountry.country_name} bayrağı`" class="country-flag">
                    <span>{{ selectedCountry.country_name }}</span>
                  </span>
                  <span v-else-if="!countriesLoading">Ülke seçiniz</span>
                </button>
                <ul class="dropdown-menu country-picker-menu">
                  <li v-for="country in countries" :key="country.id">
                    <button class="dropdown-item country-option" type="button" @click="selectCountry(country)">
                      <img :src="flagImageUrl(country.country_code)" :alt="`${country.country_name} bayrağı`"
                        class="country-flag" loading="lazy">
                      <span>{{ country.country_name }}</span>
                    </button>
                  </li>
                </ul>
                <input id="contact_code" type="hidden" :value="selectedPhoneCode">
              </div>
              <div id="register_kod_sonuc"></div>
              <small v-if="countriesError" class="text-danger d-block mt-1">{{ countriesError }}</small>
            </div>

            <div class="col-md-6">
              <input v-model="registerForm.tel" type="tel" id="register_tel" class="form-control" placeholder="Telefon*"
                required>
              <div id="register_tel_sonuc"></div>
            </div>

            <div class="col-md-6">
              <input v-model="registerForm.password" type="password" id="register_pass" class="form-control"
                placeholder="Parola*" required>
              <div id="register_pass_sonuc"></div>
            </div>

            <div class="col-md-6">
              <input v-model="registerForm.confirmPassword" type="password" id="register_repeatpass"
                class="form-control" placeholder="Parola Tekrar*" required>
              <div id="register_repeatpass_sonuc"></div>
            </div>

            <div class="col-12">
              <input v-model="registerForm.accepted" type="checkbox" id="register_check" required> Bilgilerimi
              onaylıyorum
              <div id="register_check_sonuc"></div>
            </div>

            <div class="col-12">
              <div v-if="registrationError" class="alert alert-danger py-2" role="alert">
                {{ registrationError }}
              </div>
              <div v-if="registrationMessage" class="alert alert-success py-2" role="status">
                {{ registrationMessage }}
              </div>
              <button class="btn w-100 btn-primary" type="submit"
                :disabled="registrationLoading || countriesLoading || countries.length === 0">
                {{ registrationLoading ? 'Kaydediliyor...' : 'Kayıt Ol' }}
              </button>
            </div>

          </form>

          <br>

          <a href="#" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#login">
            Hesabın varsa giriş yap
          </a>
        </div>
      </div>
    </div>
  </div>

  <Sepet />

  <!-- ! router in firlattigi componenti burada gosterir -->
  <RouterView />

  <footer class="site-footer">
    <div class="container site-footer-content">
      <div class="site-footer-brand">
        <RouterLink class="site-footer-logo" to="/" aria-label="The WoodenArt ana sayfa">
          <img src="./assets/img/logo2.png" alt="">
        </RouterLink>
        <p>Ahşabın doğal dokusunu el emeğiyle sanata dönüştürüyoruz.</p>
      </div>

      <nav class="site-footer-nav" aria-label="Alt menü">
        <h2>Keşfedin</h2>
        <RouterLink to="/about">Hakkımızda</RouterLink>
        <RouterLink to="/products">Ürünlerimiz</RouterLink>
        <RouterLink to="/finished">Tamamlanan ürünler</RouterLink>
        <RouterLink to="/coming">Devam eden çalışmalar</RouterLink>
      </nav>

      <nav class="site-footer-nav" aria-label="Yardım ve iletişim">
        <h2>Yardım &amp; İletişim</h2>
        <RouterLink to="/contact">İletişim</RouterLink>
        <RouterLink to="/sss">Sıkça Sorulan Sorular</RouterLink>
      </nav>

      <div class="site-footer-note">
        <span class="site-footer-eyebrow">El emeği, doğal dokunuş</span>
        <p>Her parçanın kendine özgü bir hikâyesi var.</p>
        <RouterLink class="site-footer-cta" to="/contact">
          Bizimle iletişime geçin <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>

    <div class="container site-footer-bottom">
      <span>© {{ currentYear }} The WoodenArt</span>
      <span>Ahşabın sanata dönüştüğü buluşma noktası.</span>
    </div>
  </footer>

  <!-- ! burasi router link kismi.Tiklaninca ilgili linke gider -->
</template>

<script>
import { productNameMatches } from './utils/productSearch.js';

import { refreshAuthenticatedUser as refreshAuth } from './services/auth.js'

export default {
  //! Data degisken tanimladigimiz yer
  data() {
    return {

      baseUrl: "http://localhost:3001",
      newUser: [
        {
          firstName: "",
          lastName: "",
          email: "",
          tel: "",
          pass: "",
          repeatPass: "",
          check: true
        }
      ],
      users: [],
      user: [{ firstName: "", lastName: "", email: "", tel: "", pass: "", passConfirm: "", repeatPass: "", check: false }],
      registerLoading: false,
      registerCode: "+90",
      registerMessage: "",
      registerSuccess: false,
      registerTouched: {
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        confirmPassword: false,
      },
      loginMessage: "",
      loginLoading: false,
      resetLoading: false,
      resetError: '',
      resetMessage: '',
      resetRequestId: '',
      resetCode: '',
      resetCodeSent: false,
      resetTouched: { email: false, password: false, confirmPassword: false },
      failedLoginAttempts: 0,
      showResetForm: false,
      loginSuccess: false,
      isAdmin: false,
      search: "",
      searchLoading: false,
      searchSubmitted: false,
      searchResults: [],
      searchError: "",
    };
  },
  //! Sayfa ilk yuklendiginde direkt calisacak kodlar
  mounted() {

  },
  //! Degiskeni izler, Degiskenlerde bir degisiklik yapildiginda degismesini izledigimiz kodlar
  watch: {
  },
  //! Var olan dizi uzerinde degisiklik yapacaksak ve yeni deger ureteceksek kullaniriz.Orn; kdv hesaplama, indirim hesaplama gibi islemler yapacaksak kullaniriz.
  computed: {
    resetValidation() {
      return {
        email: validateEmail(this.user[0].email),
        password: validatePassword(this.user[0].pass),
        confirmPassword: validateConfirmPassword(this.user[0].pass, this.user[0].passConfirm),
      };
    },
    canResetPassword() {
      return Object.values(this.resetValidation).every((errors) => errors.length === 0);
    },
    canRequestResetCode() {
      return this.resetValidation.email.length === 0;
    },
    registrationValidation() {
      return validateRegistration({
        firstName: this.user[0].firstName,
        lastName: this.user[0].lastName,
        email: this.user[0].email,
        password: this.user[0].pass,
        confirmPassword: this.user[0].repeatPass,
      });
    },
    canRegister() {
      return this.registrationValidation.isValid &&
        this.user[0].tel.trim() !== "" &&
        this.user[0].check === true;
    },
  },
  //! Bildigimiz fonksiyonlarin oldugu yer.Bir etkilesime girince calisacak fonksiyonlari burada tanimlariz.
  methods: {
    clearSearchResults() {
      this.searchSubmitted = false;
      this.searchResults = [];
      this.searchError = "";
    },
    async searchProducts() {
      const query = this.search.trim();
      if (!query || this.searchLoading) return;

      this.searchLoading = true;
      this.searchSubmitted = true;
      this.searchResults = [];
      this.searchError = "";
      try {
        const types = [
          { type: 1, category: 'Ürünlerimiz', path: '/products' },
          { type: 2, category: 'Devam Eden Çalışmalar', path: '/coming' },
          { type: 3, category: 'Araçlar', path: '/tools' },
        ];
        const catalogs = await Promise.all(types.map(async (catalog) => {
          const response = await fetch(`${this.baseUrl}/api/productPage?type=${catalog.type}`, { cache: 'no-store' });
          if (!response.ok) throw new Error('Ürünler aranırken kataloglara ulaşılamadı.');
          const products = await response.json();
          if (!Array.isArray(products)) throw new Error('Ürün arama yanıtı geçersiz.');
          return products.map((product) => ({ ...product, ...catalog }));
        }));
        this.searchResults = catalogs.flat().filter((product) => productNameMatches(product.p_name, query));
      } catch (error) {
        this.searchError = error.message || 'Arama sırasında bir hata oluştu.';
      } finally {
        this.searchLoading = false;
      }
    },
    async openSearchResult(product) {
      this.searchSubmitted = false;
      await this.$router.push({
        path: product.path,
        query: { search: this.search.trim(), p_id: product.p_id }
      });
    },
    async requestResetCode() {
      if (this.resetLoading) return;
      this.resetTouched.email = true;
      if (!this.canRequestResetCode) return;
      this.resetLoading = true;
      this.resetError = '';
      try {
        const response = await fetch(`${this.baseUrl}/api/password-reset/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.user[0].email }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Doğrulama kodu gönderilemedi.');
        this.resetRequestId = data.requestId;
        this.resetCodeSent = true;
        this.resetCode = '';
        this.resetMessage = data.message || 'E-posta adresiniz kayıtlıysa doğrulama kodu gönderildi.';
      } catch (error) {
        this.resetError = error.message;
      } finally {
        this.resetLoading = false;
      }
    },
    async repeat_pass() {
      if (this.resetLoading) return;
      Object.keys(this.resetTouched).forEach((field) => { this.resetTouched[field] = true; });
      if (!this.canResetPassword || !/^\d{6}$/.test(this.resetCode) || !this.resetRequestId) return;
      this.resetLoading = true;
      this.resetError = '';
      try {
        const response = await fetch(`${this.baseUrl}/api/password-reset/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: this.resetRequestId, code: this.resetCode,
            password: this.user[0].pass, confirmPassword: this.user[0].passConfirm,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Şifre yenileme işlemi başarısız.');
        this.user[0].pass = '';
        this.user[0].passConfirm = '';
        this.resetCode = '';
        this.resetRequestId = '';
        this.resetCodeSent = false;
        this.failedLoginAttempts = 0;
        this.showResetForm = false;
        this.resetError = '';
        this.resetMessage = '';
        this.resetTouched = { email: false, password: false, confirmPassword: false };
        showSiteAlert(data.message || 'Parolanız güncellendi.');
      } catch (error) {
        this.resetError = error.message;
      } finally {
        this.resetLoading = false;
      }
    },
    cancelPasswordReset() {
      this.showResetForm = false;
      this.resetRequestId = '';
      this.resetCode = '';
      this.resetCodeSent = false;
      this.resetError = '';
      this.resetMessage = '';
      this.user[0].pass = '';
      this.user[0].passConfirm = '';
    },
    registerFieldErrors(field) {
      return this.registerTouched[field] ? this.registrationValidation.errors[field] : [];
    },
    validation() {
      return this.canRegister;
    },

    async pageRouter() {
      const user = await refreshAuth();
      if (Number(user?.u_role) === 0) {
        this.$router.push("/user");
      } else if (Number(user?.u_role) === 1) {
        this.$router.push("/admin");
      } else {
        const loginModalElement = document.getElementById("login");
        const loginModal = Modal.getOrCreateInstance(loginModalElement);

        loginModal.show();
      }
    },

    async register() { // POST - kullanıcı Ekleme
      if (this.registerLoading) return;
      this.registerMessage = "";
      this.registerSuccess = false;
      if (this.validation()) {
        try {
          this.registerLoading = true;
          const validatedValues = this.registrationValidation.values;
          const res = await fetch(`${this.baseUrl}/api/register`, { //istekte bulunduğumuz yer.
            method: "POST", // Post isteğinde bulunduk
            headers: {
              "Content-type": "application/json"
            },
            body: JSON.stringify({ // istekle beraber neleri yolluyorsun?
              firstName: validatedValues.firstName,
              lastName: validatedValues.lastName,
              email: validatedValues.email,
              tel: this.registerCode + this.user[0].tel.trim(),
              pass: this.user[0].pass,


            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Kayıt oluşturulamadı.");
          this.registerSuccess = true;
          this.registerMessage = data.message || "Kayıt başarılı. Giriş yapabilirsiniz.";
          this.user[0].firstName = "";
          this.user[0].lastName = "";
          this.user[0].email = "";
          this.user[0].tel = "";
          this.registerCode = "+90";
          this.user[0].pass = "";
          this.user[0].repeatPass = "";
          this.user[0].check = false;
          Object.keys(this.registerTouched).forEach((field) => this.registerTouched[field] = false);

          document.getElementById("loginLink").click(); // Modal'ı kapatmak için butona tıklama simülasyonu

        }
        catch (e) {
          this.registerMessage = e.message;
        }
        finally {
          this.registerLoading = false;
        }
      }
      else {
        showSiteAlert("Lütfen formdaki bilgileri kontrol edin.", "error");
      }
    },
    //!burasi login validation kismi. gelistirilecek. su an sadece bos mu degil mi kontrolu yapiliyor.
    loginValidation() {
      if (this.user[0].email.trim() === "" ||
        this.user[0].pass.trim() === ""
      ) {
        return false;
      }
      return true
    },
    async submitLogin() {
      if (this.loginLoading || this.showResetForm) return;
      this.loginMessage = "";
      this.loginSuccess = false;
      if (this.loginValidation()) {
        try {
          this.loginLoading = true;
          const res = await fetch(`${this.baseUrl}/api/login`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-type": "application/json"
            },
            body: JSON.stringify({
              firstName: this.user[0].firstName,
              lastName: this.user[0].lastName,
              email: this.user[0].email,
              pass: this.user[0].pass,


            })
          });
          if (!res.ok) {
            if (res.status === 404) {
              this.failedLoginAttempts += 1;
              this.user[0].pass = "";
              if (this.failedLoginAttempts >= 3) {
                this.showResetForm = true;
                await this.$nextTick();
                document.getElementById("reset_email")?.focus();
              }
              throw new Error("E-posta veya şifre hatalı.");
            }
            throw new Error("Giriş yapılamadı.");
          }
          const data = await res.json();
          const loggedInUser = data[0];
          if (!loggedInUser || loggedInUser.u_id == null) {
            throw new Error("Giriş yanıtı geçersiz.");
          }
          const authenticatedUser = await refreshAuth();
          if (!authenticatedUser) {
            throw new Error("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
          }
          const role = Number(authenticatedUser.u_role);
          this.isAdmin = role === 1;
          this.loginSuccess = true;
          this.failedLoginAttempts = 0;
          this.loginMessage = "Giriş başarılı.";
          this.user[0].email = "";
          this.user[0].pass = "";
          this.user[0].check = false;





          const loginElement = document.getElementById("login");
          if (loginElement) Modal.getOrCreateInstance(loginElement).hide();

          showSiteAlert(`Hoş geldiniz ${authenticatedUser.u_firstName} ${authenticatedUser.u_lastName}!`);
          await this.$router.push(this.isAdmin ? "/admin" : "/user");

        }
        catch (e) {
          this.loginMessage = e.message;
        }
        finally {
          this.loginLoading = false;
        }
      }
      else {
        this.loginMessage = "E-posta ve parola alanlarını doldurun.";
      }
    },

  }
};
</script>

<style scoped>
.logo {
  display: block;
  width: 116px;
  height: 60px;
  object-fit: contain;
}

.site-navbar {
  width: 100%;
  flex-shrink: 0;
  padding: 0;
  background: #e6bd8d;
}

.site-navbar-inner {
  min-height: 96px;
  padding: 8px clamp(18px, 3vw, 48px);
  border: 0;
  border-radius: 0;
  background-color: #ead4b7;
  background-image:
    linear-gradient(105deg, rgba(255, 249, 239, 0.76), rgba(225, 194, 157, 0.68)),
    url("./assets/img/background.png");
  background-position: center, center 46%;
  background-size: cover;
  box-shadow: inset 0 -3px 0 rgba(106, 66, 35, 0.12);
}

.navbar-brand-medallion {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin: 0 clamp(20px, 3vw, 48px) 0 0;
  padding: 0;
  border-radius: 999px;
}

.navbar-logo-oval {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 142px;
  height: 78px;
  padding: 7px 13px;
  border: 1px solid rgba(230, 189, 141, 0.72);
  border-radius: 50%;
  background:
    repeating-radial-gradient(ellipse at 50% 50%, transparent 0 6px, rgba(139, 94, 60, 0.12) 7px 8px, transparent 9px 12px),
    linear-gradient(145deg, #fffaf2, #f0dfc8);
  box-shadow:
    0 4px 11px rgba(60, 36, 20, 0.17),
    inset 0 0 0 4px rgba(255, 255, 255, 0.54),
    inset 0 0 0 5px rgba(139, 94, 60, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.navbar-brand-medallion:hover {
  transform: translateY(-1px);
  box-shadow:
    0 6px 14px rgba(60, 36, 20, 0.22),
    inset 0 0 0 4px rgba(255, 255, 255, 0.62),
    inset 0 0 0 5px rgba(139, 94, 60, 0.2);
}

.navbar-brand-medallion:focus-visible {
  outline: 3px solid #8b5e3c;
  outline-offset: 3px;
}

.navbar .navbar-brand {
  padding: 0;
}

.navbar .navbar-collapse {
  min-width: 0;
}

.navbar .navbar-nav {
  align-items: center;
  flex: 1 1 auto;
  justify-content: space-evenly;
  gap: clamp(2px, 0.6vw, 10px);
}

.site-nav-links {
  min-width: 0;
}

.navbar .nav-link {
  position: relative;
  white-space: nowrap;
  color: #4b3621;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  padding: 12px 13px;
  border-radius: 0;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.navbar .nav-link::after {
  position: absolute;
  right: 14px;
  bottom: 5px;
  left: 14px;
  height: 2px;
  border-radius: 2px;
  background: #9a6538;
  content: "";
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}

.navbar .nav-link:hover,
.navbar .nav-link.router-link-active,
.navbar .nav-link.active {
  color: #3f2818;
  background: transparent;
}

.navbar .nav-link:hover::after,
.navbar .nav-link.router-link-active::after,
.navbar .nav-link.active::after {
  transform: scaleX(1);
}

.navbar .navbar-login {
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  color: #4b3621;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.navbar .navbar-login::after {
  display: none;
}

.navbar .navbar-login:focus-visible {
  outline: 2px solid #8b5e3c;
  outline-offset: 1px;
  border-radius: 50%;
}

.navbar .navbar-login svg {
  width: 27px;
  height: 27px;
}

.navbar-account {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin-left: clamp(18px, 2.4vw, 36px);
  padding-left: clamp(14px, 1.8vw, 26px);
  border-left: 1px solid rgba(75, 54, 33, 0.2);
}

.navbar-search {
  position: relative;
  flex: 0 1 auto;
  align-items: center;
  gap: 4px;
  margin-left: clamp(16px, 2vw, 30px);
  padding: 5px 6px 5px 12px;
  border: 1px solid rgba(102, 66, 40, 0.24);
  border-radius: 999px;
  background: rgba(255, 250, 242, 0.8);
  box-shadow: 0 3px 10px rgba(79, 51, 31, 0.12);
}

.navbar-search .form-control {
  width: clamp(145px, 14vw, 220px);
  padding: 7px 4px;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.navbar-search .form-control:focus {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.search-results {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 1050;
  width: min(360px, 90vw);
  max-height: 60vh;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #d6c3b3;
  border-radius: 10px;
  background: #fff;
}

.search-result-item {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #4b3621;
  text-align: left;
}

.search-result-item:hover,
.search-result-item:focus-visible {
  background: #f3e8db;
  outline: none;
}

.search-result-item small {
  color: #80634b;
}

.search-results-message {
  margin: 0;
  padding: 10px 12px;
  color: #4b3621;
}

.search-empty-state {
  position: relative;
  z-index: 1;
  padding: 24px 12px;
  color: #4b3621;
  text-align: center;
}

.navbar .btn-outline-success {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 12px;
  border: 0;
  border-radius: 999px;
  color: #fffaf3;
  background: #80532f;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.navbar .btn-outline-success:hover {
  background-color: #5a3e2b;
  color: #fff;
  transform: translateY(-1px);
}

.navbar .btn-outline-success:disabled {
  color: rgba(255, 250, 243, 0.75);
  background: #9a8069;
}

.navbar .search-button-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.navbar .dropdown-menu {
  min-width: 220px;
  padding: 8px;
  border: 1px solid rgba(106, 66, 35, 0.18);
  border-radius: 14px;
  background: #fffaf2;
  box-shadow: 0 12px 28px rgba(43, 29, 18, 0.2);
}

.navbar .dropdown-item {
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

.navbar .dropdown-item:hover {
  background-color: #c38a4e;
  color: #fff;
}

.navbar .navbar-toggler {
  border-color: rgba(75, 54, 33, 0.32);
  border-radius: 50%;
  padding: 9px;
}

.navbar .navbar-toggler:focus {
  box-shadow: 0 0 0 0.18rem rgba(139, 94, 60, 0.24);
}

@media (max-width: 1199.98px) and (min-width: 992px) {
  .site-navbar-inner {
    padding-right: 18px;
    padding-left: 18px;
  }

  .navbar-brand-medallion {
    margin-right: 16px;
  }

  .navbar-logo-oval {
    width: 120px;
    height: 70px;
  }

  .logo {
    width: 100px;
    height: 52px;
  }

  .navbar .nav-link {
    padding-right: 8px;
    padding-left: 8px;
    font-size: 14px;
  }

  .navbar .navbar-nav {
    gap: 0;
  }

  .navbar-search {
    margin-left: 12px;
  }

  .navbar-search .form-control {
    width: 120px;
    font-size: 13px;
  }

  .navbar-account {
    margin-left: 16px;
    padding-left: 12px;
  }
}

@media (max-width: 991.98px) {
  .site-navbar {
    padding: 0;
  }

  .site-navbar-inner {
    min-height: 78px;
    padding: 6px 16px;
  }

  .navbar-brand-medallion {
    margin-right: 12px;
  }

  .navbar-logo-oval {
    width: 112px;
    height: 64px;
  }

  .logo {
    width: 92px;
    height: 48px;
  }

  .navbar .navbar-collapse {
    padding: 10px 10px 14px;
  }

  .navbar .navbar-nav {
    align-items: stretch;
    flex: initial;
    gap: 2px;
  }

  .navbar .nav-link {
    width: 100%;
    padding: 10px 12px;
  }

  .navbar .nav-link::after {
    right: auto;
    bottom: 5px;
    left: 12px;
    width: 34px;
  }

  .navbar-account {
    justify-content: flex-start;
    margin: 10px 0 0;
    padding: 8px 0 0;
    border-top: 1px solid rgba(75, 54, 33, 0.2);
    border-left: 0;
  }

  .navbar .navbar-login {
    justify-content: center;
    width: 44px;
  }

  .navbar-search {
    width: 100%;
    margin: 10px 0 0;
  }

  .navbar-search .form-control {
    width: 100%;
  }

  .navbar .search-results {
    right: 0;
    left: 0;
    width: 100%;
  }
}

.site-footer {
  position: relative;
  margin-top: auto;
  padding: 48px 0 18px;
  overflow: hidden;
  color: #f7eee4;
  background:
    radial-gradient(ellipse at 12% 0%, rgba(195, 138, 78, 0.2), transparent 38%),
    linear-gradient(135deg, #2f2118, #493222 58%, #291c15);
}

.site-footer::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #c38a4e, #e6bd8d, #8b5e3c);
  content: "";
}

.site-footer-content {
  display: grid;
  grid-template-columns: minmax(190px, 1.25fr) repeat(2, minmax(150px, 0.8fr)) minmax(200px, 1fr);
  gap: 32px;
  padding-bottom: 36px;
}

.site-footer-brand,
.site-footer-nav,
.site-footer-note {
  min-width: 0;
}

.site-footer-logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 218px;
  height: 88px;
  margin-bottom: 14px;
  isolation: isolate;
  border: 1px solid rgba(230, 189, 141, 0.72);
  border-radius: 50%;
  background: linear-gradient(145deg, #fffaf2, #f0dfc8);
  box-shadow:
    0 7px 18px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.site-footer-logo::before {
  position: absolute;
  z-index: -1;
  inset: 4px;
  border: 1px solid rgba(139, 94, 60, 0.28);
  border-radius: 50%;
  background: repeating-radial-gradient(
    ellipse at 50% 50%,
    transparent 0 7px,
    rgba(139, 94, 60, 0.09) 8px 9px,
    transparent 10px 13px
  );
  content: "";
}

.site-footer-logo:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.site-footer-logo:focus-visible {
  outline: 2px solid #e6bd8d;
  outline-offset: 3px;
}

.site-footer-logo img {
  position: relative;
  z-index: 1;
  display: block;
  width: 176px;
  max-height: 62px;
  object-fit: contain;
}

.site-footer-brand p,
.site-footer-note p {
  max-width: 280px;
  margin: 0;
  color: rgba(247, 238, 228, 0.72);
  line-height: 1.7;
}

.site-footer-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.site-footer-nav h2 {
  margin: 5px 0 8px;
  color: #e6bd8d;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.site-footer-nav a,
.site-footer-cta {
  color: rgba(247, 238, 228, 0.82);
  text-decoration: none;
  transition: color 0.2s ease;
}

.site-footer-nav a:hover,
.site-footer-nav a:focus-visible,
.site-footer-cta:hover,
.site-footer-cta:focus-visible {
  color: #e6bd8d;
}

.site-footer-eyebrow {
  display: inline-block;
  margin: 5px 0 10px;
  color: #e6bd8d;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.site-footer-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-weight: 600;
}

.site-footer-cta span {
  color: #e6bd8d;
  font-size: 1.2rem;
  transition: transform 0.2s ease;
}

.site-footer-cta:hover span {
  transform: translateX(3px);
}

.site-footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(230, 189, 141, 0.2);
  color: rgba(247, 238, 228, 0.58);
  font-size: 0.82rem;
}

@media (max-width: 991.98px) {
  .site-footer-content {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px;
  }
}

@media (max-width: 575.98px) {
  .site-footer {
    padding-top: 36px;
  }

  .site-footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 26px 18px;
    padding-bottom: 28px;
  }

  .site-footer-brand,
  .site-footer-note {
    grid-column: 1 / -1;
  }

  .site-footer-logo img {
    width: 158px;
  }

  .site-footer-bottom {
    flex-direction: column;
    gap: 6px;
  }
}

/* =========================
   MODAL GENEL TASARIM
========================= */

.modal-content {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  background: #f7f3ee;
  /* açık ahşap tonu */
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.25);
}

/* =========================
   MODAL HEADER (Navbar uyumlu)
========================= */

.modal-header {
  background: linear-gradient(135deg, #5a3e2b, #8b5e3c);
  color: #fff;
  border-bottom: none;
  padding: 18px 20px;
}

.modal-title {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Close (X) butonu */
.btn-close {
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

/* =========================
   FORM STİLİ
========================= */

.modal-body {
  padding: 25px;
}

.form-label {
  font-weight: 500;
  color: #4b3621;
}

/* Input alanları */
.form-control {
  border-radius: 10px;
  border: 1px solid #d6c3b3;
  padding: 10px 12px;
  transition: 0.3s;
  background-color: #fff;
}

.form-control:focus {
  border-color: #8b5e3c;
  box-shadow: 0 0 0 0.2rem rgba(139, 94, 60, 0.25);
}

.country-picker-toggle {
  min-height: 46px;
  background-color: #fff;
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

/* =========================
   BUTTON (Navbar ile uyumlu ana renk)
========================= */

.btn-primary {
  background: #8b5e3c;
  border: none;
  border-radius: 10px;
  padding: 10px;
  font-weight: 500;
  transition: 0.3s;
}

.btn-primary:hover {
  background: #6e472e;
}

/* =========================
   LINKLER
========================= */

.modal-body a {
  color: #8b5e3c;
  text-decoration: none;
  font-weight: 500;
}

.modal-body a:hover {
  text-decoration: underline;
}
</style>
