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
  }),

  actions: {
    // 从后端获取用户资料
    async fetchUserProfile() {
      const tokenStore = useTokenStore();
      if (!tokenStore.isLoggedIn) return;

      try {
        const response = await http.get("/users/userInfo");
        this.user = response.data.data;
      } catch (error) {
        console.error("获取用户信息失败:", error);
        this.clearProfile();
        throw error;
      }
    },

    // 设置用户信息
    setUser(profile: UserProfile) {
      this.user = profile;
    },

    // 清除用户信息（登出时调用）
    clearProfile() {
      this.user = null;
    },
  },

  // 将 persist 配置移到正确的位置，作为 state 和 actions 的同级属性
  persist: {
    paths: ['user'], // (推荐) 只持久化 user 字段，避免其他临时状态被保存
  },
});

