import http from './http';
import type { User, UserProfile } from '@/types/type';

// 定义登录请求的数据结构
export interface LoginPayload {
  username: string;
  // 【关键修改】将字段名从 password 修改为 passwordHash
  // 这样可以精确匹配后端 Users 实体类的字段
  passwordHash?: string; 
}

// 定义注册请求的数据结构 (同样修改以保持一致性)
export interface RegisterPayload {
  username: string;
  passwordHash?: string;
}

/**
 * 登录 API
 * @param data - 包含用户名和后端期望的 passwordHash 字段的对象
 * @returns Promise
 */
export const loginApi = (data: LoginPayload) => {
  // 返回的数据结构中，外层是 Result 对象，里面的 data 字段才包含 token
  // 假设后端成功返回的 data 包含 { token: "..." } 或直接就是 token 字符串
  // 根据 UserContorller.java, data 直接是 token，所以泛型为 { token: string } 不完全准确，但为了方便，可以先这样写
  return http.post<any>('/users/login', data);
};

/**
 * 注册 API
 * @param data - 包含用户名和后端期望的 passwordHash 字段的对象
 * @returns Promise
 */
export const registerApi = (data: RegisterPayload) => {
  return http.post<any>('/users/register', data);
};

/**
 * 获取用户信息的 API (这是一个示例，您可以根据后端接口调整)
 * @returns Promise
 */
export const getProfileApi = () => {
  // 假设后端有一个 /user/profile 的接口
  return http.get<UserProfile>('/user/profile');
};

