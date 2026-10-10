<template>
  <main class="finished-page">
    <div class="container mt-3">
      <div class="row g-4">
        <div v-for="product in filteredProducts" :key="product.p_id" class="col-md-3">
          <button type="button" class="product-card" @click="openGallery(product)">
            <div class="product-img">
              <img :src="productImageUrl(product.p_imgMain, product)" :alt="product.p_name" loading="lazy">
              <span
                class="stock-badge"
                :class="Number(product.p_stock) > 0 ? 'stock-badge-available' : 'stock-badge-orderable'"
              >
                {{ Number(product.p_stock) > 0 ? 'Stokta' : 'Sipariş Verilebilir' }}
              </span>
              <div class="product-overlay"><span>{{ product.p_name }}</span></div>
            </div>
          </button>
        </div>
      </div>
      <p v-if="searchQuery && !filteredProducts.length" class="search-empty-state">
        “{{ searchQuery }}” ile eşleşen ürün bulunamadı.
      </p>
    </div>
  </main>

  <div
    id="galleryModal"
    ref="galleryModal"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="modalTitle"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered gallery-modal-dialog">
      <div class="modal-content gallery-modal-content">
        <div class="modal-header border-0 gallery-modal-header">
          <div class="gallery-product-summary">
            <h5 id="modalTitle">{{ selectedProduct?.p_name }}</h5>
            <div v-if="selectedProduct" class="gallery-product-details">
              <span>Fiyat: {{ formatPrice(selectedProduct.p_price) }} ₺</span>
              <span>Stok: {{ selectedProduct.p_stock }}</span>
            </div>
          </div>
          <button
            type="button"
            class="btn-close btn-close-white gallery-close-btn"
            data-bs-dismiss="modal"
            aria-label="Kapat"
          ></button>
        </div>

        <div class="modal-body p-0">
          <div
            id="galleryCarousel"
            ref="galleryCarousel"
            class="carousel slide"
          >
            <div class="carousel-inner">
              <div
                v-for="(image, index) in galleryImages"
                :key="image"
                class="carousel-item"
                :class="{ active: index === 0 }"
              >
                <img :src="image" class="d-block w-100" :alt="selectedProduct?.p_name || ''">
              </div>
            </div>

            <button
              v-if="galleryImages.length > 1"
              class="carousel-control-prev"
              type="button"
              data-bs-target="#galleryCarousel"
              data-bs-slide="prev"
              aria-label="Önceki görsel"
            >
              <span class="carousel-control-prev-icon"></span>
            </button>

            <button
              v-if="galleryImages.length > 1"
              class="carousel-control-next"
              type="button"
              data-bs-target="#galleryCarousel"
              data-bs-slide="next"
              aria-label="Sonraki görsel"
            >
              <span class="carousel-control-next-icon"></span>
            </button>
          </div>
        </div>
        <div class="gallery-order-panel">
          <form v-if="Number(selectedProduct?.p_stock) > 0" class="cart-form" @submit.prevent="sepeteEkle">
            <label for="productQuantity" class="quantity-label">Adet</label>
            <input
              id="productQuantity"
              v-model.number="productQuantity"
              class="form-control quantity-input"
              type="number"
              min="1"
              :max="Math.max(0, Number(selectedProduct.p_stock) - selectedProductCartQuantity)"
              step="1"
              required
            >
            <p v-if="quantityExceedsStock" class="stock-limit-warning" role="alert" aria-live="polite">
              Sepetinizdeki adetle birlikte stok miktarını aşamazsınız.
            </p>
            <button class="btn gallery-cart-button" type="submit" :disabled="quantityExceedsStock">
              Sepete Ekle
            </button>
          </form>
          <button
            v-else-if="selectedProduct"
            class="btn gallery-cart-button"
            type="button"
            :disabled="quantityExceedsStock"
            @click="sepeteEkle"
          >
            Sipariş Ver
          </button>
          <p
            v-if="Number(selectedProduct?.p_stock) <= 0 && quantityExceedsStock"
            class="stock-limit-warning"
            role="alert"
            aria-live="polite"
          >
            Stokta olmayan üründen sepete en fazla 1 adet ekleyebilirsiniz.
          </p>
          <RouterLink
            v-if="Number(selectedProduct?.p_stock) <= 0"
            class="production-contact-link"
            :to="{ name: 'contact' }"
          >
            Ürünün yapım süresi için iletişime geçebilirsiniz...
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Carousel, Modal } from 'bootstrap';
import { showSiteAlert } from '../services/siteAlert.js';
import { productNameMatches } from '../utils/productSearch.js';

