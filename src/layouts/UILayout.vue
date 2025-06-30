<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "vuetify";
import { useAuthStore } from "@/stores/authStore"; // 引入用户状态管理
import VerticalNav from "@/components/app/VerticalNav.vue";
import UserProfile from "@/components/app/UserProfile.vue";

const drawer = ref(true);
const theme = useTheme();
const authStore = useAuthStore(); // 初始化用户状态

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark
    ? "light"
    : "dark";
}
</script>

<template>
  <v-app
    :theme="theme.global.name.value"
    class="main-app"
    :class="theme.global.name.value"
  >
    <v-navigation-drawer
      v-model="drawer"
      width="260"
      elevation="1"
      app
      class="main-nav"
    >
      <div class="pa-4">
        <div class="d-flex align-center">
          <v-icon color="primary" size="32" class="mr-2">mdi-leaf-heart</v-icon>
          <span class="text-h6">生物医药系统</span>
        </div>
      </div>
      <vertical-nav />
    </v-navigation-drawer>

    <v-app-bar app elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>生物医药数字信息系统</v-toolbar-title>

      <v-spacer></v-spacer>

      <div class="d-flex align-center px-4">
        <template v-if="!authStore.user">
          <v-btn
            to="/auth/signin"
            variant="outlined"
            color="primary"
            class="mr-2"
          >
            登录
          </v-btn>
          <v-btn to="/auth/signup" color="primary">
            注册
          </v-btn>
        </template>

        <template v-else>
          <UserProfile />
        </template>
      </div>

       <v-btn icon @click="toggleTheme">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <div class="pa-5">
        <slot>
          <router-view />
        </slot>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.main-app {
  background-color: rgb(var(--v-theme-background-color), 0.5) !important;
}
</style>
