<template>
  <div class="d-flex text-center flex-grow-1">

    <v-sheet
      class="layout-side d-none d-md-flex flex-column justify-space-between"
    >
    <v-img
        :aspect-ratio="1"
        class="bg-white"
        src="https://flaskhousesystem.oss-cn-hangzhou.aliyuncs.com/authbackground.png"
        cover
      ><div class="mt-3 mt-md-10 pa-2">
        <div class=" text-h3  text-white font-weight-bold mt-10">
          岐云笺
        </div>
        <div class="title my-2">
          Welcome! Let's shopping amazing things together.
        </div>
      </div></v-img>
      
    </v-sheet>
    <v-card
      variant="outlined"
      class="flex-grow-1 d-flex align-center justify-center flex-column"
    >
      <div class="layout-content ma-auto w-full">
        <slot></slot>
      </div>
      <div class="pa-5">Vue 3.2 & Vuetify 3.1.13 & Vite 4.2</div>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
.layout-side {
  width: 420px;
}

.layout-content {
  max-width: 480px;
}
</style>