const productImageModules = import.meta.glob(
  '../assets/img/products/**/*.{jpg,jpeg,png,webp,gif,avif}',
  { eager: true, import: 'default' }
);

function normalizeImageKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

const productImageFolderAliases = {
  baygadget: 'Hosgeldin',
  geometrikeserler: 'GeometrikTasarimlar'
};

export default {
  name: 'FinishedPage',
  inject: {
    sepet: {
      default: () => []
    }
  },
  data() {
    return {
      products: [],
      selectedProduct: null,
      productQuantity: 1,
      galleryImages: [],
      galleryModalHiding: false,
      showGalleryAfterHide: false
    };
  },
  computed: {
    searchQuery() {
      return typeof this.$route.query.search === 'string' ? this.$route.query.search : '';
    },
    filteredProducts() {
      return this.searchQuery
        ? this.products.filter((product) => productNameMatches(product.p_name, this.searchQuery))
        : this.products;
    },
    selectedProductCartQuantity() {
      if (!this.selectedProduct) return 0;

      const selectedKey = this.selectedProduct.p_id
        ?? `${this.selectedProduct.p_name}-${this.selectedProduct.p_price}`;
      return this.sepet.filter((item) => {
        const itemKey = item.p_id ?? `${item.p_name}-${item.p_price}`;
        return itemKey === selectedKey;
      }).length;
    },
    quantityExceedsStock() {
      if (!this.selectedProduct) return false;

      const stock = Number(this.selectedProduct.p_stock);
      const limit = Number.isFinite(stock) && stock > 0 ? stock : 1;
      const quantity = stock > 0 ? Number(this.productQuantity) : 1;
      return !Number.isInteger(quantity)
        || quantity < 1
        || this.selectedProductCartQuantity + quantity > limit;
    }
  },
  methods: {
    async getProducts() {
      try {
        const res = await fetch('http://localhost:3001/api/productPage?type=1', { cache: 'no-store' });
        if (!res.ok) throw new Error('Ürünler alınamadı');
        const products = await res.json();
        this.products = products.sort((first, second) => Number(second.p_id) - Number(first.p_id));
      } catch (error) {
        console.error('Ürünler alınamadı:', error);
      }
    },
    productImageUrl(path, product) {
      if (!path) return '';
      if (/^(https?:|data:|blob:)/i.test(path)) return path;

      const normalizedPath = String(path).replaceAll('\\', '/');
      const productsPath = '/products/';
      const productsPathIndex = normalizedPath.toLowerCase().lastIndexOf(productsPath);
      let relativePath = productsPathIndex >= 0
        ? normalizedPath.slice(productsPathIndex + productsPath.length)
        : normalizedPath.replace(/^\/+/, '');

      if (!relativePath) return '';

      let matchingPath = `../assets/img/products/${relativePath}`;
      if (!productImageModules[matchingPath] && !relativePath.includes('/')) {
        const productFolder = normalizeImageKey(
          productImageFolderAliases[normalizeImageKey(product?.p_name)] || product?.p_name
        );
        const imageFile = relativePath.toLowerCase();
        const matchingEntry = Object.entries(productImageModules).find(([modulePath]) => {
          const parts = modulePath.split('/');
          const folderName = parts.at(-2) || '';
          const fileName = parts.at(-1) || '';
          return normalizeImageKey(folderName) === productFolder
            && fileName.toLowerCase() === imageFile;
        });
        if (!matchingEntry) return '';
        return matchingEntry[1];
      }

      return productImageModules[matchingPath] || '';
    },
    formatPrice(price) {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(price));
    },
    handleGalleryModalHide() {
      this.galleryModalHiding = true;
    },
    handleGalleryModalHidden() {
      this.galleryModalHiding = false;
      if (!this.showGalleryAfterHide) return;

      this.showGalleryAfterHide = false;
      Modal.getOrCreateInstance(this.$refs.galleryModal).show();
    },
    openGallery(product) {
      if (!product) return;
      this.selectedProduct = product;
      this.productQuantity = 1;

      const detailImages = String(product.p_imgDetails || '')
        .split(';')
        .map((path) => path.trim())
        .filter(Boolean);
      const imagePaths = detailImages.length ? detailImages : [product.p_imgMain];
      this.galleryImages = imagePaths
        .map((path) => this.productImageUrl(path, product))
        .filter(Boolean);

      this.$nextTick(() => {
        const modalElement = this.$refs.galleryModal;
        const carouselElement = this.$refs.galleryCarousel;
        if (!modalElement || !carouselElement) return;

        Carousel.getOrCreateInstance(carouselElement).to(0);
        if (this.galleryModalHiding) {
          this.showGalleryAfterHide = true;
          return;
        }
        Modal.getOrCreateInstance(modalElement).show();
      });
    },
    sepeteEkle() {
      if (!this.selectedProduct) return;

      const stock = Number(this.selectedProduct.p_stock);
      const quantity = stock > 0 ? Number(this.productQuantity) : 1;
      const limit = Number.isFinite(stock) && stock > 0 ? stock : 1;
      if (
        !Number.isInteger(quantity)
        || quantity < 1
        || this.selectedProductCartQuantity + quantity > limit
      ) {
        showSiteAlert(
          stock > 0
            ? `Sepetinizdeki ürün adediyle birlikte en fazla ${stock} adet sipariş verebilirsiniz.`
            : 'Stokta olmayan üründen sepete en fazla 1 adet ekleyebilirsiniz.',
          'error'
        );
        return;
      }

      for (let index = 0; index < quantity; index++) {
        this.sepet.push({ ...this.selectedProduct });
      }
      showSiteAlert(
        stock > 0 ? `${quantity} adet ürün sepete eklendi.` : 'Siparişiniz için 1 adet ürün sepete eklendi.'
      );
    }
  },
  mounted() {
    this.$refs.galleryModal.addEventListener('hide.bs.modal', this.handleGalleryModalHide);
    this.$refs.galleryModal.addEventListener('hidden.bs.modal', this.handleGalleryModalHidden);
    this.getProducts();
  },
  beforeUnmount() {
    this.$refs.galleryModal?.removeEventListener('hide.bs.modal', this.handleGalleryModalHide);
    this.$refs.galleryModal?.removeEventListener('hidden.bs.modal', this.handleGalleryModalHidden);
    Modal.getInstance(this.$refs.galleryModal)?.dispose();
    Carousel.getInstance(this.$refs.galleryCarousel)?.dispose();
  }
};
</script>

