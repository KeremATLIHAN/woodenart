<template>
  <section class="addresses">
    <div class="addresses-header">
      <div>
        <h2>Adreslerim</h2>
        <p>Kayıtlı teslimat adreslerinizi yönetin.</p>
      </div>
    </div>

    <form class="address-form" @submit.prevent="saveAddress">
      <h3>{{ editingAddressId ? 'Adresi güncelle' : 'Yeni adres ekle' }}</h3>
      <label class="form-label" for="address-tckn">TCKN*</label>
      <input id="address-tckn" v-model.trim="form.tckn" class="form-control" type="text" inputmode="numeric"
        autocomplete="off" minlength="11" maxlength="11" pattern="[0-9]{11}"
        :class="{ 'is-invalid': tcknError }" :aria-describedby="tcknError ? 'address-tckn-error' : undefined"
        :disabled="loading || (limitReached && !editingAddressId)" @input="tcknTouched = true" @blur="tcknTouched = true" required>
      <small v-if="tcknError" id="address-tckn-error" class="text-danger" role="alert">
        TCKN tam olarak 11 rakamdan oluşmalıdır.
      </small>
      <select id="address-label" v-model="form.label" class="form-select"
        :disabled="loading || (limitReached && !editingAddressId)" required>
        <option disabled value="">Adres başlığı seçiniz</option>
        <option v-for="label in addressLabels" :key="label" :value="label"
          :disabled="isLabelUsed(label, editingAddressId)">
          {{ label }}{{ isLabelUsed(label, editingAddressId) ? ' (Kullanımda)' : '' }}
        </option>
      </select>
      <p v-if="selectedLabelUsed" class="text-danger mb-0" role="alert">
        Bu başlıkla zaten bir adresiniz var. Her başlık yalnızca bir kez kullanılabilir.
      </p>
      <div class="address-fields-grid">
        <div class="address-field">
          <label class="form-label" for="address-country">Ülke*</label>
          <select id="address-country" v-model="form.country" class="form-select"
            :disabled="countriesLoading || loading || (limitReached && !editingAddressId)" required>
            <option disabled value="">{{ countriesLoading ? 'Ülkeler yükleniyor...' : 'Ülke seçiniz' }}</option>
            <option v-for="country in countries" :key="country.id" :value="country.country_name">
              {{ country.country_name }}
            </option>
          </select>
          <p v-if="countriesError" class="text-danger mb-0" role="alert">{{ countriesError }}</p>
        </div>
        <div class="address-field">
          <label class="form-label" for="address-province">İl*</label>
          <input id="address-province" v-model.trim="form.province" class="form-control" type="text" maxlength="100"
            autocomplete="address-level1" :disabled="loading || (limitReached && !editingAddressId)" required>
        </div>
        <div class="address-field">
          <label class="form-label" for="address-district">İlçe*</label>
          <input id="address-district" v-model.trim="form.district" class="form-control" type="text" maxlength="100"
            autocomplete="address-level2" :disabled="loading || (limitReached && !editingAddressId)" required>
        </div>
        <div class="address-field">
          <label class="form-label" for="address-postal-code">Posta kodu*</label>
          <input id="address-postal-code" v-model.trim="form.postalCode" class="form-control" type="text"
            maxlength="20" autocomplete="postal-code" :disabled="loading || (limitReached && !editingAddressId)" required>
        </div>
      </div>
      <label class="form-label" for="address-text">Açık adres</label>
      <textarea id="address-text" v-model.trim="form.address" class="form-control" rows="4" maxlength="1000"
        placeholder="Mahalle, cadde, bina ve daire bilgileri"
        :disabled="loading || (limitReached && !editingAddressId)" required />
      <p v-if="error" class="alert alert-danger mt-3 mb-0" role="alert">{{ error }}</p>


      <div class="address-form-actions">
        <button class="btn wooden-btn mt-3" type="submit"
          :disabled="saving || loading || (limitReached && !editingAddressId) || selectedLabelUsed">
          {{ saving ? 'Kaydediliyor...' : editingAddressId ? 'Değişiklikleri kaydet' : 'Adresi kaydet' }}
        </button>
        <button v-if="editingAddressId" class="btn btn-outline-secondary mt-3" type="button"
          :disabled="saving" @click="cancelEditing">
          İptal
        </button>
      </div>
      <p v-if="loading" class="address-limit-notice" role="status">
        Kayıtlı adresleriniz kontrol ediliyor...
      </p>
      <p v-else class="address-limit-notice" role="status">
        En fazla 3 adres kaydedebilirsiniz. Kalan adres hakkınız: <strong>{{ remainingAddresses }}</strong>
      </p>
    </form>

    <div class="saved-addresses">
      <h3>Kayıtlı adresler</h3>
      <p v-if="loading" role="status">Adresler yükleniyor...</p>
      <p v-else-if="!addresses.length">Henüz kayıtlı adresiniz yok.</p>
      <template v-else>
        <article v-for="address in addresses" :key="address.a_id" class="address-card">
          <div>
            <h4>{{ address.a_label }}</h4>
            <p>TCKN: {{ address.a_tckn }}</p>
            <p>{{ address.a_country }}, {{ address.a_province }} / {{ address.a_district }}</p>
            <p>Posta kodu: {{ address.a_postal_code }}</p>
            <p>{{ address.a_address }}</p>
          </div>
          <div class="address-actions">
            <button class="btn btn-outline-primary btn-sm" type="button"
              :disabled="loading || saving || deletingId !== null" @click="startEditing(address)">
              Güncelle
            </button>
            <button class="btn btn-outline-danger btn-sm" type="button" :disabled="deletingId === address.a_id || saving"
              @click="deleteAddress(address.a_id)">
              {{ deletingId === address.a_id ? 'Siliniyor...' : 'Sil' }}
            </button>
          </div>
        </article>
      </template>
    </div>
  </section>
