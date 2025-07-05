import AMapLoader from '@amap/amap-jsapi-loader';

// --- 配置 (使用您已有的配置) ---
const AMapKey = import.meta.env.VITE_AMAP_KEY; // 您的API Key
const AMapSecurityCode = import.meta.env.VITE_AMAP_SECURITY_CODE; // 您的安全密钥

// 在window上设置安全密钥
(window as any)._AMapSecurityConfig = {
  securityJsCode: AMapSecurityCode,
};

// 调用 AMapLoader.load 并将返回的 Promise 存储起来
const aMapLoaderInstance = AMapLoader.load({
  key: AMapKey,
  version: "2.0",
  // 确认 Geocoder 插件已被加载
  plugins: ['AMap.Geocoder', 'AMap.AutoComplete', 'AMap.PlaceSearch'],
});

export default aMapLoaderInstance;

/**
 * @description 【新增】根据经纬度坐标获取详细地址信息 (逆地理编码)
 * @param {number} longitude - 经度
 * @param {number} latitude - 纬度
 * @returns {Promise<{province: string, city: string, address: string}>} 返回包含地址信息的对象
 */
export const getAddressFromCoordinates = (longitude: number, latitude: number) => {
  return new Promise<{province: string, city: string, address: string}>((resolve, reject) => {
    aMapLoaderInstance.then((AMap) => {
      const geocoder = new AMap.Geocoder();
      const lnglat: [number, number] = [longitude, latitude];

      geocoder.getAddress(lnglat, (status, result) => {
        if (status === 'complete' && result.info === 'OK' && (result as any).regeocode) {
          const { addressComponent, formattedAddress } = (result as any).regeocode;
          resolve({
            province: addressComponent.province,
            city: Array.isArray(addressComponent.city) || !addressComponent.city ? addressComponent.province : addressComponent.city,
            address: formattedAddress,
          });
        } else {
          reject(new Error(`逆地理编码失败: ${ (result as any).info }`));
        }
      });
    }).catch(reject);
  });
};

/**
 * @description 将文字地址转换为经纬度坐标 (您已有的函数，保持不变)
 * @param {string} address - 需要转换的详细地址文字
 * @returns {Promise<any>}
 */
export const geocodeAddress = (address: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        aMapLoaderInstance.then((AMap) => {
            const geocoder = new AMap.Geocoder();
            geocoder.getLocation(address, (status, result) => {
                if (status === 'complete' && result.info === 'OK' && result.geocodes.length) {
                    resolve(result.geocodes[0].location);
                } else {
                    reject(new Error(`地址'${address}'转换失败`));
                }
            });
        }).catch(reject);
    });
};
