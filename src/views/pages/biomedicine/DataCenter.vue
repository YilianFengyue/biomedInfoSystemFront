<template>
  <v-container
    fluid
    class="pa-4"
  >
    <v-row>
      <v-col
        cols="12"
        md="8"
      >
        <v-card class="fill-height">
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >mdi-map-marker-radius</v-icon>
            中药材地理分布网络地图
            <v-spacer></v-spacer>
            <v-chip
              v-if="weatherInfo"
              color="blue"
              variant="tonal"
              label
              size="small"
            >
              <v-icon start>mdi-weather-partly-cloudy</v-icon>
              {{ weatherInfo.city }}: {{ weatherInfo.weather }} {{ weatherInfo.temperature }}°C
            </v-chip>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-0">
            <div
              ref="mapContainerRef"
              class="map-container"
            >
              <div
                v-if="isMapLoading"
                class="loading-overlay"
              >
                <v-progress-circular
                  indeterminate
                  color="primary"
                ></v-progress-circular>
                <div class="mt-2">地图加载中...</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-card class="fill-height">
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >mdi-chart-bar</v-icon>
            药材数据对比分析
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <p class="text-center text-grey-darken-1 pa-5">
              （图表组件区域，可使用 ECharts 或 Vuetify 自带组件实现）
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col
        cols="12"
        md="6"
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >mdi-image-multiple</v-icon>
            图谱比对
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4">
            <p class="text-body-2 text-grey-darken-2 mb-4">
             选择两张药材图片进行并排展示，方便人工对比。
            </p>
            <v-row>
              <v-col cols="6">
                <v-card
                  variant="outlined"
                  class="d-flex align-center justify-center fill-height"
                  min-height="200"
                >
                  <span class="text-grey">左侧图片</span>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card
                  variant="outlined"
                  class="d-flex align-center justify-center fill-height"
                  min-height="200"
                >
                  <span class="text-grey">右侧图片</span>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >mdi-source-branch</v-icon>
            数据溯源管理
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4">
            <p class="text-body-2 text-grey-darken-2 mb-4">
             追踪关键数据的来源和变更历史，确保数据的可追溯性。
            </p>
            <div class="text-center text-grey-darken-1 pa-10">
             （此功能需要后端支持历史记录表）
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import aMapLoaderInstance, { geocodeAddress } from "@/utils/amap";
import { getCityWeather } from "@/utils/weather";
// --- 从 /api 目录导入请求函数 ---
import { getHerbDistribution, type HerbDistribution } from "@/api/biomedicine";

let map: any = null;
const mapContainerRef = ref<HTMLElement | null>(null);
const isMapLoading = ref(true);
const weatherInfo = ref<any>(null);

// 地图初始化和标记添加
const initMapAndMarkers = async (AMap: any) => {
  if (mapContainerRef.value) {
    map = new AMap.Map(mapContainerRef.value, {
      zoom: 5,
      center: [104.06, 30.67], // 设置中心点为成都
    });

    // --- 需求三：调用API获取药材位置并替换 ---
    const herbData = await getHerbDistribution();
    console.log(herbData);
    // 清除旧的标记点（如果需要）
    map.clearMap();

    if (herbData.length === 0) {
      console.warn("未获取到药材分布数据，地图上将不显示任何标记。");
      isMapLoading.value = false;
      return;
    }

    // 根据获取到的数据创建标记点
    herbData.forEach((herb) => {
      const marker = new AMap.Marker({
        position: new AMap.LngLat(herb.longitude, herb.latitude),
        title: herb.herbName,
        map: map,
      });

      // 为每个标记点绑定点击事件，显示信息窗体
      marker.on("click", () => {
        const infoWindow = new AMap.InfoWindow({
          content: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px;">
            <h3 style="font-weight: 600; color: #333; margin: 0 0 8px;">${herb.herbName}</h3>
            <p style="margin: 0; color: #666;"><strong>分布地点:</strong> ${herb.address}</p>
          </div>
        `,
          offset: new AMap.Pixel(0, -30),
        });
        infoWindow.open(map, marker.getPosition());
      });
    });

    // 自动调整地图视野，使其包含所有点
    map.setFitView();

    isMapLoading.value = false;
  }
};

// 获取天气信息
const fetchWeatherForCity = async (city: string) => {
  try {
    weatherInfo.value = await getCityWeather(city);
  } catch (error) {
    console.error("获取天气失败:", error);
  }
};

onMounted(() => {
  aMapLoaderInstance
    .then((AMap) => {
      initMapAndMarkers(AMap);
    })
    .catch((e) => {
      console.error("高德地图脚本加载失败:", e);
      isMapLoading.value = false;
    });

  // 默认加载一个城市的天气，例如“北京”
  fetchWeatherForCity("成都");
});

onUnmounted(() => {
  if (map) {
    map.destroy();
  }
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 60vh;
  position: relative;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}
</style>