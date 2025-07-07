<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'vue-chartjs';
import { debounce } from 'lodash-es';
import { Icon } from "@iconify/vue";

// 注册Chart.js的所有组件
Chart.register(...registerables);

// --- 类型定义 ---
interface Formula {
  id: number;
  name: string;
  alias: string | null;
  source: string;
  dynasty: string;
  author: string;
  composition: string;
  preparation: string;
  usage: string;
  dosageForm: string;
  functionEffect: string;
  mainTreatment: string;
}

interface PaginatedFormulas {
  records: Formula[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

interface FormulaRecommendVO {
  formulaId: number;
  formulaName: string;
  score: number;
  recommendation: string;
  details?: Formula;
  loadingDetails?: boolean;
}

interface ComparisonData {
  formulas: Formula[];
  comparisonPoints: Record<string, string[]>;
}

interface HerbCombination {
  herbName: string;
  combinationCount: number;
  combinationRatio: number;
}

// --- 页面状态管理 ---
const activeTab = ref('search');
const tabs = [
  { value: 'search', title: '方剂检索', icon: 'mdi-magnify' },
  { value: 'recommend', title: '智能推荐', 
    icon: {
      component: Icon,
      props: {
        icon: 'stash:thumb-up-light'
      }
    }
  },
  { value: 'compare', title: '方剂对比', icon: 'mdi-compare-horizontal' },
  { value: 'analysis', title: '配伍分析', icon: 'mdi-vector-combine' }
];

// --- 方剂检索状态 ---
const formulaList = ref<Formula[]>([]);
const totalItems = ref(0);
const searchLoading = ref(true);
const searchOptions = ref({
  page: 1,
  itemsPerPage: 8,
});
const searchParams = ref({
  keyword: '',
  source: '',
});

// --- 智能推荐状态 ---
const symptoms = ref<string[]>(['头痛', '恶寒']);
const recommendations = ref<FormulaRecommendVO[]>([]);
const recommendLoading = ref(false);
const recommendError = ref<string | null>(null);

// --- 方剂对比状态 ---
const allFormulas = ref<{ id: number; name: string }[]>([]);
const selectedFormulaIds = ref<number[]>([]);
const comparisonData = ref<ComparisonData | null>(null);
const compareLoading = ref(false);
const compareError = ref<string | null>(null);

// --- 配伍分析状态 ---
const searchHerb = ref<string>('红花');
const analysisResult = ref<HerbCombination[]>([]);
const analysisLoading = ref(false);
const analysisError = ref<string | null>(null);

// --- 常见症状 ---
const commonSymptoms = [
  '头痛', '发热', '恶寒', '咳嗽', '咽痛', '无汗',
  '胸痛', '心悸', '失眠', '急躁易怒', '食少', '便溏',
  '腹痛', '腹泻', '便秘', '恶心', '呕吐', '口干'
];

// --- 表格配置 ---
const headers = [
  { title: '方剂名称', key: 'name', align: 'start', sortable: false, width: '20%' },
  { title: '出处', key: 'source', align: 'start', sortable: false, width: '20%' },
  { title: '功用', key: 'functionEffect', align: 'start', sortable: false, width: '25%' },
  { title: '主治', key: 'mainTreatment', align: 'start', sortable: false, width: '35%' }
];

// --- Chart.js 配置 ---
const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: '配伍次数',
      backgroundColor: 'rgba(63, 81, 181, 0.8)',
      borderColor: 'rgba(63, 81, 181, 1)',
      borderWidth: 2,
      borderRadius: 8,
      data: [] as number[],
    },
  ],
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    title: { 
      display: true, 
      text: 'Top 10 配伍药材', 
      font: { size: 16, weight: 'bold' },
      color: '#3F51B5',
      padding: 20
    },
  },
  scales: { 
    x: { 
      beginAtZero: true, 
      title: { display: true, text: '配伍次数', font: { weight: 'bold' } },
      grid: { color: 'rgba(0,0,0,0.1)' }
    },
    y: {
      grid: { display: false }
    }
  },
});

// --- API 调用方法 ---

// 方剂检索
const fetchFormulas = async () => {
  searchLoading.value = true;
  try {
    const params = { page: searchOptions.value.page, size: searchOptions.value.itemsPerPage, keyword: searchParams.value.keyword, source: searchParams.value.source };
    const response = await axios.get('/api/formula/page', { params });
    if (response.data?.code === 20000) {
      const result = response.data.data as PaginatedFormulas;
      formulaList.value = result.records;
      totalItems.value = result.total;
    } else { throw new Error(response.data.msg); }
  } catch (err) { console.error('获取方剂数据失败:', err); }
  finally { searchLoading.value = false; }
};

