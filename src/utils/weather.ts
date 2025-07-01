// src/utils/weather.js

import axios from 'axios';

// 请将 'YOUR_AMAP_KEY' 替换为您自己的高德地图API Key
const AMapKey = 'e75c62d828b47acf15a5557901713459'; 
const baseURL = 'https://restapi.amap.com/v3/weather/weatherInfo';

/**
 * @description 获取指定城市的天气信息
 * @param {string} cityIdentifier - 需要查询的城市的 adcode 或名称
 * @returns {Promise<object>} 返回一个 Promise，成功时解析为天气信息对象
 */
export const getCityWeather = (cityIdentifier) => {
  return new Promise((resolve, reject) => {
    if (!AMapKey) {
      return reject(new Error('请在 src/utils/weather.js 文件中设置您的高德地图API Key。'));
    }
    
    axios.get(baseURL, {
      params: {
        key: AMapKey,
        city: cityIdentifier,
        extensions: 'base' // 获取实时天气
      }
    })
    .then(response => {
      if (response.data.status === '1' && response.data.lives && response.data.lives.length > 0) {
        console.log(`成功获取城市 ${cityIdentifier} 的天气数据:`, response.data.lives[0]);
        resolve(response.data.lives[0]); // Promise 成功，并返回天气数据
      } else {
        // --- START: 优化的错误处理逻辑 ---
        let errorMsg;
        if (response.data.status === '1' && (!response.data.lives || response.data.lives.length === 0)) {
            // 请求成功，但没有返回天气数据
            errorMsg = `无法获取"${cityIdentifier}"的天气。请尝试输入城市名(如“泉州”)而非区县名，或使用城市的adcode。`;
        } else {
            // API返回了其他错误信息
            errorMsg = `获取天气失败: ${response.data.info}`;
        }
        console.error(errorMsg);
        reject(new Error(errorMsg)); // Promise 失败
        // --- END: 优化的错误处理逻辑 ---
      }
    })
    .catch(error => {
      console.error('天气API请求失败:', error);
      reject(error); // 网络层面的错误
    });
  });
};