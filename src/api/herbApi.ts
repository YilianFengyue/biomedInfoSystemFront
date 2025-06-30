import http from './http';
import axios from 'axios';

// --- 类型定义，与新的DTO完全对应 ---

// 药材对象的基本结构
export interface Herb {
  id: number;
  name: string;
  scientificName?: string;
}

// 分页查询药材的返回结构
export interface PaginatedHerbs {
  records: Herb[];
  // ... 其他分页字段
}

// 第一步：创建观测点时，需要发送的数据 (对应 LocationCreateDto)
export interface LocationCreatePayload {
  herbId: number | null;
  longitude: number | null;
  latitude: number | null;
  province: string;
  city: string;
  address: string;
  observationYear: number;
  description?: string;
}

// 后端成功创建观测点后，返回的对象
export interface HerbLocation {
  id: number; // 这是关键的 locationId
  herbId: number;
  // ... 其他字段
}

// 第二步：批量关联图片时，单张图片的数据结构
export interface ImageInfo {
  url: string;
  Primary: boolean;
  description?: string;
}

// 第二步：批量关联图片的请求体 (对应 ImageBatchUploadDto)
export interface ImageBatchUploadPayload {
  images: ImageInfo[];
}

// OSS上传凭证的结构
export interface OssPolicy {
  accessid: string;
  policy: string;
  signature: string;
  dir: string;
  host: string;
  expire: string;
}

// 在文件顶部或其他类型定义区域，新增 HerbCreatePayload 类型
export interface HerbCreatePayload {
  name: string;
  scientificName?: string;
  familyName?: string;
  resourceType: string;
  lifeForm?: string;
  description?: string;
}

// --- API 函数 ---

/**
 * [辅助] 用于搜索药材，让用户选择
 */
export const searchHerbsApi = (params: { name?: string }) => {
  return http.get<{ data: PaginatedHerbs }>('/herb/herbs', { params });
};

/**
 * 获取OSS上传策略
 */
export const getOSSPolicyApi = () => {
  return http.get<{ data: OssPolicy }>('/oss/policy');
};

/**
 * [新流程] 第一步：创建观测点
 */
export const createLocationApi = (data: LocationCreatePayload) => {
  return http.post<{ data: HerbLocation }>('/herb/locations', data);
};

/**
 * [新流程] 第二步：为观测点批量上传图片
 */
export const uploadImagesForLocationApi = (locationId: number, data: ImageBatchUploadPayload) => {
  return http.post(`/herb/locations/${locationId}/images`, data);
};

/**
 * 上传单个文件到阿里云OSS (此函数保持不变)
 */
export const uploadFileToOSS = async (file: File, policyData: OssPolicy): Promise<string> => {
    const formData = new FormData();
    const objectKey = `${policyData.dir}${Date.now()}_${file.name}`;
    formData.append('key', objectKey);
    formData.append('policy', policyData.policy);
    formData.append('OSSAccessKeyId', policyData.accessid);
    formData.append('success_action_status', '200');
    formData.append('signature', policyData.signature);
    formData.append('file', file);
    // 使用原生fetch确保兼容性
    const response = await fetch(policyData.host, { method: 'POST', body: formData });
    if (!response.ok) {
        throw new Error(`文件上传到OSS失败，状态码: ${response.status}`);
    }
    return `${policyData.host}/${objectKey}`;
};

/**
 * [新增] 创建一个新的药材条目
 */
export const createHerbApi = (data: HerbCreatePayload) => {
    return http.post<{ data: Herb }>('/herb/herbs', data);
};