const performSearch = () => {
  searchOptions.value.page = 1;
  fetchFormulas();
};

const resetSearch = () => {
  searchParams.value = { keyword: '', source: '' };
  performSearch();
};

// 智能推荐
const getRecommendations = async () => {
  if (symptoms.value.length === 0) { recommendError.value = '请输入至少一个症状。'; return; }
  recommendLoading.value = true;
  recommendError.value = null;
  recommendations.value = [];
  try {
    const response = await axios.post('/api/formula/recommend', { symptoms: symptoms.value });
    if (response.data?.code === 20000) {
      recommendations.value = response.data.data.map((rec: any) => ({ ...rec, loadingDetails: true }));
      if (recommendations.value.length === 0) recommendError.value = '未找到合适的方剂。';
      else fetchAllFormulaDetails();
    } else { throw new Error(response.data.msg); }
  } catch (err: any) { recommendError.value = err.message || '请求失败'; }
  finally { recommendLoading.value = false; }
};

const fetchAllFormulaDetails = async () => {
  const detailPromises = recommendations.value.map(rec =>
    axios.get(`/api/formula/${rec.formulaId}`)
      .then(res => {
        const targetRec = recommendations.value.find(r => r.formulaId === res.data.data.id);
        if (targetRec) targetRec.details = res.data.data;
      })
      .catch(err => console.error(`获取ID ${rec.formulaId} 详情失败:`, err))
      .finally(() => {
        const targetRec = recommendations.value.find(r => r.formulaId === rec.formulaId);
        if (targetRec) targetRec.loadingDetails = false;
      })
  );
  await Promise.all(detailPromises);
};

// 方剂对比
const fetchAllFormulasForCompare = async () => {
  try {
    const response = await axios.get('/api/formula/page', { params: { page: 1, size: 200 } });
    if (response.data?.code === 20000) {
      allFormulas.value = response.data.data.records.map((f: Formula) => ({ id: f.id, name: f.name }));
    }
  } catch (err) { console.error("获取所有方剂列表失败:", err); }
};

const performComparison = async () => {
  if (selectedFormulaIds.value.length < 2) { compareError.value = '请至少选择两个方剂。'; return; }
  compareLoading.value = true;
  compareError.value = null;
  comparisonData.value = null;
  try {
    const response = await axios.post('/api/formula/compare', selectedFormulaIds.value);
    if (response.data?.code === 20000) comparisonData.value = response.data.data;
    else throw new Error(response.data.msg);
  } catch (err: any) { compareError.value = err.message || '请求失败'; }
  finally { compareLoading.value = false; }
};

// 配伍分析
const performAnalysis = async () => {
  if (!searchHerb.value) { analysisError.value = '请输入药材名称。'; return; }
  analysisLoading.value = true;
  analysisError.value = null;
  analysisResult.value = [];
  try {
    const response = await axios.get('/api/formula/analysis/herb-combinations', { params: { herbName: searchHerb.value } });
    if (response.data?.code === 20000) {
      analysisResult.value = response.data.data;
      if (analysisResult.value.length === 0) {
        analysisError.value = `未找到关于"${searchHerb.value}"的配伍数据。`;
        chartData.value = { labels: [], datasets: [{ data: [], label: '配伍次数', backgroundColor: 'rgba(63, 81, 181, 0.8)' }] };
      } else {
        const top10 = [...analysisResult.value].slice(0, 10).reverse();
        chartData.value.labels = top10.map(item => item.herbName);
        chartData.value.datasets[0].data = top10.map(item => item.combinationCount);
        chartOptions.value.plugins.title.text = `"${searchHerb.value}" 配伍药材Top 10`;
      }
    } else { throw new Error(response.data.msg); }
  } catch (err: any) { analysisError.value = err.message || '请求失败'; }
  finally { analysisLoading.value = false; }
};

// --- 工具函数 ---
const getScoreColor = (score: number) => {
  if (score > 0.7) return 'success';
  if (score > 0.5) return 'primary';
  return 'grey';
};

// --- 侦听器 ---
watch(activeTab, (newTab) => {
  if (newTab === 'compare' && allFormulas.value.length === 0) {
    fetchAllFormulasForCompare();
  } else if (newTab === 'search' && formulaList.value.length === 0) {
    fetchFormulas();
  }
});

