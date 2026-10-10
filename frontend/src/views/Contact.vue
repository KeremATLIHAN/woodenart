<template>
  <main class="contact-page">
    <div class="contact-shell">
      <div class="container py-5">
        <h2 class="text-center mb-4">Bizimle İletişime Geçin</h2>

        <div class="row g-4 align-items-center">
          <!-- FORM -->
          <div class="col-md-6">
            <form novalidate @submit.prevent="sendMessage">

              <input v-model.trim="newMessage.firstName" type="text" id="contact_name" class="form-control mb-3"
                placeholder="İsim*" autocomplete="given-name" maxlength="50" required>
              <div id="contact_name_sonuc"></div>
              <input v-model.trim="newMessage.lastName" type="text" id="contact_surname" class="form-control mb-3"
                placeholder="Soyisim*" autocomplete="family-name" maxlength="50" required>
              <div id="contact_surname_sonuc"></div>
              <input v-model.trim="newMessage.email" type="email" id="contact_email" class="form-control mb-3"
                placeholder="Email*" autocomplete="email" maxlength="254" required>
              <div id="contact_email_sonuc"></div>
              <div class="input-group mb-3">
                <span v-if="newMessage.code" class="input-group-text">{{ newMessage.code }}</span>
                <input v-model.trim="newMessage.tel" type="tel" id="contact_tel" class="form-control"
                  placeholder="Telefon*" autocomplete="tel" maxlength="32" required>
              </div>
              <div id="contact_tel_sonuc"></div>

              <select v-model="newMessage.subject" class="form-select mb-3" required>
                <option value="">Konu Seçiniz</option>
                <option value="Ürün Bilgisi">Ürün Bilgisi</option>
                <option value="Şikayet">Şikayet</option>
                <option value="Teşekkür">Teşekkür</option>
              </select>

              <textarea v-model.trim="newMessage.message" id="contact_message" class="form-control mb-3" rows="4"
                placeholder="Mesajınız..." maxlength="5000" required></textarea>
              <div id="contact_message_sonuc"></div>

              <div class="form-check mb-3">
                <input v-model="newMessage.check" id="contact_check" class="form-check-input" type="checkbox" required>
                <label for="contact_check">Bilgilerimi onaylıyorum</label>
                <div id="contact_check_sonuc"></div>
              </div>

              <div v-if="status === 'success'" class="alert alert-success" role="status">
                Mesajınız başarıyla gönderildi.
              </div>
              <div v-if="status === 'error'" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
              <button class="btn btn-primary w-100" type="submit" :disabled="sending">
                {{ sending ? 'Gönderiliyor...' : 'Gönder' }}
              </button>
            </form>
          </div>

          <!-- HARİTA -->
          <div class="col-md-6">
            <iframe class="w-100 rounded-4 shadow" height="518"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.696363293404!2d29.11203887586869!3d41.010018619317904!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac8959e92b98d%3A0x9181dc76d587da17!2sSite%2C%20Kamuran%20Sk.%20No%3A8%20D%3A2%2C%2034760%20%C3%9Cmraniye%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1776289062352!5m2!1str!2str"
              style="border:0;" allowfullscreen loading="lazy">
            </iframe>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<script>
import { currentUser } from '@/services/auth.js'

