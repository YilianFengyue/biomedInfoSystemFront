import { defineStore } from "pinia";
import http from "@/api/http";
import { useTokenStore } from "./tokenStore";

// 定义用户资料的接口
interface UserProfile {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  gender: string;
  bio: string | null;
  username?: string;
  role?: number;
}

export const useProfileStore = defineStore("profile", {
  state: () => ({
    user: null as UserProfile | null,
    isLoaded: false
  }),

  actions: {
    async fetchUserProfile() {
      const tokenStore = useTokenStore();
      if (!tokenStore.isLoggedIn) {
        this.isLoaded = true;
        return;
      }

      try {
        const response = await http.get(`/users/userInfo?_t=${new Date().getTime()}`);
        this.user = response.data.data;
        this.isLoaded = true;
      } catch (error) {
        console.error("获取用户信息失败:", error);
        this.clearProfile();
        this.isLoaded = true;
        throw error;
      }
    },

    clearProfile() {
      this.user = null;
      this.isLoaded = false;
    },

    setUser(profile: UserProfile) {
      this.user = profile;
      this.isLoaded = true;
    },
  },

  persist: {
    paths: ['user'],
  },
});