// --- 生命周期 ---
onMounted(() => {
  fetchFormulas();
});

</script>

<template>
  <v-app class="app-container">
    <!-- 顶部装饰背景 -->
    <div class="decorative-bg"></div>
    
    <v-main>
      <!-- 精美的头部区域 -->
      <v-card class="header-card elevation-12" flat>
        <div class="header-overlay"></div>
        <v-container>
          <v-row align="center" justify="center" class="header-content">
            <v-col cols="auto">
              <div class="header-icon-container">
                <v-icon size="56" class="header-icon">mdi-medical-bag</v-icon>
                <div class="icon-glow"></div>
              </div>
            </v-col>
            <v-col>
              <div class="header-text">
                <h1 class="main-title">中医方剂智能分析系统</h1>
                <p class="subtitle">传承千年智慧，探索方剂奥秘</p>
                <div class="decorative-line"></div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>

      <v-container class="main-container">
        <!-- 优雅的导航标签 -->
        <v-card class="navigation-card elevation-8" flat>
          <v-tabs 
            v-model="activeTab" 
            color="primary" 
            align-tabs="center" 
            class="elegant-tabs"
            slider-color="primary"
          >
            <v-tab 
              v-for="tab in tabs" 
              :key="tab.value" 
              :value="tab.value" 
              class="tab-item"
            >
              <template v-if="typeof tab.icon === 'string'">
                <v-icon :icon="tab.icon" class="tab-icon"></v-icon>
              </template>
              <template v-else>
                <component :is="tab.icon.component" v-bind="tab.icon.props" class="tab-icon" />
              </template>
              <span class="tab-text">{{ tab.title }}</span>
            </v-tab>
          </v-tabs>
        </v-card>

        <!-- 内容区域 -->
        <v-window v-model="activeTab" class="content-window">
          <!-- 方剂检索 -->
          <v-window-item value="search">
            <div class="content-section">
              <v-card class="search-card glass-card" elevation="8">
                <v-card-title class="section-title">
                  <v-icon class="section-icon">mdi-magnify</v-icon>
                  方剂检索
                </v-card-title>
                <v-card-text class="search-content">
                  <v-row align="center" class="search-row">
                    <v-col cols="12" md="5">
                      <v-text-field 
                        v-model="searchParams.keyword" 
                        label="搜索方剂名称、主治..." 
                        prepend-inner-icon="mdi-magnify" 
                        variant="outlined" 
                        density="comfortable"
                        clearable 
                        hide-details 
                        class="search-input"
                        @keydown.enter="performSearch"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field 
                        v-model="searchParams.source" 
                        label="按出处筛选，如: 伤寒论" 
                        prepend-inner-icon="mdi-book-open-variant" 
                        variant="outlined" 
                        density="comfortable"
                        clearable 
                        hide-details 
                        class="search-input"
                        @keydown.enter="performSearch"
                      />
                    </v-col>
                    <v-col cols="12" md="3" class="text-md-right">
                      <div class="button-group">
                        <v-btn 
                          @click="resetSearch" 
                          variant="outlined" 
                          color="primary"
                          class="action-btn reset-btn"
                        >
                          <v-icon class="mr-1">mdi-refresh</v-icon>
                          重置
                        </v-btn>
                        <v-btn 
                          @click="performSearch" 
                          color="primary" 
                          variant="flat"
                          class="action-btn search-btn"
                        >
                          <v-icon class="mr-1">mdi-magnify</v-icon>
                          搜索
                        </v-btn>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <v-card class="results-card glass-card" elevation="8">
                <v-data-table-server 
                  v-model:items-per-page="searchOptions.itemsPerPage" 
                  v-model:page="searchOptions.page" 
                  :headers="headers" 
                  :items="formulaList" 
                  :items-length="totalItems" 
                  :loading="searchLoading" 
                  @update:options="fetchFormulas" 
                  item-value="id" 
                  :items-per-page-options="[{value: 8, title: '8'}, {value: 16, title: '16'}, {value: 24, title: '24'}]"
                  class="elegant-table"
                  hover
                >
                  <template #loading>
                    <v-skeleton-loader type="table-row@8" class="table-loader"></v-skeleton-loader>
                  </template>
                  <template #item.name="{ item }">
                    <div class="formula-name">
                      <div class="name-primary">{{ item.name }}</div>
                      <div v-if="item.alias" class="name-alias">别名: {{ item.alias }}</div>
                    </div>
                  </template>
                  <template #item.source="{ item }">
                    <div class="source-info">
                      <div class="source-primary">{{ item.source }}</div>
                      <div class="source-dynasty">{{ item.dynasty }}</div>
                    </div>
                  </template>
                  <template #item.functionEffect="{ item }">
                    <p class="description-cell">{{ item.functionEffect }}</p>
                  </template>
                  <template #item.mainTreatment="{ item }">
                    <p class="description-cell">{{ item.mainTreatment }}</p>
                  </template>
                </v-data-table-server>
              </v-card>
            </div>
          </v-window-item>

          <!-- 智能推荐 -->
          <v-window-item value="recommend">
            <div class="content-section">
              <v-card class="recommend-card glass-card" elevation="8">
                <v-card-title class="section-title">
                  <component :is="Icon" icon="stash:thumb-up-light" class="section-icon" />
                  智能推荐
                </v-card-title>
                <v-card-text class="recommend-content">
                  <v-combobox 
                    v-model="symptoms" 
                    :items="commonSymptoms" 
                    label="输入症状后按回车键确认，可输入多个" 
                    variant="outlined" 
                    multiple 
                    chips 
                    clearable 
                    prepend-inner-icon="mdi-clipboard-text-search-outline"
                    class="symptoms-input"
                    density="comfortable"
                  />
                  <v-btn 
                    :loading="recommendLoading" 
                    color="primary" 
                    variant="flat" 
                    size="large" 
                    @click="getRecommendations" 
                    block 
                    class="recommend-btn"
                  >
                    <v-icon class="mr-2">mdi-brain</v-icon>
                    获取方剂推荐
                  </v-btn>
                </v-card-text>
              </v-card>

              <div v-if="recommendLoading" class="loading-section">
                <v-progress-circular indeterminate color="primary" size="60" width="6"></v-progress-circular>
                <p class="loading-text">AI辨证分析中...</p>
              </div>

              <v-alert 
                v-if="recommendError" 
                type="warning" 
                :text="recommendError" 
                variant="tonal" 
                class="error-alert"
              />

              <v-row v-if="recommendations.length > 0" class="recommendations-grid">
                <v-col v-for="rec in recommendations" :key="rec.formulaId" cols="12" lg="6">
                  <v-card class="recommendation-card glass-card" elevation="6">
                    <v-card-title class="recommendation-header">
                      <div class="recommendation-name">{{ rec.formulaName }}</div>
                      <v-chip 
                        :color="getScoreColor(rec.score)" 
                        label 
                        class="score-chip"
                        size="small"
                      >
                        匹配度: {{ (rec.score * 100).toFixed(1) }}%
                      </v-chip>
                    </v-card-title>
                    <v-card-text class="recommendation-content">
                      <v-progress-linear 
                        :model-value="rec.score * 100" 
                        :color="getScoreColor(rec.score)" 
                        height="8" 
                        rounded 
                        class="score-progress"
                      />
                      <div v-if="rec.loadingDetails" class="loading-details">
                        <v-progress-circular indeterminate size="20" width="2" color="primary"></v-progress-circular>
                        <span class="loading-text-small">加载详情...</span>
                      </div>
                      <div v-if="rec.details && !rec.loadingDetails" class="formula-details">
                        <div class="detail-item">
                          <strong>组成:</strong> {{ rec.details.composition }}
                        </div>
                        <div class="detail-item">
                          <strong>用法:</strong> {{ rec.details.usage }}
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- 方剂对比 -->
          <v-window-item value="compare">
            <div class="content-section">
              <v-card class="compare-card glass-card" elevation="8">
                <v-card-title class="section-title">
                  <v-icon class="section-icon">mdi-compare-horizontal</v-icon>
                  方剂对比
                </v-card-title>
                <v-card-text class="compare-content">
                  <v-select 
                    v-model="selectedFormulaIds" 
                    :items="allFormulas" 
                    item-title="name" 
                    item-value="id" 
                    label="选择两个或更多方剂进行对比" 
                    variant="outlined" 
                    multiple 
                    chips 
                    clearable 
                    prepend-inner-icon="mdi-pill"
                    class="formula-select"
                    density="comfortable"
                  />
                  <v-btn 
                    :loading="compareLoading" 
                    :disabled="selectedFormulaIds.length < 2" 
                    color="primary" 
                    variant="flat" 
                    size="large" 
                    @click="performComparison" 
                    block 
                    class="compare-btn"
                  >
                    <v-icon class="mr-2">mdi-compare</v-icon>
                    开始对比分析
                  </v-btn>
                </v-card-text>
              </v-card>

              <div v-if="compareLoading" class="loading-section">
                <v-progress-circular indeterminate color="primary" size="60" width="6"></v-progress-circular>
                <p class="loading-text">对比分析中...</p>
              </div>

              <v-alert 
                v-if="compareError" 
                type="error" 
                :text="compareError" 
                variant="tonal" 
                class="error-alert"
              />

              <v-card v-if="comparisonData" class="comparison-result glass-card" elevation="8">
                <v-card-title class="comparison-title">
                  <v-icon class="mr-2">mdi-table</v-icon>
                  对比结果
                </v-card-title>
                <v-card-text class="comparison-content">
                   <div class="table-responsive-wrapper">
                  <v-table class="comparison-table elegant-table">
                    <thead>
                      <tr class="table-header">
                        <th class="comparison-label">对比项</th>
                        <th 
                          v-for="formula in comparisonData.formulas" 
                          :key="formula.id" 
                          class="formula-header"
                        >
                          {{ formula.name }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(values, key) in comparisonData.comparisonPoints" :key="key" class="comparison-row">
                        <td class="comparison-key">{{ key }}</td>
                        <td 
                          v-for="(value, index) in values" 
                          :key="index" 
                          class="comparison-value"
                        >
                          {{ value || '无' }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-window-item>

          <!-- 配伍分析 -->
          <v-window-item value="analysis">
            <div class="content-section">
              <v-card class="analysis-card glass-card" elevation="8">
                <v-card-title class="section-title">
                  <v-icon class="section-icon">mdi-vector-combine</v-icon>
                  配伍分析
                </v-card-title>
                <v-card-text class="analysis-content">
                  <v-text-field 
                    v-model="searchHerb" 
                    label="输入核心药材进行配伍分析" 
                    variant="outlined" 
                    clearable 
                    prepend-inner-icon="mdi-leaf"
                    class="herb-input"
                    density="comfortable"
                    @keydown.enter="performAnalysis"
                  />
                  <v-btn 
                    :loading="analysisLoading" 
                    color="primary" 
                    variant="flat" 
                    size="large" 
                    @click="performAnalysis" 
                    block 
                    class="analysis-btn"
                  >
                    <v-icon class="mr-2">mdi-chart-bar</v-icon>
                    开始配伍分析
                  </v-btn>
                </v-card-text>
              </v-card>

              <div v-if="analysisLoading" class="loading-section">
                <v-progress-circular indeterminate color="primary" size="60" width="6"></v-progress-circular>
                <p class="loading-text">配伍分析中...</p>
              </div>

              <v-alert 
                v-if="analysisError" 
                type="info" 
                :text="analysisError" 
                variant="tonal" 
                class="error-alert"
              />

              <v-row v-if="analysisResult.length > 0" class="analysis-results">
                <v-col cols="12" lg="5">
                  <v-card class="chart-card glass-card" elevation="8">
                    <v-card-title class="chart-title">
                      <v-icon class="mr-2">mdi-chart-bar</v-icon>
                      配伍频次图表
                    </v-card-title>
                    <v-card-text class="chart-content">
                      <div class="chart-container">
                        <Bar :data="chartData" :options="chartOptions" />
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" lg="7">
                  <v-card class="table-card glass-card" elevation="8">
                    <v-card-title class="table-title">
                      <v-icon class="mr-2">mdi-table</v-icon>
                      配伍数据详情
                    </v-card-title>
                    <v-card-text class="table-content">
                      <v-table class="analysis-table elegant-table">
                        <thead>
                          <tr class="table-header">
                            <th class="table-header-cell">配伍药材</th>
                            <th class="table-header-cell">配伍次数</th>
                            <th class="table-header-cell">配伍比例</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr 
                            v-for="item in analysisResult" 
                            :key="item.herbName" 
                            class="table-row"
                          >
                            <td class="herb-name">{{ item.herbName }}</td>
                            <td class="combination-count">{{ item.combinationCount }}</td>
                            <td class="combination-ratio">{{ (item.combinationRatio * 100).toFixed(0) }}%</td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* --- 全局与布局 --- */
.app-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf2 100%);
  font-family: 'Helvetica Neue', Arial, 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.v-main {
  padding: 2rem 1rem;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* 统一内容区域卡片间距 */
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- 精美的头部 --- */
.header-card {
  background: url('https://images.unsplash.com/photo-1558985250-2d89b5355ac2?q=80&w=2070&auto=format&fit=crop') center center/cover;
  border-radius: 24px !important;
  color: white;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
  padding: 2rem 0;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(46, 59, 118, 0.9) 0%, rgba(63, 81, 181, 0.7) 100%);
}

.header-content {
  position: relative; /* 确保内容在遮罩层之上 */
  z-index: 2;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-top: 0.5rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.decorative-line {
  width: 80px;
  height: 4px;
  background-color: #fdd835; /* 亮黄色作为点缀 */
  border-radius: 2px;
  margin-top: 1rem;
}

/* --- 玻璃卡片通用样式 --- */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px !important;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px 0 rgba(106, 114, 153, 0.2);
}

.glass-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px 0 rgba(106, 114, 153, 0.3);
}

