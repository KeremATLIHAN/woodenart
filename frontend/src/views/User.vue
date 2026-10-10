<script setup>
import adminProducts from '@/components/admin-products.vue';
import adminOrders from '@/components/admin-orders.vue';
import UserAddresses from '@/components/user-addresses.vue';
import { clearAuthCache } from '@/services/auth.js';
</script>

<template>
  <div class="admin-page">
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <h2 class="sidebar-title">Kullanıcı Paneli</h2>
        <nav class="sidebar-nav" aria-label="Kullanıcı menüsü">
          <button type="button" class="sidebar-link" :class="{ active: secim === 'products' }"
            @click="secim = 'products'">
            <i class="bi bi-box-seam"></i><span>Ürünler</span>
          </button>

          <button type="button" class="sidebar-link" :class="{ active: secim === 'orders' }" @click="secim = 'orders'">
            <i class="bi bi-bag-check"></i><span>Siparişler</span>
          </button>


          <button type="button" class="sidebar-link" :class="{ active: secim === 'addresses' }" @click="secim = 'addresses'">
            <i class="bi bi-house-door"></i><span>Adresler</span>
          </button>

          <button type="button" class="sidebar-link logout-link" @click="logout" title="Çıkış yap">
            <i class="bi bi-person-circle"></i><span
              class="d-flex justify-content-between align-items-center flex-grow-1">
              {{ userName }}
              <!-- transform: scaleX(-1) ile ikon yatayda ters çevrildi ve açık kenar sağ üste geldi -->
              <svg xmlns="http://w3.org" width="16" height="16" fill="currentColor" class="bi bi-escape ms-auto"
                viewBox="0 0 16 16" style="transform: scaleX(-1);">
                <path
                  d="M8.538 1.02a.5.5 0 1 0-.076.998 6 6 0 1 1-6.445 6.444.5.5 0 0 0-.997.076A7 7 0 1 0 8.538 1.02" />
                <path
                  d="M7.096 7.828a.5.5 0 0 0 .707-.707L2.707 2.025h2.768a.5.5 0 1 0 0-1H1.5a.5.5 0 0 0-.5.5V5.5a.5.5 0 0 0 1 0V2.732z" />
              </svg>

            </span>
          </button>
        </nav>
      </aside>

      <main class="admin-content">
        <adminProducts v-if="secim === 'products'" />
        <adminOrders v-else-if="secim === 'orders'" />
        <UserAddresses v-else-if="secim === 'addresses'" />
      </main>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      secim: 'products',
      userName: 'Test',
      baseUrl: 'http://localhost:3001',
    };
  },
  mounted() {
    this.getUserName();
  },
  methods: {
    async logout() {
      try {
        await fetch(`${this.baseUrl}/api/logout`, { method: 'POST', credentials: 'include' });
      } finally {
        clearAuthCache();
        this.$router.push('/');
      }
    },

    async getUserName() {
      try {
        const res = await fetch(`${this.baseUrl}/api/auth/me`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Kullanıcı bilgileri alınamadı.');
        }

        const data = await res.json();
        const user = Array.isArray(data) ? data[0] : data;

        if (!user?.u_firstName || !user?.u_lastName) {
          throw new Error('Kullanıcı bilgileri geçersiz.');
        }

        this.userName = `${user.u_firstName} ${user.u_lastName}`;
      } catch (error) {
        console.error(error);
        this.userName = 'Test';
      }
    },
  },
};
</script>


<!--! CSS kodlarimizin oldugu yer -->
<!--! scoped yazmamin nedeni yazacagim kodlarin sadece bu sayfada gecerli olmasi -->
<style scoped>
.admin-page {
  position: relative;
  width: 100%;
  min-height: calc(100dvh - 80px);
  background-image: url("../assets/img/background.png");
  background-size: cover;
  background-position: center 40%;
  background-repeat: no-repeat;
  overflow: visible;
  isolation: isolate;
  padding: 32px clamp(16px, 2.5vw, 40px) 48px 0;
}

.admin-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  z-index: 0;
}

.admin-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: clamp(220px, 18vw, 260px) minmax(0, 1fr);
  gap: clamp(16px, 2vw, 28px);
  align-items: start;
  width: 100%;
  max-width: none;
  margin: 0;
}

.admin-sidebar {
  position: sticky;
  top: 16px;
  padding: 22px 16px;
  color: #fff;
  background: #e6bd8d;
  border: 1px solid rgba(94, 61, 39, 0.18);
  border-radius: 0 18px 18px 0;
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.12);
}

.sidebar-title {
  margin: 0 8px 18px;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #4b3621;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-link {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 12px 14px;
  color: #4b3621;
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid transparent;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 600;
}

.sidebar-link:hover,
.sidebar-link.active {
  color: #fff;
  background-color: #c38a4e;
  border-color: #c38a4e;
  transform: translateY(-2px);
  box-shadow: 0 8px 14px rgba(95, 64, 39, 0.16);
}

.logout-link {
  margin-top: 12px;
  color: #4b3621;
  background: rgba(255, 255, 255, 0.18);
}

.admin-content {
  min-width: 0;
  min-height: calc(100dvh - 160px);
  width: 100%;
  max-width: 100%;
  background: rgba(255, 250, 245, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(2px);
}

@media (max-width: 767.98px) {
  .admin-page {
    padding: 16px 12px 32px;
  }

  .admin-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .admin-content {
    min-height: 60dvh;
  }

  .admin-sidebar {
    position: static;
    border-radius: 18px;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .sidebar-link {
    width: auto;
    flex: 0 0 auto;
    white-space: nowrap;
  }
}
</style>
