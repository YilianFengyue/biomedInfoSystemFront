<script setup lang="ts">
import MainSidebar from "@/components/navigation/MainSidebar.vue";
import MainAppbar from "@/components/toolbar/MainAppbar.vue";
// import GlobalLoading from "@/components/GlobalLoading.vue";
import ToolBox from "@/components/Toolbox.vue";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
const customizeTheme = useCustomizeThemeStore();
</script>

<template>
  <MainSidebar />
  <MainAppbar />
  <v-main
    v-touch="{
      left: () => (customizeTheme.mainSidebar = false),
      right: () => (customizeTheme.mainSidebar = true),
    }"
    
  >
    <ToolBox />
    <div class="flex-fill">
      <slot></slot>
    </div>
  </v-main>
</template>

<style scoped>
.scrollnav {
  height: calc(100vh - 326px);
}
/* 移除了 main-container 的样式 */

</style>