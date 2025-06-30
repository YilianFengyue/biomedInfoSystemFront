import { defineStore } from 'pinia';

// 定义存储在 localStorage 中的键名，方便管理
const JWT_KEY = 'jwt_token';
const CSRF_KEY = 'csrf_token';

export const useTokenStore = defineStore('token', {
  // 推荐使用 state 函数返回一个对象，这是 Pinia 的标准做法
  state: () => ({
    jwt: localStorage.getItem(JWT_KEY) || '',
    csrf: localStorage.getItem(CSRF_KEY) || '', // 新增 csrf token 状态
  }),

  getters: {
    isLoggedIn: (state) => !!state.jwt,
  },

  actions: {
    /**
     * 在登录成功后，同时设置 JWT 和 CSRF token
     * @param newJwt - 从后端获取的 JWT
     * @param newCsrf - 从后端获取的 CSRF token
     */
    setTokens(newJwt: string, newCsrf: string) {
      this.jwt = newJwt;
      this.csrf = newCsrf;
      localStorage.setItem(JWT_KEY, newJwt);
      localStorage.setItem(CSRF_KEY, newCsrf); // 将 CSRF token 也存入 localStorage
    },

    /**
     * 在登出或认证失败时，清除所有 token
     */
    removeTokens() {
      this.jwt = '';
      this.csrf = '';
      localStorage.removeItem(JWT_KEY);
      localStorage.removeItem(CSRF_KEY); // 同时移除 CSRF token
    },
  },
   // 开启持久化
  persist: true,
});
