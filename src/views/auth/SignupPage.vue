<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  username: '',
  email: '', // 保留UI字段，但不会发送给后端
  password: '',
  confirmPassword: ''
});

const isLoading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致';
    return;
  }
  isLoading.value = true;
  errorMessage.value = '';
  try {
    // --- 修改点: 调用 Store ---
    // authStore 内部已经处理好了后端需要的字段，这里只需要传递核心信息
    const success = await authStore.registerWithUsernameAndPassword(form.value.username, form.value.password);
    if(success) {
      // 注册成功后提示用户并跳转到登录页
      alert('注册成功！即将跳转到登录页面。');
      router.push('/auth/signin');
    }
  } catch (error: any) {
    // 错误信息会由 authStore 处理并显示 snackbar，这里可以额外处理UI
    errorMessage.value = error.message || '注册失败，该用户名可能已被占用。';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <v-card color="white" class="pa-3 ma-3" elevation="3">
    <v-card-title primary-title class="my-4 text-h4">
      <span class="flex-fill">注册新用户</span>
    </v-card-title>
    <v-card-subtitle>欢迎加入生物医药数字信息系统</v-card-subtitle>

    <v-card-text>
      <v-alert v-if="errorMessage" type="error" class="mb-4" dense>
        {{ errorMessage }}
      </v-alert>
      <v-form @submit.prevent="handleRegister">
        <v-text-field
          v-model="form.username"
          label="用户名"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          required
          class="mb-4"
        ></v-text-field>
        
        <v-text-field
          v-model="form.email"
          label="电子邮箱 (可选)"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.password"
          label="密码"
          prepend-inner-icon="mdi-lock-outline"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          required
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.confirmPassword"
          label="确认密码"
          prepend-inner-icon="mdi-lock-check-outline"
          :type="showPassword ? 'text' : 'password'"
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
          注册
        </v-btn>
      </v-form>
    </v-card-text>
    <div class="text-center mt-6">
      已经有账号了？
      <router-link to="/auth/signin" class="text-primary font-weight-bold">
        登录
      </router-link>
    </div>
  </v-card>
</template>
