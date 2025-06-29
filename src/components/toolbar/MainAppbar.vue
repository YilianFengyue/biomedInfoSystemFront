<template>
  <v-app-bar
    app
    elevation="1"
    :color="isDark ? 'grey-darken-4' : 'white'"
  >
    <v-app-bar-nav-icon @click="toggleSidebar" />

    <v-spacer />

    <!-- 语言切换器 -->
    <LanguageSwitcher />

    <!-- 主题切换器 -->
    <ThemeToggle />

    <!-- 通知菜单 -->
    <ToolbarNotifications />

    <!-- 【关键修改】: 根据登录状态显示不同内容 -->
    <div
      v-if="!tokenStore.isLoggedIn"
      class="d-flex align-center"
    >
      <!-- 如果未登录，显示登录和注册按钮 -->
      <v-btn
        to="/auth/signin"
        variant="outlined"
        color="primary"
        class="mx-2"
        >登录</v-btn
      >
      <v-btn
        to="/auth/signup"
        color="primary"
        >注册</v-btn
      >
    </div>
    <div
      v-else
      class="d-flex align-center"
    >
      <!-- 如果已登录，显示用户头像和菜单 -->
      <ToolbarUser />
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useTheme } from "vuetify";
import { useLayoutStore } from "@/stores/layoutStore";
import { useTokenStore } from "@/stores/tokenStore"; // 1. 导入 tokenStore
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ThemeToggle from "./ThemeToggle.vue";
import ToolbarNotifications from "./ToolbarNotifications.vue";
import ToolbarUser from "./ToolbarUser.vue";

const { isDark } = useTheme();
const layoutStore = useLayoutStore();
const tokenStore = useTokenStore(); // 2. 创建 tokenStore 实例

const toggleSidebar = () => {
  layoutStore.toggleSidebar();
};
</script>