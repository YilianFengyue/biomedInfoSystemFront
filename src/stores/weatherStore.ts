// src/stores/weatherStore.ts

import { defineStore } from 'pinia';
import { getCityWeather } from '@/utils/weather';

interface WeatherInfo {
  city: string;
  weather: string;
  temperature: string;
  // ... 其他你可能需要的天气字段
}

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    weatherInfo: null as WeatherInfo | null,
    lastFetchTimestamp: 0,
    isLoading: false,
  }),
  actions: {
    async fetchWeatherIfNeeded() {
      const now = Date.now();
      // 检查是否需要重新获取（数据为空或超过30分钟）
      if (!this.weatherInfo || now - this.lastFetchTimestamp > 30 * 60 * 1000) {
        this.isLoading = true;
        try {
          // 【关键】假设 getCityWeather 失败时会抛出异常
          const weatherData = await getCityWeather(null);
          this.weatherInfo = weatherData;
          this.lastFetchTimestamp = now;
        } catch (error) {
          console.error("在 store 中获取天气失败:", error);
          // 这里可以选择性地重置数据，或者保留旧数据
          // this.weatherInfo = null; 
        } finally {
          this.isLoading = false;
        }
      }
    },
  },
  // 开启持久化，这样刷新页面后天气信息也能立即显示
  persist: true,
});