</template>

<script>
import { showSiteAlert } from '@/services/siteAlert.js';

export default {
  name: 'UserAddresses',
  data() {
    return {
      baseUrl: 'http://localhost:3001',
      addresses: [],
      countries: [],
      countriesLoading: true,
      countriesError: '',
      form: {
        tckn: '',
        label: '',
        country: '',
        province: '',
        district: '',
        postalCode: '',
        address: '',
      },
      tcknTouched: false,
      addressLabels: ['Ev', 'İş', 'Diğer'],
      loading: true,
      saving: false,
      editingAddressId: null,
      deletingId: null,
      error: '',
    };
  },
  computed: {
    tcknError() {
      return this.tcknTouched && !/^\d{11}$/.test(this.form.tckn);
    },
    selectedLabelUsed() {
      return Boolean(this.form.label) && this.isLabelUsed(this.form.label, this.editingAddressId);
    },
    remainingAddresses() {
      return Math.max(0, 3 - this.addresses.length);
    },
    limitReached() {
      return this.remainingAddresses === 0;
    },
  },
  mounted() {
    this.loadCountries();
    this.loadAddresses();
  },
  methods: {
    isLabelUsed(label, excludedId = null) {
      const normalizedLabel = label.trim().toLocaleLowerCase('tr-TR');
      return this.addresses.some(
        (address) => String(address.a_id) !== String(excludedId)
          && String(address.a_label).trim().toLocaleLowerCase('tr-TR') === normalizedLabel
      );
    },
    async loadCountries() {
      this.countriesLoading = true;
      this.countriesError = '';
      try {
        const response = await fetch(`${this.baseUrl}/countries`, { cache: 'no-store' });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.message || `Ülkeler alınamadı (HTTP ${response.status}).`);
        }
        this.countries = data;
      } catch (error) {
        this.countriesError = error.message || 'Ülkeler yüklenirken hata oluştu.';
      } finally {
        this.countriesLoading = false;
      }
    },
    async loadAddresses() {
      this.loading = true;
      this.error = '';
      try {
        const response = await fetch(`${this.baseUrl}/api/addresses`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || `Adresler alınamadı (HTTP ${response.status}).`);
        }
        this.addresses = data;
      } catch (error) {
        this.error = error.message || 'Adresler alınırken bir hata oluştu.';
      } finally {
        this.loading = false;
      }
    },
    startEditing(address) {
      this.editingAddressId = address.a_id;
      this.form = {
        tckn: address.a_tckn,
        label: address.a_label,
        country: address.a_country,
        province: address.a_province,
        district: address.a_district,
        postalCode: address.a_postal_code,
        address: address.a_address,
      };
      this.tcknTouched = false;
      this.error = '';
      this.$el.querySelector('#address-tckn')?.focus();
    },
    cancelEditing() {
      this.editingAddressId = null;
      this.form = {
        tckn: '',
        label: '',
        country: '',
        province: '',
        district: '',
        postalCode: '',
        address: '',
      };
      this.tcknTouched = false;
      this.error = '';
    },
    async saveAddress() {
      if (this.saving) return;
      this.tcknTouched = true;
      if (!/^\d{11}$/.test(this.form.tckn)) {
        this.error = 'TCKN tam olarak 11 rakamdan oluşmalıdır.';
        return;
      }
      this.saving = true;
      this.error = '';
      try {
        const isEditing = this.editingAddressId !== null;
        const endpoint = isEditing
          ? `${this.baseUrl}/api/addresses/${this.editingAddressId}`
          : `${this.baseUrl}/api/addresses`;
        const response = await fetch(endpoint, {
          method: isEditing ? 'PUT' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || `Adres kaydedilemedi (HTTP ${response.status}).`);
        }
        this.cancelEditing();
        await this.loadAddresses();
        showSiteAlert(isEditing ? 'Adres başarıyla güncellendi.' : 'Adres başarıyla eklendi.');
      } catch (error) {
        showSiteAlert(error.message || 'Adres kaydedilirken bir hata oluştu.', 'error');
      } finally {
        this.saving = false;
      }
    },
    async deleteAddress(id) {
      this.deletingId = id;
      this.error = '';
      try {
        const response = await fetch(`${this.baseUrl}/api/addresses/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || `Adres silinemedi (HTTP ${response.status}).`);
        }
        this.addresses = this.addresses.filter((address) => address.a_id !== id);
        if (String(this.editingAddressId) === String(id)) this.cancelEditing();
        showSiteAlert('Adres başarıyla silindi.');
      } catch (error) {
        showSiteAlert(error.message || 'Adres silinirken bir hata oluştu.', 'error');
      } finally {
        this.deletingId = null;
      }
    },
  },
};
</script>

<style scoped>
.addresses {
  color: #4b3621;
}

.addresses-header {
  margin-bottom: 20px;
}

.addresses-header h2,
.address-form h3,
.saved-addresses h3 {
  margin-bottom: 8px;
}

.addresses-header p {
  margin-bottom: 0;
}

.address-limit-notice {
  margin: 2px 0 0;
  padding: 6px 9px;
  border: 1px solid rgba(139, 94, 60, 0.2);
  border-radius: 8px;
  background: rgba(230, 189, 141, 0.24);
  color: #6e563f;
  font-size: 0.8rem;
  line-height: 1.3;
}

.address-form {
  display: grid;
  gap: 8px;
  width: 100%;
  padding: 20px;
  border: 1px solid rgba(94, 61, 39, 0.18);
  border-radius: 14px;
  background: rgba(255, 250, 245, 0.82);
}

.address-form-actions,
.address-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.address-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.address-field {
  min-width: 0;
}

.address-field .form-label {
  margin-bottom: 4px;
}

.address-field .text-danger {
  margin-top: 4px;
}

.wooden-btn {
  justify-self: start;
  background: #e6bd8d;
  border: 2px solid #c38a4e;
  color: #4b3621;
  border-radius: 999px;
  padding: 0.6rem 1.1rem;
  font-weight: 700;
}

.saved-addresses {
  margin-top: 28px;
}

.address-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-top: 12px;
  padding: 16px;
  border: 1px solid rgba(94, 61, 39, 0.18);
  border-radius: 14px;
  background: rgba(255, 250, 245, 0.82);
}

.address-card h4 {
  font-size: 1rem;
  font-weight: 700;
}

.address-card p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 575.98px) {
  .address-fields-grid {
    grid-template-columns: 1fr;
  }

  .address-card {
    flex-direction: column;
  }
}
</style>
