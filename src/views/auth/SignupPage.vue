<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { Icon } from "@iconify/vue";

const router = useRouter();
const authStore = useAuthStore();
const snackbarStore = useSnackbarStore();

// 使用一个响应式对象来统一管理表单数据
const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

// 加载与状态管理
const isLoading = ref(false);
const errorMessage = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 表单引用
const refLoginForm = ref();

// 表单验证规则
const usernameRules = [(v: string) => !!v || "用户名不能为空"];
const passwordRules = [
  (v: string) => !!v || "密码不能为空",
  (v: string) => (v && v.length >= 6) || "密码长度不能少于6位",
];
const confirmPasswordRules = [
  (v: string) => !!v || "请再次输入密码",
  (v: string) => v === form.password || "两次输入的密码不一致",
];

// 提交注册
const handleRegister = async () => {
  errorMessage.value = "";
  const { valid } = await refLoginForm.value.validate();

  if (valid) {
    isLoading.value = true;
    try {
      const success = await authStore.registerWithUsernameAndPassword(
        form.username,
        form.password
      );

      if (success) {
        snackbarStore.showSuccessMessage("注册成功！即将跳转到登录页面。");
        // 注册成功后延迟跳转，给用户看提示的时间
        setTimeout(() => {
          router.push("/auth/signin");
        }, 1500);
      }
    } catch (error: any) {
      // 从Store的拦截器中获取错误信息或使用默认信息
      errorMessage.value = error.response?.data?.msg || "注册失败，该用户名可能已被使用。";
    } finally {
      isLoading.value = false;
    }
  }
};

// 重置错误信息
const resetErrors = () => {
  errorMessage.value = "";
};
</script>

<template>
  <v-card color="white" class="pa-3 ma-3" elevation="3">
    <v-card-title primary-title class="my-4 text-h4">
      <span class="flex-fill"> {{ $t("register.title") }} </span>
    </v-card-title>
    <v-card-subtitle>欢迎加入生物医药数字信息系统</v-card-subtitle>

    <v-card-text>
      <!-- 错误信息提示 -->
      <v-alert v-if="errorMessage" type="error" class="mb-4" dense>
        {{ errorMessage }}
      </v-alert>

      <v-form
        ref="refLoginForm"
        class="text-left"
        @submit.prevent="handleRegister"
      >
        <!-- 用户名输入框 -->
        <v-text-field
          v-model="form.username"
          required
          :label="$t('register.username')"
          density="default"
          variant="underlined"
          color="primary"
          prepend-inner-icon="mdi-account-outline"
          :rules="usernameRules"
          validate-on="blur"
          @change="resetErrors"
          @keyup.enter="handleRegister"
        ></v-text-field>

        <!-- 密码输入框 -->
        <v-text-field
          v-model="form.password"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showPassword ? 'text' : 'password'"
          :label="$t('register.password')"
          density="default"
          variant="underlined"
          color="primary"
          :rules="passwordRules"
          validate-on="blur"
          @change="resetErrors"
          @keyup.enter="handleRegister"
          @click:append-inner="showPassword = !showPassword"
          prepend-inner-icon="mdi-lock-outline"
        ></v-text-field>

        <!-- 确认密码输入框 -->
        <v-text-field
          v-model="form.confirmPassword"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
          :type="showConfirmPassword ? 'text' : 'password'"
          label="确认密码"
          density="default"
          variant="underlined"
          color="primary"
          :rules="confirmPasswordRules"
          validate-on="blur"
          @change="resetErrors"
          @keyup.enter="handleRegister"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          prepend-inner-icon="mdi-lock-check-outline"
        ></v-text-field>

        <!-- 注册按钮 -->
        <v-btn
          :loading="isLoading"
          :disabled="isLoading"
          block
          size="x-large"
          color="primary"
          type="submit"
          class="mt-4"
          >{{ $t("register.button") }}</v-btn
        >

        <div class="my-5 text-center">
          {{ $t("register.agree") }}
          <br />
          <router-link class="text-primary" to="">{{
            $t("common.tos")
          }}</router-link>
          &
          <router-link class="text-primary" to="">{{
            $t("common.policy")
          }}</router-link>
        </div>
      </v-form>
    </v-card-text>
  </v-card>

  <div class="text-center mt-6">
    {{ $t("register.account") }}
    <router-link to="/auth/signin" class="text-primary font-weight-bold">
      {{ $t("register.signin") }}
    </router-link>
  </div>
</template>
