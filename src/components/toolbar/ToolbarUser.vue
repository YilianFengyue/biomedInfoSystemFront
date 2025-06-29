<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from "vue-router";
import { useTokenStore } from "@/stores/tokenStore";
import { useProfileStore } from "@/stores/profileStore";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const tokenStore = useTokenStore();
const profileStore = useProfileStore();
const authStore = useAuthStore();

const isLoggedIn = computed(() => tokenStore.isLoggedIn);
const user = computed(() => profileStore.user);

const handleLogout = () => {
  authStore.logout();
};

const goToProfile = () => {
  router.push('/profile');
};
</script>

<template>
  <div v-if="!tokenStore.isLoggedIn" class="d-flex align-center">
    <!-- <v-btn to="/auth/signin" icon>
      <v-avatar color="primary">
        <v-icon>mdi-account-circle</v-icon>
      </v-avatar>
       <v-tooltip
          activator="parent"
          location="bottom"
        >
          登录/注册
        </v-tooltip>
    </v-btn> -->
  </div>

  <v-menu
    v-else
    :close-on-content-click="false"
    location="bottom right"
    transition="slide-y-transition"
  >
    <template v-slot:activator="{ props }">
      <v-btn class="mx-2" icon v-bind="props">
        <v-badge dot bordered color="success">
          <v-avatar size="40">
            <v-img :src="user?.avatarUrl || 'https://cdn.vuetifyjs.com/images/avatars/avatar-1.png'" alt="用户头像"></v-img>
          </v-avatar>
        </v-badge>
      </v-btn>
    </template>
    
    <v-card max-width="300">
      <v-list lines="three" density="compact">
        <v-list-item to="/profile">
          <template v-slot:prepend>
            <v-avatar size="40">
              <v-img :src="user?.avatarUrl || 'https://cdn.vuetifyjs.com/images/avatars/avatar-1.png'" alt="用户头像"></v-img>
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-bold text-primary">
            {{ user?.nickname || user?.username }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ user?.bio || '生物医药研究员' }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list variant="flat" elevation="0" :lines="false" density="compact">
        <v-list-item color="primary" @click="goToProfile" link density="compact">
          <template v-slot:prepend>
             <v-icon>mdi-account-outline</v-icon>
          </template>
          <v-list-item-title>个人中心</v-list-item-title>
        </v-list-item>
        <v-list-item color="primary" @click="handleLogout" link density="compact">
          <template v-slot:prepend>
             <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>退出登录</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>
