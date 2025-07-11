<template>
  <v-app>
    <component :is="currentLayout" v-if="isRouterLoaded">
      <!-- <router-view v-slot="{ Component, route }">
        <transition :name="route.meta.transition || 'fade'" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view> -->
      <router-view></router-view>
    </component>

    <CustomizationMenu />
    <BackToTop />
    <Snackbar />
  </v-app>
</template>

<script setup lang="ts">
// 导入 Vue 和 Vue Router 的核心功能
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

// 导入你的布局组件
import UILayout from "@/layouts/UILayout.vue";
import LandingLayout from "@/layouts/LandingLayout.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

// 导入你的全局公共组件
import CustomizationMenu from "@/components/CustomizationMenu.vue";
import BackToTop from "@/components/common/BackToTop.vue";
import Snackbar from "@/components/common/Snackbar.vue";
// import RepaireCard from "@/components/RepaireCard.vue"; // 如果有这个组件，请取消注释

// 导入 Pinia stores
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import { useAppStore } from "@/stores/appStore";
import { useProfileStore } from "@/stores/profileStore";
import { useInspirationStore } from '@/stores/inspirationStore';

// 导入 Vuetify 主题
import { useTheme } from "vuetify";

// 【核心】导入我们创建的中央 WebSocket 服务
// 请确保路径正确，根据你的项目结构可能是 @/services/websocket 或 @/utils/websocket
import { useWebSocket } from '@/utils/websocket'; 

// --- Setup 代码开始 ---

const theme = useTheme();
const route = useRoute();
const appStore = useAppStore();
const customizeTheme = useCustomizeThemeStore();
const profileStore = useProfileStore();
const inspirationStore = useInspirationStore();

// 计算路由是否已加载完成
const isRouterLoaded = computed(() => {
  if (route.name !== null) return true;
  return false;
});

// 定义布局类型
const layouts = {
  default: DefaultLayout,
  ui: UILayout,
  landing: LandingLayout,
  auth: AuthLayout,
};

type LayoutName = "default" | "ui" | "landing" | "auth" | "error";

// 根据路由元信息动态计算当前应使用的布局
const currentLayout = computed(() => {
  const layoutName = route.meta.layout as LayoutName;
  if (!layoutName) {
    return DefaultLayout;
  }
  return layouts[layoutName];
});

// onMounted 生命周期钩子，在组件挂载后执行
onMounted(() => {
  // 初始化主题
  theme.global.name.value = appStore.theme;
  // 【重要】在这里发起获取用户信息的异步请求
  profileStore.fetchUserProfile();
  // 加载其他需要初始化的数据
  inspirationStore.loadFromLocalStorage();
});


// ====================【全局 WebSocket 连接解决方案】====================
// 从我们的 websocket 服务中获取连接和断开连接的方法
const { connect, disconnect } = useWebSocket();

// 使用 watch 监听 profileStore 中的用户信息
// 确保在用户信息（特别是ID）被异步加载并赋值后，才执行连接操作
watch(
  () => profileStore.user, // 监听整个 user 对象
  (newUser) => {
    console.log(`[App.vue] 监听到用户信息变化，新的用户是:`, newUser);
    // 只有当 newUser 对象存在，并且它内部的 id 属性也存在时，才发起连接
    if (newUser && newUser.id) {
      console.log(`[App.vue] 用户信息已就绪 (ID: ${newUser.id})，发起 WebSocket 连接。`);
      connect();
    } else {
      // 如果用户不存在（例如登出），则断开连接
      console.log("[App.vue] 用户未登录或已登出，断开 WebSocket 连接。");
      disconnect();
    }
  },
  {
    immediate: true, // 立即执行一次，检查初始状态
    deep: true,      // 深度监听，确保 user 对象内部的变化能被捕捉到
  }
);
// =======================================================================
</script>

<style scoped>
/* 你已有的样式保持不变 */
.global-fix-card {
  position: fixed;
  top: 70px; /* 位于 AppBar 下方 */
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  z-index: 1000; /* 确保在最上层 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
</style>