<style scoped>
.finished-page {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 80px);
  background-image: url("../assets/img/background.png");
  background-size: cover;
  background-position: center 40%;
  background-repeat: no-repeat;
  overflow: visible;
  isolation: isolate;
  padding: 16px 0 32px;
}

.finished-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  z-index: 0;
}

.finished-page .container {
  position: relative;
  z-index: 1;
  margin-top: 0;
}

.product-card {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 2px solid #8b5e3c;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  border-radius: 0;
}

.product-card:hover {
  background: rgba(255, 255, 255, 0.72);
  border: 4px double #8b5e3c;
  transform: translateY(-2px);
}

.product-img {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.stock-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  padding: 6px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.stock-badge-available {
  background: #287a45;
}

.stock-badge-orderable {
  background: #8b5e3c;
}

.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.product-card:hover .product-img img {
  transform: scale(1.08);
}

.product-overlay {
  position: absolute;
  left: 0;
  bottom: 10px;
  width: 100%;
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  transition: 0.3s ease;
}

.product-overlay span {
  color: #f5e6d3;
  font-weight: 800;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
  background: none;
}

.product-card:hover .product-overlay {
  opacity: 1;
  transform: translateY(0);
}

.gallery-modal-dialog {
  max-width: 900px;
  width: min(calc(100vw - 24px), 900px);
  margin: 12px auto;
}

.gallery-modal-content {
  color: #4b3621;
  background:
    linear-gradient(rgba(248, 243, 238, 0.72), rgba(248, 243, 238, 0.72)),
    url("../assets/img/background.png") center / cover no-repeat;
  border: 1px solid rgba(94, 61, 39, 0.2);
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(52, 35, 23, 0.3);
  max-height: calc(100dvh - 24px);
  overflow: hidden;
}

.gallery-modal-header {
  position: relative;
  justify-content: center;
  text-align: center;
  padding-right: 3rem;
  padding-left: 3rem;
  z-index: 2;
  background: linear-gradient(135deg, #5a3e2b, #8b5e3c);
  color: #fff;
  border-bottom: 0;
}

.gallery-product-summary {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.gallery-product-details {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  color: #f5e6d3;
  font-size: 0.9rem;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
}

.gallery-order-panel {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: rgba(248, 243, 238, 0.88);
  border-top: 1px solid rgba(139, 94, 60, 0.2);
}

.cart-form {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
}

.quantity-label {
  color: #5a3e2b;
  font-weight: 700;
}

.quantity-input {
  width: 90px;
  border-color: rgba(139, 94, 60, 0.45);
}

.gallery-cart-button {
  min-width: 150px;
  padding: 9px 18px;
  color: #fff;
  background: #8b5e3c;
  border: 1px solid #8b5e3c;
  border-radius: 999px;
  font-weight: 700;
}

.gallery-cart-button:hover,
.gallery-cart-button:focus-visible {
  color: #fff;
  background: #5a3e2b;
  border-color: #5a3e2b;
}

.gallery-cart-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.stock-limit-warning {
  margin: 0;
  color: #a32121;
  font-weight: 700;
  text-align: center;
}

.production-contact-link {
  color: #5a3e2b;
  font-weight: 600;
  text-align: center;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.production-contact-link:hover {
  color: #8b5e3c;
}

.gallery-close-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 3;
  opacity: 1;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  padding: 0.75rem;
  filter: brightness(0) invert(1);
}

#modalTitle {
  color: #f5e6d3;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  margin: 0;
}

#galleryModal .carousel-item img {
  width: 100%;
  height: min(70dvh, 640px);
  object-fit: contain;
  background: rgba(17, 12, 9, 0.15);
}

#galleryModal .carousel-control-prev,
#galleryModal .carousel-control-next {
  width: 52px;
  height: 52px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
}

