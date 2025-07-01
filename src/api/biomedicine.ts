import http from './http'; // 确保 http 工具的路径正确

// 定义后端返回的药材地理分布数据的类型接口
export interface HerbDistribution {
  herbName: string;
  address: string;
  longitude: number;
  latitude: number;
  // 可以根据您后端API的实际返回字段进行调整
}

// 定义统一的API响应体结构，以便进行类型检查
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * @description 获取中药材地理分布数据
 * @returns {Promise<HerbDistribution[]>}
 */
export const getHerbDistribution = async (): Promise<HerbDistribution[]> => {
  try {
    // 【关键修复】: 移除了多余的 /api 前缀。
    // 因为 http 实例的 baseURL 已经配置为 '/api'，所以这里我们直接从 '/herb' 开始写。
    const response = await http.get<ApiResponse<HerbDistribution[]>>('/herb/map/herb-distribution');

    // http 的响应拦截器已经确保了 code 是成功的，所以这里可以简化逻辑
    // 直接返回业务数据 data 即可，如果 data 不存在则返回空数组
    return response.data.data || [];

  } catch (error) {
    console.error('Request Error: 请求药材分布数据时发生网络或未知错误', error);
    // 当请求失败时，返回一个空数组，防止页面因数据格式错误而崩溃
    return [];
  }
};
