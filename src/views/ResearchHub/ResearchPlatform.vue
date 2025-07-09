<!--
* @Component: 科研平台主界面
* @Description: 科研管理系统主容器，包含侧边栏和主内容区
-->
<script setup lang="ts">
import ResearchMenu from "@/views/ResearchHub/components/ResearchMenu.vue";
</script>

<template>
  <v-container class="research-container" fluid>
    <v-row class="h-100">
      <!-- ---------------------------------------------- -->
      <!-- 侧边栏 -->
      <!-- ---------------------------------------------- -->
      <v-col cols="12" md="3" class="d-none d-md-block pa-0">
        <div class="sidebar">
          <ResearchMenu />
        </div>
      </v-col>

      <!-- ---------------------------------------------- -->
      <!-- 主内容区 -->
      <!-- ---------------------------------------------- -->
      <v-col cols="12" md="9" class="pa-0">
        <div class="main">
          <router-view v-slot="{ Component }">
            <transition name="fade">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
.research-container {
  height: 100vh;
  padding: 0; // 改为0，让子元素控制padding
  background-color: transparent; // 去掉灰色背景
  
  .v-row {
    height: 100%;
  }

  .sidebar {
    height: 100%;
    // 从 EmailApp.vue 的样式借鉴
    background-color: #fff; 
    margin-right: 20px;
  }

  .main {
    flex: 1; // 新增
    height: 100%;
    overflow: auto;
    background-color: #fff; // 和 EmailApp.vue 保持一致的白色背景
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>