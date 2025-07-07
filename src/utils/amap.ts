// src/utils/amap.ts

import AMapLoader from '@amap/amap-jsapi-loader';

const AMapKey = import.meta.env.VITE_AMAP_KEY;
const AMapSecurityCode = import.meta.env.VITE_AMAP_SECURITY_CODE;

if (!AMapKey) console.error('VITE_AMAP_KEY 未配置');
if (!AMapSecurityCode) console.error('VITE_AMAP_SECURITY_CODE 未配置');

(window as any)._AMapSecurityConfig = {
  securityJsCode: AMapSecurityCode,
};

// 【核心修改】创建一个立即执行的单例 Promise 来加载地图
const aMapLoaderInstance = new Promise<any>((resolve, reject) => {
  AMapLoader.load({
    key: AMapKey,
    version: "2.0",
    plugins: ['AMap.Geocoder', 'AMap.MarkerClusterer'], // 精简插件
  }).then(AMap => {
    console.log('高德地图 SDK 已成功加载并准备就绪。');
    // 将 AMap 挂载到 window，方便全局访问
    (window as any).AMap = AMap;
    resolve(AMap);
  }).catch(error => {
    console.error('高德地图加载失败:', error);
    reject(error);
  });
});

export default aMapLoaderInstance;

// 【保持不变】下面的辅助函数不需要修改
export const getAddressFromCoordinates = (longitude: number, latitude: number): Promise<{province: string, city: string, address: string, adcode: string}> => {
  return new Promise((resolve, reject) => {
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
            adcode: addressComponent.adcode,
          });
        } else {
          reject(new Error(`逆地理编码失败: ${ (result as any).info }`));
        }
      });
    }).catch(reject);
  });
};

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
