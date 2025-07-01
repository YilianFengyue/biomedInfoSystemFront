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
          tokenStore.setTokens(jwt, csrf);

          // 使用 nextTick 确保状态更新已反映到 DOM 和其他 store
          await nextTick();

          // 在此之后再获取用户信息
          await profileStore.fetchUserProfile();

          console.log('[AuthStore] Profile fetched. User role is:', profileStore.user?.role);

          snackbarStore.showSuccessMessage(response.data.msg || "登录成功！");
          router.push("/dashboard");
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