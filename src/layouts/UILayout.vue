<script setup lang="ts">
import Breadcrumb from "@/components/Breadcrumb.vue";
import PageTitle from "@/components/PageTitle.vue";
import MainSidevar from "@/components/navigation/MainSidebar.vue";
import MainAppbar from "@/components/toolbar/MainAppbar.vue";
import ToolBox from "@/components/Toolbox.vue";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";

const customizeTheme = useCustomizeThemeStore();
// import GlobalLoading from "@/components/GlobalLoading.vue";
</script>

<template>
  <!-- 移除原来的 v-img，改用 CSS 背景 -->
  
  <!-- ---------------------------------------------- -->
  <!---Main Sidebar -->
  <!-- ---------------------------------------------- -->
  <MainSidevar />
  
  <!-- ---------------------------------------------- -->
  <!---Top AppBar -->
  <!-- ---------------------------------------------- -->
  <MainAppbar />
  
  <!-- ---------------------------------------------- -->
  <!---MainArea -->
  <!-- ---------------------------------------------- -->
  <v-main
    v-touch="{
      left: () => (customizeTheme.mainSidebar = false),
      right: () => (customizeTheme.mainSidebar = true),
    }"
    class="main-container"
  >
    <!-- <GlobalLoading /> -->
    
    <div v-if="!$route.meta.hidePageHeader" class="d-none d-sm-block px-3">
      <PageTitle></PageTitle>
      <Breadcrumb></Breadcrumb>
    </div>
    
    <div class="flex-fill">
      <slot></slot>
    </div>
    <ToolBox />
  </v-main>
</template>

<style scoped>
.scrollnav {
  height: calc(100vh - 326px);
}

.main-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* --- 新增这两行 --- */
  width: 90%;          /* 设置宽度为90% */
  margin: 0 auto;      /* 上下边距为0，左右自动，实现水平居中 */
  
  /* --- 添加背景图片样式 --- */
  background-image: url('/bg1.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed; /* 固定背景，滚动时背景不动 */
}
</style>

<!-- 如果想要背景应用到整个页面而不只是 main 区域，可以添加全局样式 -->
<style>
/* 全局背景样式 - 应用到整个页面 */
body {
  background-image: url('/bg1.jpg') !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  background-attachment: fixed !important;
}

/* 或者应用到 v-app 根元素 */
.v-application {
  background-image: url('/bg1.jpg') !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  background-attachment: fixed !important;
}
</style>