/* --- 导航标签 --- */
.navigation-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px !important;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.tab-item {
  text-transform: none; /* 取消默认大写 */
  font-size: 1rem;
  font-weight: 600;
  padding: 0 24px;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.tab-item:hover {
  background-color: rgba(63, 81, 181, 0.05);
}

.tab-icon {
  margin-right: 8px;
}

/* --- 通用卡片标题 --- */
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #3F51B5; /* Vuetify Primary Color */
  display: flex;
  align-items: center;
  padding-bottom: 1rem;
}

.section-icon {
  margin-right: 0.75rem;
}

/* --- 表格样式 --- */
.elegant-table {
  background-color: transparent;
}
:deep(.v-data-table__wrapper) {
  border-radius: 8px;
}
:deep(thead.v-data-table-header) {
  background-color: rgba(63, 81, 181, 0.08);
}
:deep(th) {
  font-weight: bold !important;
  color: #3F51B5 !important;
  font-size: 0.9rem !important;
}
:deep(td) {
  font-size: 0.95rem;
  vertical-align: middle;
  word-wrap: break-word; /* 确保长文本换行 */
  word-break: break-all;
}
:deep(tbody tr:hover) {
  background-color: rgba(63, 81, 181, 0.04) !important;
}

.formula-name .name-primary {
  font-weight: 600;
  color: #303f9f;
}
.formula-name .name-alias, .source-info .source-dynasty {
  font-size: 0.85rem;
  color: #546e7a;
}
.description-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 3.2em;
  line-height: 1.6em;
}

