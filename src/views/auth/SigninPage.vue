<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  username: "luyue", // 默认填充用户名
  password: "123456", // 填充您的 admin 密码
});

const isLoading = ref(false);
const errorMessage = ref("");
const showPassword = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    await authStore.loginWithUsernameAndPassword(form.value.username, form.value.password);
    // 登录成功后，authStore 内部会处理重定向
  } catch (error: any) {
    errorMessage.value = error.message || "登录时发生未知错误。";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <v-card color="white" class="pa-3 ma-3" elevation="3">
    <v-card-title primary-title class="my-4 text-h4">
      <span class="flex-fill">登录 - 生物医药数字信息系统</span>
    </v-card-title>
    <v-card-subtitle>请输入您的凭据以继续</v-card-subtitle>

    <v-card-text>
      <v-alert v-if="errorMessage" type="error" class="mb-4" dense>
        {{ errorMessage }}
      </v-alert>
      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="form.username"
          label="用户名"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          required
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.password"
          label="密码"
          prepend-inner-icon="mdi-lock-outline"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          required
          class="mb-4"
        ></v-text-field>

        <v-btn
          :loading="isLoading"
          :disabled="isLoading"
          block
          size="x-large"
          color="primary"
          type="submit"
          class="mt-2"
        >
          登录
        </v-btn>
      </v-form>
    </v-card-text>
     <div class="text-center mt-6">
      还没有账号？
      <router-link to="/auth/signup" class="text-primary font-weight-bold">
        立即注册
      </router-link>
    </div>
  </v-card>
</template>