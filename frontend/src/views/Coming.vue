<template>
  <main class="finished-page">
    <div class="container mt-3">
      <div class="row g-4">
        <div v-for="product in filteredProducts" :key="product.p_id" class="col-md-3">
          <button type="button" class="product-card" @click="openGallery(product)">
            <div class="product-img">
              <img :src="productImageUrl(product.p_imgMain, product)" :alt="product.p_name" loading="lazy">
              <div class="product-overlay"><span>{{ product.p_name }}</span></div>
            </div>
          </button>
        </div>
      </div>
      <p v-if="searchQuery && !filteredProducts.length" class="search-empty-state">
        “{{ searchQuery }}” ile eşleşen çalışma bulunamadı.
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
      <div class="modal-content bg-dark text-white gallery-modal-content">
        <div class="modal-header border-0 gallery-modal-header">
          <h5 id="modalTitle">{{ selectedProduct?.p_name }}</h5>
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
      </div>
    </div>
  </div>
</template>
<script>
import { Carousel, Modal } from 'bootstrap';
import { productNameMatches } from '../utils/productSearch.js';

export default {
  name: 'FinishedPage',
  data() {
    return {
      products: [],
      selectedProduct: null,
      galleryImages: [],
      galleryModalHiding: false,
      showGalleryAfterHide: false
    };
  },
  computed: {
    searchQuery() {
      return typeof this.$route.query.search === 'string' ? this.$route.query.search : '';
    },
    selectedProductId() {
      return typeof this.$route.query.p_id === 'string' ? this.$route.query.p_id : '';
    },
    filteredProducts() {
      if (this.selectedProductId) {
        return this.products.filter((product) => String(product.p_id) === this.selectedProductId);
      }
      return this.searchQuery
        ? this.products.filter((product) => productNameMatches(product.p_name, this.searchQuery))
        : this.products;
    }
  },
  methods: {
    async getProducts() {
      try {
        const res = await fetch('http://localhost:3001/api/productPage?type=2', { cache: 'no-store' });
        if (!res.ok) throw new Error('Ürünler alınamadı');
        this.products = await res.json();
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
      if (Number(product?.p_type) === 2 && !relativePath.includes('/')) {
        const folderName = String(product.p_name || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/ı/g, 'i')
          .replace(/[^a-z0-9]/gi, '');
        relativePath = `${folderName}/${relativePath}`;
      }

      const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
      return `http://localhost:3001/product-images/${encodedPath}`;
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
  z-index: 2;
  background: linear-gradient(135deg, #5a3e2b, #8b5e3c);
  color: #fff;
  border-bottom: 0;
}

.gallery-close-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 3;
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 50%;
  padding: 0.75rem;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
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