#galleryModal .carousel-control-prev-icon,
#galleryModal .carousel-control-next-icon {
  width: 1.8rem;
  height: 1.8rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  filter: invert(0.1);
}

#galleryModal .carousel-control-prev:hover .carousel-control-prev-icon,
#galleryModal .carousel-control-next:hover .carousel-control-next-icon {
  background-color: #8b5e3c;
  transform: scale(1.08);
}

@media (max-width: 575.98px) {
  .gallery-modal-dialog {
    width: calc(100vw - 16px);
    margin: 8px auto;
  }

  .gallery-modal-content {
    max-height: calc(100dvh - 16px);
  }

  .gallery-modal-header {
    min-height: 54px;
    padding: 12px 52px 12px 14px;
  }

  .gallery-close-btn {
    top: 9px;
    right: 10px;
    padding: 0.65rem;
  }

  #modalTitle {
    font-size: 1rem;
  }

  .gallery-product-details {
    gap: 4px 12px;
    font-size: 0.8rem;
  }

  .gallery-order-panel {
    padding: 12px;
  }

  .cart-form {
    gap: 8px;
  }

  .quantity-input {
    width: 72px;
  }

  .gallery-cart-button {
    min-width: 130px;
    padding: 8px 14px;
  }

  #galleryModal .carousel-item img {
    height: min(62dvh, 480px);
  }

  #galleryModal .carousel-control-prev,
  #galleryModal .carousel-control-next {
    width: 40px;
    height: 40px;
  }

  #galleryModal .carousel-control-prev {
    left: 4px;
  }

  #galleryModal .carousel-control-next {
    right: 4px;
  }
}

</style>
