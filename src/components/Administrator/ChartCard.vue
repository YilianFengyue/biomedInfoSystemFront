<script setup lang="ts">
import { ref, onMounted } from "vue";

import BarChart1 from "./BarChart1.vue";
const loading = ref(true);

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 1000);
});
</script>
<template>
  <!-- loading spinner -->
  <div
    v-if="loading"
    class="h-full d-flex flex-grow-1 align-center justify-center"
  >
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
  <div v-else>
    <h6 class="text-h6 d-flex align-center font-weight-bold">
      <span class="pa-5">房源数量前20</span>
    </h6>
    <v-card variant="flat">
      <BarChart1 />
    </v-card>
  </div>
</template>

<style lang="scss" scoped></style>