/* --- 表单与按钮 --- */
.action-btn {
  font-weight: bold;
  letter-spacing: 0.5px;
}

.search-btn {
  box-shadow: 0 2px 5px rgba(63, 81, 181, 0.3);
}

.recommend-card, .compare-card, .analysis-card {
  padding: 1rem;
}

/* --- 智能推荐 & 对比 & 分析 结果卡片 --- */
.recommendation-card {
  transition: all 0.3s ease;
}
.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.recommendation-name {
  font-weight: 600;
  color: #3F51B5;
}
.score-chip {
  font-weight: 600;
}
.score-progress {
  margin-bottom: 1rem;
}
.formula-details {
  font-size: 0.9rem;
  line-height: 1.6;
}
.detail-item {
  margin-bottom: 0.5rem;
}
.loading-details {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #555;
  padding: 1rem 0;
}
.loading-text-small {
  margin-left: 0.5rem;
}

/* --- 通用加载与错误提示 --- */
.loading-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
  gap: 1rem;
  text-align: center;
}
.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #3F51B5;
}
.error-alert {
  font-weight: 500;
}

/* --- 配伍分析图表 --- */
.chart-container {
  height: 450px; /* 给予图表足够的展示高度 */
  padding: 1rem;
}
.chart-card, .table-card {
  height: 100%;
}

.table-responsive-wrapper {
  overflow-x: auto; /* 关键：当内容超出时，只在水平方向上出现滚动条 */
  width: 100%;
}

.comparison-table {
  /* 让表格可以自由伸展，而不是被容器宽度限制 */
  width: 100%;
  table-layout: fixed; /* 固定表格布局算法，让列宽更可控 */
}

/* 使用 :deep() 穿透组件，确保样式应用到 th 和 td */
:deep(.comparison-table th),
:deep(.comparison-table td) {
  white-space: nowrap; /* 关键：防止单元格内的文字换行 */
  padding: 16px 20px !important; /* 增加一些左右内边距，让内容更舒展 */
}

/* 为第一列（对比项）设置一个合理的宽度 */
:deep(.comparison-table .comparison-label) {
  width: 140px; 
}

/* 让显示方剂名称的表头有最小宽度，防止被过度挤压 */
:deep(.comparison-table .formula-header) {
  min-width: 220px;
}
</style>