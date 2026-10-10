<template>
  <main class="about-page">
    <section class="about">
      <div class="container py-5">
        <div class="row align-items-center g-5">
          <!-- TEXT -->
          <div class="col-md-6 about-text">
            <span class="section-badge">The WoodenArt</span>

            <h3 class="mb-3 fw-bold">Biz Kimiz?</h3>

            <p>
              2018 yılından bu yana, ahşabın doğal dokusuyla buluşan bir yolculuğun içindeyim.
              Başlangıçta bir hobi olarak başlayan ahşap oymacılığı, zamanla tutkuma ve bugün profesyonel
              olarak icra ettiğim bir sanata dönüştü.
            </p>

            <p>
              Ahşabın sıcaklığı, doğallığı ve insana verdiği huzur, bu sanatın en özel yönlerinden
              biridir.
              Oyma işlemi sırasında ortaya çıkan detaylar, yalnızca bir ürün değil; ruhu dinlendiren bir
              sanat eseridir.
            </p>

            <p>
              Çalışmalarımda özellikle ıhlamur ağacını tercih ediyorum. Yumuşak dokusu ve ince detayları
              kusursuz yansıtması sayesinde ahşap oymacılığı için en ideal ağaçlardan biridir.
            </p>

            <div class="highlight-box">
              Her ürün, seri üretimden uzak; tamamen kişiye özel tasarlanır ve bir hikâye taşır.
            </div>

            <p>
              Ham bir ıhlamur kütüğünden başlayan bu yolculuk, sabır ve emekle sanata dönüşür.
            </p>

            <h5 class="brand-signature">
              The WoodenArt, ahşabın sanata dönüştüğü buluşma noktası…
            </h5>
          </div>

          <!-- IMAGE -->
          <div class="col-md-6">
            <div class="image-wrapper">
              <img src="../assets/img/logo.png" class="img-fluid rounded-4" alt="wooden art">
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
export default {
  name: 'AboutPage'
};
</script>

<style scoped>
.about-page {
  width: 100%;
  min-width: 0;
}

.about {
  position: relative;
  min-height: calc(100dvh - 80px);
  display: flex;
  align-items: center;
  background-image: url("../assets/img/background.png");
  background-size: cover;
  background-position: center 40%;
  background-repeat: no-repeat;
  overflow: hidden;
  isolation: isolate;
  padding: 24px 0;
}

.about::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 0;
}

.about .container {
  position: relative;
  z-index: 1;
  margin-top: 0;
}
/* BRAND BADGE */
.section-badge {
    display: inline-block;
    background: rgba(139, 94, 60, 0.12);
    color: #8b5e3c;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    margin-bottom: 6px;
    margin-top: -8px;
}

/* HIGHLIGHT BOX (ÖNEMLİ CÜMLELER) */
.highlight-box {
    background: #f7f3ee;
    border-left: 4px solid #8b5e3c;
    padding: 12px 15px;
    margin: 20px 0;
    font-style: italic;
    color: #5a3e2b;
    border-radius: 6px;
}



/* BAŞLIK */
.about-text h3 {
    color: #5a3e2b;
}

.about-text h5 {
    color: #5a3e2b;
}

@media (max-width: 767.98px) {
  .about {
    align-items: flex-start;
    padding: 8px 0 28px;
  }

  .about .container {
    padding-top: 2rem !important;
    padding-bottom: 2rem !important;
  }

  .about .row {
    --bs-gutter-y: 2rem;
  }

  .image-wrapper {
    max-width: 520px;
    margin: 0 auto;
  }
}

@media (max-width: 575.98px) {
  .about {
    padding-inline: 4px;
  }

  .about-text p,
  .highlight-box {
    font-size: 0.95rem;
  }
}
</style>
