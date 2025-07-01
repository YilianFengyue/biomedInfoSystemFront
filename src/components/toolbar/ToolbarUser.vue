<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRouter } from "vue-router";
import { useTokenStore } from "~/src/stores/tokenStore"; // 假设你的文件名是 tokenStore
import { useProfileStore } from "@/stores/profileStore";
import StatusMenu from "./StatusMenu.vue";
import { useAuthStore } from "~/src/stores/authStore"; // 导入 authStore

// --- 1. 获取 Store 实例 ---
const router = useRouter();
const tokenStore = useTokenStore();
const profileStore = useProfileStore();
const authStore = useAuthStore();

// --- 2. 使用 storeToRefs 创建响应式引用 ---
// 这样 isLoggedIn 和 user 就会始终与 store 保持同步
const { isLoggedIn } = storeToRefs(tokenStore);
const { user } = storeToRefs(profileStore);

// --- 3. 保留需要的函数 ---
const handleLogout = () => {
  authStore.logout();
  // 推荐使用 router.push，除非你确实需要硬刷新
  router.push("/"); 
};

const goToSignIn = () => {
  router.push("/auth/signin");
};

const navs = [
  {
    title: "个人中心", // 优化一下文案
    link: "/profile",
    icon: "mdi-account-box-outline",
  },
];

// 之前那个复杂的 loadUserAvatar 函数和相关的 onMounted 都可以彻底删除了！
</script>
<template>
   <!-- 未登录时显示登录按钮 -->
   <v-menu
    v-if="!isLoggedIn"
    :close-on-content-click="false"
    location="bottom right"
    transition="slide-y-transition"
    >
    <!-- ---------------------------------------------- -->
    <!-- Activator Btn -->
    <!-- ---------------------------------------------- -->
    <template v-slot:activator="{ props }">
      <v-btn class="mx-2" icon v-bind="props">
        <v-badge content="2" color="success" dot bordered>
          <v-avatar size="40">
            <v-img
              src="./images/unavater.png"  
            ></v-img>
          </v-avatar>
        </v-badge>
      </v-btn>
    </template>
    <v-card max-width="300">
      <v-list lines="three" density="compact">
        <!-- ---------------------------------------------- -->
        <!-- Profile Area -->
        <!-- ---------------------------------------------- -->
        <v-list-item >
          <template v-slot:prepend>
            <v-avatar size="40">
              <v-img
                src="./images/unavater.png"
              ></v-img>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-bold text-primary">
            User
            <StatusMenu />
          </v-list-item-title>
          <v-list-item-subtitle>
            <!-- {{ $store.state.user.email  }} -->
            You are not logged in
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-divider />
      <!-- ---------------------------------------------- -->
      <!-- Menu Area -->
      <!-- ---------------------------------------------- -->

      <v-list variant="flat" elevation="0" :lines="false" density="compact">
        <v-list-item
          color="primary"
          @click="goToSignIn" 
          link
          density="compact"
        >
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-icon>mdi-login</v-icon> 
            </v-avatar>
          </template>
          <div>
            <v-list-item-subtitle class="text-body-2">
              SignIN
            </v-list-item-subtitle>
          </div>
        </v-list-item>
      </v-list>
      <v-divider />
    </v-card>
  </v-menu>

  <v-menu
    v-else
    :close-on-content-click="false"
    location="bottom right"
    transition="slide-y-transition"
  >
    <!-- ---------------------------------------------- -->
    <!-- Activator Btn -->
    <!-- ---------------------------------------------- -->
    <template v-slot:activator="{ props }">
      <v-btn class="mx-2" icon v-bind="props">
        <v-badge content="2" color="success" dot bordered>
          <v-avatar size="40">
            <v-img
              :src="user.avatarUrl || './images/unavater.png'"
              
            ></v-img>
          </v-avatar>
        </v-badge>
      </v-btn>
    </template>
    <v-card max-width="300">
      <v-list lines="three" density="compact">
        <!-- Profile Area -->
        <v-list-item to="/profile">
          <template v-slot:prepend>
            <v-avatar size="40">
              <v-img
                :src="user.avatarUrl || './images/unavater.png'"
                
              ></v-img>
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-bold text-primary">
            {{user.name}}
            <StatusMenu />
          </v-list-item-title>
          <v-list-item-subtitle>
            {{user.email}}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-divider />
      <!-- ---------------------------------------------- -->
      <!-- Menu Area -->
      <!-- ---------------------------------------------- -->

      <v-list variant="flat" elevation="0" :lines="false" density="compact">
        <v-list-item
          color="primary"
          v-for="(nav, i) in navs"
          :key="i"
          :to="nav.link"
          link
          density="compact"
        >
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-icon>{{ nav.icon }}</v-icon>
            </v-avatar>
          </template>

          <div>
            <v-list-item-subtitle class="text-body-2">{{
              nav.title
            }}</v-list-item-subtitle>
          </div>
        </v-list-item>
      </v-list>
      <v-divider />
      <!-- ---------------------------------------------- -->
      <!-- Logout Area -->
      <!-- ---------------------------------------------- -->
      <v-list variant="flat" elevation="0" :lines="false" density="compact">
        <v-list-item color="primary" to="nav.link" link density="compact">
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-icon>mdi-lifebuoy</v-icon>
            </v-avatar>
          </template>

          <div>
            <v-list-item-subtitle class="text-body-2">
              HelpCenter
            </v-list-item-subtitle>
          </div>
        </v-list-item>
        <v-list-item
          color="primary"
          link
          @click="handleLogout"
          density="compact"
        >
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-icon>mdi-logout</v-icon>
            </v-avatar>
          </template>

          <div>
            <v-list-item-subtitle class="text-body-2">
              SignOut
            </v-list-item-subtitle>
          </div>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<style scoped lang="scss"></style>
