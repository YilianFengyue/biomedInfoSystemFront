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
            {{ t('dataCenter.main') }}
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
                <div class="mt-2">{{ t('dataCenter.map_load') }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-card class="fill-height" elevation="4">
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >mdi-chart-pie</v-icon>
            {{ t('dataCenter.med_dis') }}
            <v-spacer></v-spacer>
            <v-menu open-on-hover location="bottom end">
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon variant="text" color="grey-lighten-1">
                        <v-icon>mdi-information-outline</v-icon>
                        <v-tooltip activator="parent" location="top">{{ t('dataCenter.view_look') }}</v-tooltip>
                    </v-btn>
                </template>
                <v-sheet class="pa-2" elevation="6" rounded="lg">
                    <v-list density="compact">
                        <v-list-item
                            v-for="(item) in provinceDistributionData"
                            :key="item.name"
                            class="px-2"
                            min-height="30px"
                        >
                            <v-list-item-title class="text-body-2">{{ item.name }}</v-list-item-title>
                            <template v-slot:append>
                                <v-chip size="x-small" label>{{ item.value }}</v-chip>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-sheet>
            </v-menu>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="d-flex align-center justify-center">
            <div ref="pieChartRef" style="width: 100%; height: 400px;">
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4 d-flex">
      <v-col
        cols="12"
        md="6"
      >
        <v-card height="100%" class="d-flex flex-column">
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >mdi-image-multiple</v-icon>
            {{ t('dataCenter.comparison') }}
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4 flex-grow-1">
            <p class="text-body-2 text-grey-darken-2 mb-4">
             {{ t('dataCenter.click_mark') }}
            </p>
            <v-row>
              <v-col cols="6">
                <v-card
                  variant="outlined"
                  class="comparison-image-card"
                  height="250"
                  min-height="250"
                  width="100%"
                  @click="clearImage(0)"
                >
                  <div class="image-wrapper">
                    <v-img
                      v-if="comparisonImages[0]"
                      :src="comparisonImages[0]"
                      contain
                      class="comparison-image"
                    >
                      <template v-slot:placeholder>
                        <div class="placeholder">
                          <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                        </div>
                      </template>
                    </v-img>
                    <div v-else class="placeholder">
                      <span class="text-grey">{{ t('dataCenter.click_lmark') }}</span>
                    </div>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card
                  variant="outlined"
                  class="comparison-image-card"
                  height="250"
                  min-height="250"
                  width="100%"
                  @click="clearImage(1)"
                >
                  <div class="image-wrapper">
                    <v-img
                      v-if="comparisonImages[1]"
                      :src="comparisonImages[1]"
                      contain
                      class="comparison-image"
                    >
                      <template v-slot:placeholder>
                        <div class="placeholder">
                          <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                        </div>
                      </template>
                    </v-img>
                    <div v-else class="placeholder">
                      <span class="text-grey">{{ t('dataCenter.click_rmark') }}</span>
                    </div>
                  </div>
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
        <v-card height="100%" class="d-flex flex-column">
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-2"
              color="primary"
            >mdi-source-branch</v-icon>
            {{ t('dataCenter.data_ma') }}
             <v-spacer></v-spacer>
             <v-text-field
                v-model="historySearchQuery"
                density="compact"
                variant="outlined"
                :label="t('dataCenter.search')"
                prepend-inner-icon="mdi-magnify"
                single-line
                hide-details
                clearable
                style="max-width: 280px;"
            ></v-text-field>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4 flex-grow-1" style="max-height: 300px; overflow-y: auto;">
            <div v-if="isHistoryLoading" class="text-center py-10">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <v-timeline v-else-if="filteredDataHistory.length > 0" side="end" density="compact">
                <v-timeline-item
                    v-for="item in filteredDataHistory"
                    :key="item.id"
                    :dot-color="getHistoryActionColor(item.action)"
                    size="small"
                >
                    <div class="mb-2">
                        <div class="font-weight-bold text-primary">{{ item.herbName }}</div>
                        <div class="text-caption text-grey-darken-1">
                            <v-icon size="x-small">mdi-map-marker-outline</v-icon>
                            {{ item.address }}
                        </div>
                    </div>
                    <div class="d-flex justify-space-between">
                        <strong class="me-4 text-no-wrap">{{ formatHistoryTimestamp(item.changedAt) }}</strong>
                        <div>
                            <div class="font-weight-bold">{{ item.metricName }}</div>
                            <div class="text-caption">
                                操作人: {{ item.changedBy }}
                            </div>
                        </div>
                        <v-spacer></v-spacer>
                        <div class="text-right">
                           <v-chip size="small" :color="getHistoryActionColor(item.action)" label>{{ item.action }}</v-chip>
                           <div v-if="item.oldValue != null" class="text-caption text-grey">
                                {{ item.oldValue }} -> {{ item.newValue }}
                           </div>
                           <div v-else class="text-caption text-green">
                                {{ item.newValue }}
                           </div>
                        </div>
                    </div>
                </v-timeline-item>
            </v-timeline>
             <div v-else class="text-center text-grey-darken-1 pa-10">
                {{ t('dataCenter.history') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, type Ref, nextTick } from "vue";
import { useTheme } from 'vuetify';
import aMapLoaderInstance from "@/utils/amap";
import { getCityWeather } from "@/utils/weather";
import { getHerbDistribution, type HerbDistribution } from "@/api/biomedicine";
import axios from 'axios';
import { Icon } from "@iconify/vue";

import { useChart, RenderType, ThemeType } from "@/plugins/echarts";
import type { EChartsOption } from "echarts";

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

interface HistoryItem {
  id: number;
  changedAt: string;
  metricName: string;
  action: string;
  changedBy: string;
  oldValue: string | null;
  newValue: string;
  herbName: string;
  address: string;
  remark?: string;
}

let map: any = null;
const mapContainerRef = ref<HTMLElement | null>(null);
const isMapLoading = ref(true);
const weatherInfo = ref<any>(null);
const comparisonImages = ref<(string | null)[]>([null, null]);

const pieChartRef = ref<HTMLDivElement | null>(null);
const provinceDistributionData = ref<{ name: string; value: number }[]>([]);
const { current: currentTheme } = useTheme();

const allDataHistory = ref<HistoryItem[]>([]);
const isHistoryLoading = ref(false);
const historySearchQuery = ref('');

const fetchImagesForLocation = async (locationId: number) => {
  try {
    const response = await axios.get(`/api/herb/locations/${locationId}/images`);
    if (response.data.code === 20000 && response.data.data.length > 0) {
      const imageUrl = response.data.data[0].url;
      const emptyIndex = comparisonImages.value.findIndex(img => img === null);
      if (emptyIndex !== -1) {
        comparisonImages.value[emptyIndex] = imageUrl;
      } else {
        comparisonImages.value[0] = imageUrl;
      }
    }
  } catch (error) {
    console.error(`获取观测点 ${locationId} 的图片失败:`, error);
  }
};

const clearImage = (index: number) => {
    comparisonImages.value[index] = null;
}

const fetchAllDataHistory = async () => {
    isHistoryLoading.value = true;
    allDataHistory.value = [];
    try {
        const response = await axios.get(`/api/herb/history/all`);
        if (response.data.code === 20000) {
            allDataHistory.value = response.data.data;
        }
    } catch (error) {
        console.error("获取所有数据历史失败:", error);
    } finally {
        isHistoryLoading.value = false;
    }
}
const filteredDataHistory = computed(() => {
    if (!historySearchQuery.value) {
        return allDataHistory.value;
    }
    const query = historySearchQuery.value.toLowerCase();
    return allDataHistory.value.filter(item =>
        (item.metricName && item.metricName.toLowerCase().includes(query)) ||
        (item.changedBy && item.changedBy.toLowerCase().includes(query)) ||
        (item.herbName && item.herbName.toLowerCase().includes(query)) ||
        (item.address && item.address.toLowerCase().includes(query)) ||
        (item.remark && item.remark.toLowerCase().includes(query))
    );
});

const formatHistoryTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
const getHistoryActionColor = (action: string) => {
    if (action.toUpperCase() === 'UPDATE') return 'orange';
    if (action.toUpperCase() === 'CREATE') return 'success';
    return 'grey';
}

const calculateProvinceDistribution = (data: HerbDistribution[]) => {
  if (!data || data.length === 0) {
    provinceDistributionData.value = [];
    return;
  }

  const provinceCounts = data.reduce((acc, herb) => {
    const province = herb.province || '未知省份';
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  provinceDistributionData.value = Object.entries(provinceCounts).map(([name, value]) => ({
    name,
    value,
  }));
};



// 新增：用于对数转换数据的计算属性
const logTransformedData = computed(() => {
  return provinceDistributionData.value.map(item => {
    // 使用 Math.log10 进行对数转换。+1是为了避免当 item.value 为1时，log(1)为0导致图形消失
    const logValue = item.value > 0 ? Math.log10(item.value) + 1 : 0;
    return {
      name: item.name,
      value: logValue, // 用于驱动图表半径的值
      originalValue: item.value, // 保存原始值，用于Tooltip显示
    };
  });
});



// --- 图表样式修改 ---
const chartOption = computed<EChartsOption>(() => {
    // 动态计算 visualMap 的最大值 (基于转换后的数据)
    const maxVal = Math.max(...logTransformedData.value.map(item => item.value), 0);

    return {
        backgroundColor: '#f5f5f5',

        // 新增：在这里定义颜色列表
        color: [
            '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
            '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
        ],


        tooltip: {
            trigger: 'item',
            // 核心修改：自定义 formatter 来显示原始数据
            formatter: (params: any) => {
                // 从 params.data 中获取我们之前保存的 originalValue
                const originalValue = params.data.originalValue;
                const name = params.name;
                const seriesName = params.seriesName;
                const percent = params.percent;
                // 返回自定义的 HTML 字符串
                return `${seriesName}<br/>${name}: <strong>${originalValue}</strong> (${percent}%)`;
            },
            // 新增：将 tooltip 限制在图表容器内，防止显示不全
            confine: true, 
        },
        /*visualMap: {
            show: false,
            min: 0,
            max: maxVal * 1.2,
            inRange: {
                colorLightness: [0.3, 0.8],
            },
        },*/
        series: [
            {
                name: '地域分布',
                type: 'pie',
                radius: ['20%', '75%'],
                center: ['50%', '50%'],
                // 核心修改：使用对数转换后的数据
                data: logTransformedData.value, 
                roseType: 'radius',
                label: {
                    show: false
                },
                labelLine: {
                    show: false
                },
                itemStyle: {
                  //使用多颜色循环
                    //color: '#4CAF50',
                    shadowBlur: 200,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: function () {
                    return Math.random() * 200;
                },
            },
        ],
    }
});


// --- 图表实现修改 ---
const { setOption, showLoading } = useChart(
    pieChartRef as Ref<HTMLDivElement>,
    true, // auto-resize
    false, // isMock
    RenderType.SVGRenderer,
    ThemeType.Dark // 使用暗色主题
);


const initMapAndMarkers = async (AMap: any) => {
  if (!mapContainerRef.value) return;
  map = new AMap.Map(mapContainerRef.value, {
    zoom: 5,
    center: [104.06, 30.67],
  });

  const herbData = await getHerbDistribution();
  map.clearMap();

  if (herbData.length === 0) {
    isMapLoading.value = false;
    return;
  }

  calculateProvinceDistribution(herbData);

  herbData.forEach((herb: any) => {
    const marker = new AMap.Marker({
      position: new AMap.LngLat(herb.longitude, herb.latitude),
      title: herb.herbName,
      extData: { locationId: herb.locationId },
      map: map,
    });

    marker.on("click", (e: any) => {
      const locationId = e.target.getExtData().locationId;
      fetchImagesForLocation(locationId);

      const infoWindow = new AMap.InfoWindow({
        content: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px;">
            <h3 style="font-weight: 600; color: #333; margin: 0 0 8px;">${herb.herbName}</h3>
            <p style="margin: 0; color: #666;"><strong>分布地点:</strong> ${herb.address}</p>
          </div>`,
        offset: new AMap.Pixel(0, -30),
      });
      infoWindow.open(map, marker.getPosition());
    });
  });

  map.setFitView();
  isMapLoading.value = false;
};

const fetchWeatherForCity = async (city: string) => {
  try {
    weatherInfo.value = await getCityWeather(city);
  } catch (error) {
    console.error("获取天气失败:", error);
  }
};

onMounted(() => {
  aMapLoaderInstance
    .then(AMap => {
        nextTick(() => {
            initMapAndMarkers(AMap);
        });
    })
    .catch(e => {
      console.error("高德地图脚本加载失败:", e);
      isMapLoading.value = false;
    });

  fetchWeatherForCity("成都");
  fetchAllDataHistory();

  nextTick(() => {
      showLoading();
  });

  watch(provinceDistributionData, (newData) => {
      if(newData) { // 即使是空数组也应该更新图表以清除旧数据
          setOption(chartOption.value);
      }
  }, { deep: true, immediate: true });

  // Vuetify 的 useTheme 无法直接影响 ECharts 的主题，
  // ECharts 主题在 useChart 初始化时已固定。
  // 如果需要动态切换，需要更复杂的处理（销毁并重新初始化图表）。
  // 此处的 watch 仅用于在主题切换时可能需要的重绘。
  watch(currentTheme, () => {
      // 这里的 setOption 会使用上面 chartOption 中定义的暗色主题样式
      setOption(chartOption.value);
  });
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
.comparison-image-card {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}
.comparison-image-card:hover {
    box-shadow: 0 0 0 2px var(--v-theme-primary);
    transform: scale(1.02);
}
.legend-sheet {
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
}
.v-theme--dark .legend-sheet {
    background-color: rgba(30, 30, 30, 0.95);
}
.text-no-wrap {
    white-space: nowrap;
}

.comparison-image-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  padding: 0; /* 移除内边距，确保内容撑满 */
}

.image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.02); /* 可选：添加轻微背景色 */
}

.comparison-image-card:hover {
  box-shadow: 0 0 0 2px var(--v-theme-primary);
  transform: scale(1.02);
}
</style>