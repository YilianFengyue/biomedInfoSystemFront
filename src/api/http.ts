import axios from 'axios';
import { useTokenStore } from '@/stores/tokenStore';
import { useSnackbarStore } from '@/stores/snackbarStore';
import router from '@/router';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// --- 请求拦截器 ---
http.interceptors.request.use(
  (config) => {
    const tokenStore = useTokenStore();
    const jwt = tokenStore.jwt;
    const csrf = tokenStore.csrf;

    // 1. 如果存在JWT，则添加到 Authorization 请求头
    if (jwt) {
      config.headers.Authorization = `Bearer ${jwt}`;
    }

    // 2. 【核心修复】如果存在CSRF Token，并且请求不是GET或HEAD等安全方法，则添加到 X-CSRF-TOKEN 请求头
    const method = config.method?.toUpperCase();
    if (csrf && method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      config.headers['X-CSRF-TOKEN'] = csrf;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 响应拦截器 ---
http.interceptors.response.use(
  (response) => {
    // 假设后端所有成功响应的业务码都在2xxxx范围内
    if (response.data.code >= 20000 && response.data.code < 30000) {
      return response;
    } else {
      // 对业务失败的情况（例如 code: 40001 "用户名已存在"）也进行统一处理
      const snackbarStore = useSnackbarStore();
      snackbarStore.showWarningMessage(response.data.msg || '操作失败');
      return Promise.reject(new Error(response.data.msg || 'Error'));
    }
  },
  (error) => {
    const snackbarStore = useSnackbarStore();
    
    if (error.response) {
      // 处理HTTP状态码层面的错误
      const status = error.response.status;
      const message = error.response.data.message || error.response.data.msg || '服务器发生未知错误';

      if (status === 401) {
        // 401: 未认证或Token失效
        snackbarStore.showErrorMessage('认证已过期，请重新登录。');
        useTokenStore().removeTokens();
        // 延迟跳转，给用户看消息的时间
        setTimeout(() => {
             router.push('/auth/signin');
        }, 1500);
      } else {
        // 其他HTTP错误（如403, 404, 500等）
        snackbarStore.showErrorMessage(`错误 ${status}: ${message}`);
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      snackbarStore.showErrorMessage('网络请求失败，请检查后端服务是否可用。');
    } else {
      // 设置请求时发生了一些事情，触发了一个错误
      snackbarStore.showErrorMessage('请求发送失败，请检查网络连接。');
    }
    
    return Promise.reject(error);
  }
);

export default http;
