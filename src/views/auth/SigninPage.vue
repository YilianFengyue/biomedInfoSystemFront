<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { Icon } from "@iconify/vue";

const authStore = useAuthStore();

const refLoginForm = ref();
const form = ref({
  username: "luyue", // 可改成默认空字符串 ""
  password: "123456",
});

const isFormValid = ref(true);
const isLoading = ref(false);
const isSignInDisabled = ref(false);
const showPassword = ref(false);
const errorMessage = ref("");

// 密码验证规则（用户名不再使用邮箱格式规则）
const passwordRules = [
  (v: string) => !!v || "密码不能为空",
  (v: string) => (v && v.length <= 16) || "密码不能超过16位",
];

const handleLogin = async () => {
  const { valid } = await refLoginForm.value.validate();
  if (!valid) return;

  isLoading.value = true;
  isSignInDisabled.value = true;
  errorMessage.value = "";

  try {
    await authStore.loginWithUsernameAndPassword(form.value.username, form.value.password);
    // 成功登录后，authStore 内部会跳转
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.msg || "登录失败，请检查用户名和密码";
  } finally {
    isLoading.value = false;
    isSignInDisabled.value = false;
  }
};
</script>

<template>
  <v-card color="white" class="pa-3 ma-3" elevation="3">
    <v-card-title class="my-4 text-h4">
      <span class="flex-fill font-weight-bold"> 欢迎 </span>
    </v-card-title>
    <v-card-subtitle>登录您的账户</v-card-subtitle>

    <v-card-text>
      <v-alert v-if="errorMessage" type="error" class="mb-4" dense>
        {{ errorMessage }}
      </v-alert>

      <v-form ref="refLoginForm" v-model="isFormValid" lazy-validation>
        <v-text-field
          v-model="form.username"
          label="用户名"
          placeholder="请输入用户名"
          prepend-inner-icon="mdi-account-outline"
          variant="underlined"
          color="primary"
          required
          class="mb-4"
        />

        <v-text-field
          v-model="form.password"
          label="密码"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          :rules="passwordRules"
          prepend-inner-icon="mdi-lock-outline"
          variant="underlined"
          color="primary"
          required
          class="mb-4"
        />

        <v-btn
          :loading="isLoading"
          :disabled="isSignInDisabled"
          block
          size="x-large"
          color="primary"
          class="mt-2"
          @click="handleLogin"
        >
          登录
        </v-btn>
      </v-form>

      <div class="text-grey text-center text-caption font-weight-bold text-uppercase my-5">
        或使用第三方登录
      </div>

      <v-btn class="mb-2" block color="white" @click="authStore.loginWithGoogle">
        <Icon icon="logos:google-icon" class="mr-3" />
        Google
      </v-btn>

      <v-btn block color="white" class="mb-2" @click="authStore.loginWithFacebook">
        <Icon icon="logos:facebook" class="mr-3" />
        Facebook
      </v-btn>

      <div class="text-center mt-6">
        还没有账号？
        <router-link to="/auth/signup" class="text-primary font-weight-bold">
          立即注册
        </router-link>
      </div>
    </v-card-text>
  </v-card>
</template>

