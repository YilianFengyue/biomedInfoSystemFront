import http from './http';

/**
 * @description 调用百度AI植物识别接口
 * @param imageFile 需要识别的图片文件
 * @returns Promise
 */
export const recognizePlantApi = (imageFile: File) => {
  // 创建一个 FormData 对象来包装图片文件
  const formData = new FormData();
  formData.append('image', imageFile);

  // 发送 POST 请求，注意 headers 的 'Content-Type' 会被浏览器自动设置为 'multipart/form-data'
  // 这里的 '/plant/recognize' 对应 README 中的 '/api/plant/recognize'，因为 http 实例已配置 '/api' 基础路径
  return http.post('/plant/recognize', formData, {
    headers: {
      // 当使用 FormData 时，浏览器会自动设置正确的 Content-Type，
      // 所以我们不需要手动设置，甚至应该避免手动设置，以免覆盖浏览器自动生成的 boundary。
      'Content-Type': 'multipart/form-data',
    },
  });
};