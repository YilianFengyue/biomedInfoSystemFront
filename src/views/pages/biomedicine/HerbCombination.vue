<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'vue-chartjs';

// 注册Chart.js的所有组件
Chart.register(...registerables);

// --- 类型定义 ---
interface HerbCombination {
  herbName: string;
  combinationCount: number;
  combinationRatio: number;
}

// --- 组件状态 ---
const searchHerb = ref<string>('红花'); // 默认分析“红花”，便于演示
const analysisResult = ref<HerbCombination[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// --- Chart.js 数据和选项 ---
const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: '配伍次数',
      backgroundColor: '#42A5F5',
      borderColor: '#1E88E5',
      borderWidth: 1,
      data: [] as number[],
    },
  ],
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const, // 设置为水平条形图
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: '配伍药材',
      font: {
        size: 16,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `配伍次数: ${context.raw}`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: true,
        text: '次数',
      },
    },
  },
});

// --- 方法 ---
const performAnalysis = async () => {
  if (!searchHerb.value) {
    error.value = '请输入要分析的药材名称。';
    analysisResult.value = [];
    return;
  }

  loading.value = true;
  error.value = null;
  analysisResult.value = [];

  try {
    const response = await axios.get('/api/formula/analysis/herb-combinations', {
      params: { herbName: searchHerb.value },
    });

    if (response.data && response.data.code === 20000) {
      const results = response.data.data as HerbCombination[];
      analysisResult.value = results;

      if (results.length === 0) {
        error.value = `未找到关于“${searchHerb.value}”的配伍数据。`;
        chartData.value.labels = [];
        chartData.value.datasets[0].data = [];
      } else {
        // 更新图表数据
        const top10 = results.slice(0, 10).reverse(); // .reverse() for horizontal bar chart
        chartData.value.labels = top10.map(item => item.herbName);
        chartData.value.datasets[0].data = top10.map(item => item.combinationCount);
        chartOptions.value.plugins.title.text = `“${searchHerb.value}” 配伍药材`;
      }
    } else {
      throw new Error(response.data.msg || '获取分析数据失败');
    }
  } catch (err: any) {
    console.error('药材配伍分析请求出错:', err);
    error.value = err.message || '网络请求失败，请检查后端服务是否可用。';
  } finally {
    loading.value = false;
  }
};

</script>

<template>
  <v-container class="py-8 px-6" fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="9">
        <div class="text-center mb-8">
          <v-icon size="48" color="primary" class="mb-4">mdi-vector-combine</v-icon>
          <h1 class="text-h4 font-weight-bold">药材配伍规律分析</h1>
          <p class="text-h6 text-grey-darken-1 font-weight-regular mt-2">
            探索中药方剂中药材之间的关联与配伍规律
          </p>
        </div>

        <v-card class="pa-4 pa-md-6 mb-8" elevation="5" rounded="xl">
          <v-card-title class="text-h6 font-weight-medium mb-4">
            输入核心药材进行分析
          </v-card-title>
          <v-text-field
            v-model="searchHerb"
            label="例如：红花、甘草、当归..."
            variant="outlined"
            clearable
            prepend-inner-icon="mdi-leaf"
            @keydown.enter="performAnalysis"
          ></v-text-field>
          <v-card-actions class="mt-4">
            <v-spacer></v-spacer>
            <v-btn
              :loading="loading"
              color="primary"
              variant="flat"
              size="x-large"
              @click="performAnalysis"
              block
            >
              开始分析
              <v-icon right>mdi-chart-gantt</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>

        <div v-if="loading" class="text-center mt-12">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1">正在分析配伍数据，请稍候...</p>
        </div>

        <v-alert
          v-if="error"
          type="info"
          :text="error"
          variant="tonal"
          class="mb-6"
          border="start"
        ></v-alert>

        <v-row v-if="analysisResult.length > 0" :dense="true">
          <v-col cols="12" md="5">
            <v-card variant="outlined" rounded="lg" class="fill-height">
              <v-card-text>
                <div style="height: 400px;">
                  <Bar :data="chartData" :options="chartOptions" />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="7">
            <v-card variant="outlined" rounded="lg">
              <v-table class="comparison-table">
                <thead>
                  <tr>
                    <th class="text-left font-weight-bold">配伍药材</th>
                    <th class="text-center font-weight-bold">配伍次数</th>
                    <th class="text-center font-weight-bold">配伍比例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in analysisResult" :key="item.herbName">
                    <td>{{ item.herbName }}</td>
                    <td class="text-center">{{ item.combinationCount }}</td>
                    <td class="text-center">{{ (item.combinationRatio * 100).toFixed(0) }}%</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-container {
  background-color: #f9f9f9;
}
.comparison-table th,
.comparison-table td {
  padding: 12px 16px !important;
}
.comparison-table tbody tr:hover {
  background-color: #e3f2fd;
}
</style>