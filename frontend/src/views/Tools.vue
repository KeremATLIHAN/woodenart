<template>
  <main class="finished-page">
    <div class="container mt-3">
      <div class="row g-4">
        <div v-for="product in filteredProducts" :key="product.p_id" class="col-md-3">
          <article class="product-card">
            <div class="product-img">
              <img :src="productImageUrl(product.p_imgMain)" :alt="product.p_name" loading="lazy">
              <div class="product-overlay"><span>{{ product.p_name }}</span></div>
            </div>
          </article>
        </div>
      </div>
      <p v-if="searchQuery && !filteredProducts.length" class="search-empty-state">
        “{{ searchQuery }}” ile eşleşen araç bulunamadı.
      </p>
    </div>
  </main>
</template>
<script>
import { productNameMatches } from '../utils/productSearch.js';

export default {
  name: 'FinishedPage',
  data() {
    return {
      products: []
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
        const res = await fetch('http://localhost:3001/api/productPage?type=3', { cache: 'no-store' });
        if (!res.ok) throw new Error('Ürünler alınamadı');
        this.products = await res.json();
      } catch (error) {
        console.error('Ürünler alınamadı:', error);
      }
    },
    productImageUrl(path) {
      if (!path) return '';
      if (/^(https?:|data:|blob:)/i.test(path)) return path;

      const normalizedPath = String(path).replaceAll('\\', '/');
      const productsPath = '/products/';
      const productsPathIndex = normalizedPath.toLowerCase().lastIndexOf(productsPath);
      const relativePath = productsPathIndex >= 0
        ? normalizedPath.slice(productsPathIndex + productsPath.length)
        : normalizedPath.replace(/^\/+/, '');

      if (!relativePath) return '';
      const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
      return `http://localhost:3001/product-images/${encodedPath}`;
    }
  },
  mounted() {
    this.getProducts();
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
  height: 100%;
  border: 2px solid #8b5e3c;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  overflow: hidden;
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

</style>