export default {
  name: "ContactPage",
  data() {
    return {

      newMessage: {
        firstName: "",
        lastName: "",
        email: "",
        code: "",
        tel: "",
        subject: "",
        message: "",
        check: false,
      },
      status: "",
      errorMessage: "",
      sending: false,
      loadingProfile: false,
      baseUrl: "http://localhost:3001",
    };
  },
  async mounted() {
    if (currentUser.value) {
      await this.loadAuthenticatedContactDetails();
    }
  },
  //! Degiskeni izler, Degiskenlerde bir degisiklik yapildiginda degismesini izledigimiz kodlar
  watch: {
  },
  //! Var olan dizi uzerinde degisiklik yapacaksak ve yeni deger ureteceksek kullaniriz.Orn; kdv hesaplama, indirim hesaplama gibi islemler yapacaksak kullaniriz.
  computed: {
  },
  //! Bildigimiz fonksiyonlarin oldugu yer.Bir etkilesime girince calisacak fonksiyonlari burada tanimlariz.
  methods: {
    async loadAuthenticatedContactDetails() {
      this.loadingProfile = true;
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(response.status === 401
            ? "Oturum doğrulanamadı. Bilgilerinizi elle doldurabilirsiniz."
            : "Kullanıcı iletişim bilgileri alınamadı.");
        }
        const user = await response.json();
        this.newMessage.firstName = user.u_firstName || "";
        this.newMessage.lastName = user.u_lastName || "";
        this.newMessage.email = user.u_email || "";
        this.newMessage.tel = user.u_tel || "";
        this.newMessage.code = "";
      } catch (error) {
        this.errorMessage = error.message;
        this.status = "error";
      } finally {
        this.loadingProfile = false;
      }
    },
    async sendMessage() {
      this.status = "";
      this.errorMessage = "";
      if (this.sending) return;
      const requiredValues = [
        this.newMessage.firstName,
        this.newMessage.lastName,
        this.newMessage.email,
        this.newMessage.tel,
        this.newMessage.subject,
        this.newMessage.message,
      ];
      if (requiredValues.some((value) => !value.trim())) {
        this.status = "error";
        this.errorMessage = "Lütfen tüm zorunlu alanları doldurun.";
        return;
      }
      if (!this.newMessage.code && !this.newMessage.tel.startsWith("+")) {
        this.status = "error";
        this.errorMessage = "Telefon ülke kodu bulunamadı. Telefon numaranızı ülke koduyla birlikte girin.";
        return;
      }
      if (!this.newMessage.check) {
        this.status = "error";
        this.errorMessage = "Göndermeden önce bilgilerinizi onaylayın.";
        return;
      }

      this.sending = true;
      try {
        const res = await fetch(`${this.baseUrl}/api/contact`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            firstName: this.newMessage.firstName,
            lastName: this.newMessage.lastName,
            email: this.newMessage.email,
            code: this.newMessage.code,
            tel: this.newMessage.tel,
            subject: this.newMessage.subject,
            message: this.newMessage.message,
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || "Mesajınız gönderilemedi.");
        this.status = "success";

        if (!currentUser.value) {
          this.newMessage.firstName = "";
          this.newMessage.lastName = "";
          this.newMessage.email = "";
          this.newMessage.code = "+90";
          this.newMessage.tel = "";
        }
        this.newMessage.subject = "";
        this.newMessage.message = "";
        this.newMessage.check = false;
      } catch (error) {
        this.status = "error";
        this.errorMessage = error.message;
      } finally {
        this.sending = false;
      }
    },


  },
};
</script>
<style scoped>
.contact-page {
  position: relative;
  width: 100%;
  min-height: calc(100dvh - 80px);
  background-image: url("../assets/img/background.png");
  background-size: cover;
  background-position: center 40%;
  background-repeat: no-repeat;
  overflow: visible;
  isolation: isolate;
  padding: 0;
}

.contact-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  z-index: 0;
}

.contact-shell,
.contact-page .container {
  position: relative;
  z-index: 1;
}

.contact-shell {
  width: 100%;
}

.contact-page h2 {
  color: #5a3e2b;
  font-weight: 700;
}

.contact-page .form-control,
.contact-page .form-select {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(139, 94, 60, 0.35);
}

.contact-page .btn-primary {
  color: #fff;
  background: #8b5e3c;
  border-color: #8b5e3c;
  box-shadow: 0 8px 18px rgba(90, 62, 43, 0.2);
}

.contact-page .btn-primary:hover,
.contact-page .btn-primary:active {
  color: #fff;
  background: #6e472e;
  border-color: #6e472e;
}

.contact-page .btn-primary:focus-visible {
  box-shadow: 0 0 0 0.25rem rgba(195, 138, 78, 0.35);
}

.contact-page iframe {
  display: block;
  width: 100%;
  height: min(518px, 62dvh);
  min-height: 360px;
}

@media (max-width: 767.98px) {
  .contact-page .container {
    padding-top: 2rem !important;
    padding-bottom: 2rem !important;
  }

  .contact-page iframe {
    height: 380px;
    min-height: 0;
  }
}

@media (max-width: 575.98px) {
  .contact-page h2 {
    font-size: clamp(1.5rem, 7vw, 2rem);
  }

  .contact-page iframe {
    height: 320px;
  }
}
</style>
