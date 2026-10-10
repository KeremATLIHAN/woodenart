<template>
  <main class="home">
    <div class="container py-4 home-content">
      
    </div>
  </main>
</template>

<style scoped>
.home {
    min-height: calc(100vh - 80px);
    min-height: calc(100svh - 80px);
    position: relative;
    background-image: url("../assets/img/woodenart2.png");
    background-color: #2b1b12;
    background-size: cover;
    background-position: center 40%;
    background-repeat: no-repeat;
}

.home::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    z-index: 0;
}

.home-content {
    position: relative;
    z-index: 1;
    color: white;
}


</style>
