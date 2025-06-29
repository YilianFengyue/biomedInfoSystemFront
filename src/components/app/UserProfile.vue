<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push("/auth/signin");
};

const userProfile = [
  {
    title: "我的个人资料",
    desc: "账户设置",
    icon: "mdi-account-box-outline",
    link: "/profile",
  },
  {
    title: "我的收件箱",
    desc: "消息和邮件",
    icon: "mdi-email-outline",
    link: "/",
  },
  {
    title: "我的任务",
    desc: "待办事项和请求",
    icon: "mdi-format-list-checks",
    link: "/",
  },
];
</script>

<template>
  <v-menu location="bottom">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props">
        <v-avatar>
          <v-img
            src="https://cdn.vuetifyjs.com/images/avatars/avatar-1.png"
            alt="User Avatar"
          ></v-img>
        </v-avatar>
      </v-btn>
    </template>

    <v-list class="pa-2" elevation="3" width="250" rounded="lg">
      <v-list-item class="mb-2" rounded="lg">
        <template v-slot:prepend>
          <v-avatar>
            <v-img
              src="https://cdn.vuetifyjs.com/images/avatars/avatar-1.png"
              alt="User Avatar"
            ></v-img>
          </v-avatar>
        </template>
        <v-list-item-title class="font-weight-bold">
          {{ authStore.user?.username || "测试用户" }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ authStore.user?.role || "管理员" }}
        </v-list-item-subtitle>
      </v-list-item>
      
      <v-divider></v-divider>

      <v-list-item
        v-for="item in userProfile"
        :key="item.title"
        :to="item.link"
        class="my-1"
        rounded="lg"
      >
        <template v-slot:prepend>
          <v-icon :icon="item.icon" class="mr-3"></v-icon>
        </template>
        <div>
          <v-list-item-title class="font-weight-medium">
            {{ item.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ item.desc }}
          </v-list-item-subtitle>
        </div>
      </v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-item @click="handleLogout" rounded="lg">
        <template v-slot:prepend>
          <v-icon icon="mdi-logout-variant" class="mr-3"></v-icon>
        </template>
        <v-list-item-title>退出登录</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>