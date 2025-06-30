import { defineStore } from "pinia";
import router from "@/router";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useTokenStore } from "@/stores/tokenStore";
import { useProfileStore } from "@/stores/profileStore";
import { nextTick } from 'vue';
import { loginApi, registerApi, type LoginPayload, type RegisterPayload } from '@/api/userApi';

export const useAuthStore = defineStore("auth", {
  state: () => ({
    isLoading: false,
  }),

  actions: {
    async loginWithUsernameAndPassword(username: string, password: string) {
      this.isLoading = true;
      const snackbarStore = useSnackbarStore();
      const tokenStore = useTokenStore();
      const profileStore = useProfileStore();

      try {
        const payload: LoginPayload = {
            username: username,
            passwordHash: password
        };
        const response = await loginApi(payload);

        // 【关键修改】从登录响应中同时获取 JWT 和 CSRF Token
        const jwt = response.data.data.token;
        const csrf = response.data.data.csrf_token;

        if (jwt && csrf) {
          // 调用 tokenStore 中新的 action 来同时设置两个 Token
          tokenStore.setTokens(jwt, csrf);

          await nextTick();
          await profileStore.fetchUserProfile();

          // --- 在这里添加日志 ---
          console.log('[AuthStore] Profile fetched. User role is:', profileStore.user?.role);
          
          snackbarStore.showSuccessMessage(response.data.msg || "登录成功！");
          router.push("/dashboard");
        } else {
          throw new Error("登录失败：未能从服务器获取有效的凭证 (JWT or CSRF Token is missing)。");
        }

      } catch (error: any) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async registerWithUsernameAndPassword(username: string, password: string) {
      const snackbarStore = useSnackbarStore();
      this.isLoading = true;
      try {
        const payload: RegisterPayload = {
          username: username,
          passwordHash: password
        };
        const response = await registerApi(payload);
        snackbarStore.showSuccessMessage(response.data.msg || "注册成功！");
        return true;
      } catch (error: any) {
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      const tokenStore = useTokenStore();
      const profileStore = useProfileStore();
      const snackbarStore = useSnackbarStore();

      // 调用移除所有凭证的方法
      tokenStore.removeTokens();
      profileStore.clearProfile();

      snackbarStore.showInfoMessage("您已成功登出。");
      router.push("/auth/signin");
    },
  },
});