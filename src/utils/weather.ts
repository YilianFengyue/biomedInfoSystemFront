// src/utils/weather.ts

import axios from 'axios';
import { getAddressFromCoordinates } from '@/utils/amap';

const AMapKey = import.meta.env.VITE_AMAP_WEATHER_KEY;
const baseURL = 'https://restapi.amap.com/v3/weather/weatherInfo';

/**
 * @description 获取指定城市或当前位置的天气信息
 * @param {string | null} [cityIdentifier=null] - 城市 adcode 或名称。为 null 时自动定位。
 * @returns {Promise<object>} 返回天气信息对象
 */
export const getCityWeather = async (cityIdentifier: string | null = null): Promise<any> => {
  let cityToQuery = cityIdentifier;

  // 如果没有传入城市标识，则尝试自动定位
  if (!cityToQuery) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { longitude, latitude } = position.coords;
      const addressInfo = await getAddressFromCoordinates(longitude, latitude);
      
      // 【关键修改】优先使用 adcode 进行查询
      cityToQuery = addressInfo.adcode;

    } catch (error) {
      console.error("自动定位失败:", error);
      return Promise.reject(new Error('无法获取您的地理位置，请允许定位或手动输入城市。'));
    }
  }

  if (!AMapKey) {
    return Promise.reject(new Error('请在 .env 文件中设置您的高德地图天气API Key (VITE_AMAP_WEATHER_KEY)。'));
  }
  
  // 使用获取到的城市标识（adcode 或手动输入的名称）进行天气查询
  const response = await axios.get(baseURL, {
    params: {
      key: AMapKey,
      city: cityToQuery,
      extensions: 'base'
    }
  });

  if (response.data.status === '1' && response.data.lives?.length > 0) {
    console.log(`成功获取城市 ${cityToQuery} 的天气数据:`, response.data.lives[0]);
    return response.data.lives[0];
  } else {
    const errorMsg = `获取"${cityToQuery}"的天气失败。错误信息: ${response.data.info}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};