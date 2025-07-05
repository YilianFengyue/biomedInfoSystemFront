// src/utils/weather.js

import axios from 'axios';
// 确保引入了你的 amap.ts 中的 getAddressFromCoordinates 函数
import { getAddressFromCoordinates } from '@/utils/amap';

// 请将 'YOUR_AMAP_KEY' 替换为您自己的高德地图API Key
const AMapKey = import.meta.env.VITE_AMAP_WEATHER_KEY; 
const baseURL = 'https://restapi.amap.com/v3/weather/weatherInfo';

/**
 * @description 获取指定城市或当前位置的天气信息
 * @param {string | null} [cityIdentifier=null] - 可选。需要查询的城市的 adcode 或名称。如果为 null，则尝试自动定位。
 * @returns {Promise<object>} 返回一个 Promise，成功时解析为天气信息对象
 */
export const getCityWeather = async (cityIdentifier: string | null = null): Promise<any> => {
  let cityToQuery = cityIdentifier;

  // 如果没有传入城市，则尝试自动获取
  if (!cityToQuery) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { longitude, latitude } = position.coords;
      const addressInfo = await getAddressFromCoordinates(longitude, latitude);
      
      // 高德逆地理编码返回的 city 可能是空的（直辖市），此时使用 province
      cityToQuery = addressInfo.city && typeof addressInfo.city === 'string' ? addressInfo.city : addressInfo.province;

    } catch (error) {
      console.error("自动定位失败:", error);
      // 定位失败时，可以设置一个默认城市或直接报错
      return Promise.reject(new Error('无法获取您的地理位置，请允许定位或手动输入城市。'));
    }
  }

  if (!AMapKey) {
    return Promise.reject(new Error('请在 src/utils/weather.js 文件中设置您的高德地图API Key。'));
  }
  
  // 使用获取到的城市进行天气查询
  const response = await axios.get(baseURL, {
    params: {
      key: AMapKey,
      city: cityToQuery,
      extensions: 'base'
    }
  });

  if (response.data.status === '1' && response.data.lives && response.data.lives.length > 0) {
    console.log(`成功获取城市 ${cityToQuery} 的天气数据:`, response.data.lives[0]);
    return response.data.lives[0];
  } else {
    let errorMsg = `获取"${cityToQuery}"的天气失败。`;
    if (response.data.infocode === "10000" && (!response.data.lives || response.data.lives.length === 0)) {
        errorMsg += ` 请尝试输入城市名(如“泉州”)而非区县名，或使用城市的adcode。`;
    } else {
        errorMsg += ` 错误信息: ${response.data.info}`;
    }
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};