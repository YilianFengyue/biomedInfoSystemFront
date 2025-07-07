<template>
  <div class="knowledge-graph-wrapper">
    <div class="main-container">
      <!-- 头部区域 -->
      <div class="header-section">
        <div class="header-content">
          <!-- 标题区域 -->
          <div class="title-section">
            <div class="icon-wrapper">
              <div class="icon-bg">
                <v-icon size="32" color="white">mdi-graph</v-icon>
              </div>
              <div class="pulse-ring"></div>
            </div>
            <div class="title-text">
              <h1 class="main-title">中医药知识图谱</h1>
              <p class="subtitle">探索中医药材、方剂、疾病与症状的关联网络</p>
            </div>
          </div>
          
          <!-- 搜索区域 -->
          <div class="search-section">
            <div class="search-container">
              <div class="search-input-group">
                <v-select
                  v-model="selectedEntityType"
                  :items="entityTypes"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="entity-select"
                  color="success"
                >
                  <template v-slot:prepend-inner>
                    <v-icon :color="getEntityColor(selectedEntityType)" size="20">
                      {{ getEntityIcon(selectedEntityType) }}
                    </v-icon>
                  </template>
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.label">
                      <template v-slot:prepend>
                        <v-icon :color="getEntityColor(item.raw.value)" size="20">
                          {{ getEntityIcon(item.raw.value) }}
                        </v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
                
                <v-text-field
                  v-model="searchKeyword"
                  :label="`搜索${selectedEntityTypeLabel}`"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  class="keyword-input"
                  color="success"
                  @keydown.enter="handleSearch"
                  clearable
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="success" size="20">mdi-magnify</v-icon>
                  </template>
                </v-text-field>
              </div>
              
              <v-btn 
                @click="handleSearch"
                :loading="isLoading"
                size="large"
                class="search-btn"
                :disabled="!searchKeyword.trim()"
              >
                <v-icon left size="20">mdi-send</v-icon>
                开始探索
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-section">
        <!-- 侧边栏 -->
        <div v-if="graphData.nodes.length > 0" class="sidebar">
          <!-- 图例 -->
          <div class="info-card">
            <div class="info-card-header">
              <v-icon size="18" color="success">mdi-palette</v-icon>
              <span class="info-card-title">节点类型</span>
            </div>
            <div class="legend-list">
              <div 
                v-for="category in activeCategories" 
                :key="category.name"
                class="legend-item"
              >
                <div 
                  class="legend-dot" 
                  :style="{ backgroundColor: category.itemStyle.color }"
                ></div>
                <span class="legend-text">{{ category.name }}</span>
                <span class="legend-count">({{ getCategoryCount(category.name) }})</span>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="info-card">
            <div class="info-card-header">
              <v-icon size="18" color="success">mdi-chart-line</v-icon>
              <span class="info-card-title">图谱统计</span>
            </div>
            <div class="stats-list">
              <div class="stat-item">
                <div class="stat-icon">
                  <v-icon size="16" color="success">mdi-circle</v-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ graphData.nodes.length }}</div>
                  <div class="stat-label">节点数量</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">
                  <v-icon size="16" color="success">mdi-vector-link</v-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ graphData.links.length }}</div>
                  <div class="stat-label">关系数量</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">
                  <v-icon size="16" color="success">mdi-layers</v-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ activeCategories.length }}</div>
                  <div class="stat-label">类型数量</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作面板 -->
          <div class="info-card">
            <div class="info-card-header">
              <v-icon size="18" color="success">mdi-cog</v-icon>
              <span class="info-card-title">图谱操作</span>
            </div>
            <div class="action-buttons">
              <v-btn 
                variant="outlined" 
                color="success" 
                size="small" 
                @click="resetGraph"
                block
                class="mb-2"
              >
                <v-icon left size="16">mdi-refresh</v-icon>
                重置视图
              </v-btn>
              <v-btn 
                variant="outlined" 
                color="success" 
                size="small" 
                @click="fitView"
                block
              >
                <v-icon left size="16">mdi-fit-to-screen</v-icon>
                适应窗口
              </v-btn>
            </div>
          </div>
        </div>

        <!-- 图谱画布区域 -->
        <div class="chart-area">
          <div class="chart-container">
            <div ref="chartContainer" class="chart-canvas"></div>
            
            <!-- 图谱工具栏 -->
            <div v-if="graphData.nodes.length > 0" class="chart-toolbar">
              <v-btn-toggle 
                v-model="viewMode" 
                variant="outlined" 
                color="success"
                density="compact"
                mandatory
              >
                <v-btn value="force" size="small">
                  <v-icon size="16">mdi-graph</v-icon>
                  <span class="ml-1">力导向</span>
                </v-btn>
                <v-btn value="circular" size="small">
                  <v-icon size="16">mdi-circle-outline</v-icon>
                  <span class="ml-1">环形</span>
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="isLoading" class="overlay-state">
            <div class="loading-content">
              <div class="loading-spinner">
                <v-progress-circular 
                  indeterminate 
                  color="success" 
                  size="56" 
                  width="4"
                ></v-progress-circular>
              </div>
              <div class="loading-text">
                <h3>正在构建知识图谱</h3>
                <p>分析中医药关联关系中...</p>
              </div>
            </div>
          </div>
          
          <!-- 空数据状态 -->
          <div v-else-if="!graphData.nodes.length && !initialLoad" class="overlay-state">
            <div class="empty-content">
              <div class="empty-icon">
                <v-icon size="64" color="success" class="opacity-60">mdi-database-search</v-icon>
              </div>
              <h3 class="empty-title">未找到相关数据</h3>
              <p class="empty-subtitle">请尝试其他关键词或切换实体类型</p>
              <v-btn 
                color="success" 
                variant="outlined" 
                @click="resetSearch"
                class="mt-4"
              >
                <v-icon left size="16">mdi-refresh</v-icon>
                重新搜索
              </v-btn>
            </div>
          </div>
          
          <!-- 欢迎状态 -->
          <div v-else-if="!graphData.nodes.length && initialLoad" class="overlay-state">
            <div class="welcome-content">
              <div class="welcome-icon">
                <v-icon size="80" color="success" class="floating-icon">mdi-graph-outline</v-icon>
              </div>
              <h2 class="welcome-title">探索中医药知识图谱</h2>
              <p class="welcome-subtitle">发现中医药材、方剂、疾病与症状之间的神奇关联</p>
              
              <div class="quick-examples">
                <h4>快速开始</h4>
                <div class="example-chips">
                  <v-chip 
                    v-for="example in quickExamples" 
                    :key="example.keyword"
                    @click="quickSearch(example)"
                    color="success"
                    variant="outlined"
                    size="small"
                    class="example-chip"
                  >
                    <v-icon left size="14">{{ getEntityIcon(example.type) }}</v-icon>
                    {{ example.keyword }}
                  </v-chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, shallowRef, nextTick, watch } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import http from '@/api/http'; 
import { useSnackbarStore } from '@/stores/snackbarStore';

const chartContainer = ref<HTMLDivElement | null>(null);
const chartInstance = shallowRef<echarts.ECharts | null>(null);
const snackbarStore = useSnackbarStore();

const searchKeyword = ref('');
const isLoading = ref(false);
const initialLoad = ref(true); 
const graphData = ref<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
const selectedEntityType = ref('formula');
const viewMode = ref('force');

const entityTypes = [
  { label: '方剂', value: 'formula' },
  { label: '疾病', value: 'disease' },
  { label: '药材', value: 'herb' },
  { label: '症状', value: 'symptom' },
  { label: '证候', value: 'syndrome' },
];

const quickExamples = [
  { keyword: '血府逐瘀汤', type: 'formula' },
  { keyword: '人参', type: 'herb' },
  { keyword: '头痛', type: 'symptom' },
  { keyword: '感冒', type: 'disease' },
  { keyword: '血瘀证', type: 'syndrome' },
];

const selectedEntityTypeLabel = computed(() => {
    return entityTypes.find(t => t.value === selectedEntityType.value)?.label || '关键词';
});

const nodeCategories = [
  { name: '方剂', itemStyle: { color: '#2E7D32' } },
  { name: '药材', itemStyle: { color: '#388E3C' } },
  { name: '疾病', itemStyle: { color: '#43A047' } },
  { name: '症状', itemStyle: { color: '#4CAF50' } },
  { name: '证候', itemStyle: { color: '#66BB6A' } },
  { name: '核心节点', itemStyle: { color: '#1B5E20' } },
];

const activeCategories = computed(() => {
  const usedCategories = new Set(graphData.value.nodes.map(node => node.category));
  return nodeCategories.filter(category => usedCategories.has(category.name));
});

const getCategoryCount = (categoryName: string) => {
  return graphData.value.nodes.filter(node => node.category === categoryName).length;
};

const getEntityColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    formula: '#2E7D32',
    herb: '#388E3C',
    disease: '#43A047',
    symptom: '#4CAF50',
    syndrome: '#66BB6A',
  };
  return colorMap[type] || '#4CAF50';
};

const getEntityIcon = (type: string) => {
  const iconMap: { [key: string]: string } = {
    formula: 'mdi-bottle-tonic-plus',
    herb: 'mdi-leaf',
    disease: 'mdi-medical-bag',
    symptom: 'mdi-alert-circle',
    syndrome: 'mdi-stethoscope',
  };
  return iconMap[type] || 'mdi-help-circle';
};

const chartOption = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(46, 125, 50, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    textStyle: {
      color: '#fff',
      fontSize: 13,
    },
    formatter: (params: any) => {
      if (params.dataType === 'node') {
        return `
          <div style="padding: 10px; line-height: 1.5;">
            <div style="font-size: 15px; font-weight: bold; margin-bottom: 6px;">
              ${params.data.name}
            </div>
            <div style="color: #e8f5e8; font-size: 12px;">
              类型: ${params.data.category}
            </div>
          </div>
        `;
      }
      return '';
    },
  },
  animationDurationUpdate: 1000,
  animationEasingUpdate: 'cubicOut',
  series: [
    {
      type: 'graph',
      layout: viewMode.value === 'force' ? 'force' : 'circular',
      nodes: graphData.value.nodes.map(node => ({
        ...node,
        symbolSize: Math.max(20, (node.symbolSize || 30) * 0.8),
        itemStyle: {
          color: nodeCategories.find(c => c.name === node.category)?.itemStyle.color || '#4CAF50',
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(76, 175, 80, 0.3)',
          shadowBlur: 8,
        },
      })),
      links: graphData.value.links.map(link => ({
        ...link,
        lineStyle: {
          color: 'rgba(76, 175, 80, 0.6)',
          width: 2,
          curveness: 0.15,
        },
      })),
      categories: nodeCategories,
      roam: true,
      draggable: true,
      symbol: 'circle',
      label: { 
        show: true, 
        position: 'right', 
        formatter: '{b}', 
        fontSize: 11,
        color: '#2E7D32',
        fontWeight: '600',
      },
      force: viewMode.value === 'force' ? { 
        repulsion: 400, 
        edgeLength: [100, 200], 
        gravity: 0.1, 
        layoutAnimation: true 
      } : undefined,
      emphasis: { 
        focus: 'adjacency', 
        lineStyle: { 
          width: 4,
          color: 'rgba(46, 125, 50, 0.9)',
        },
        itemStyle: {
          shadowBlur: 15,
          shadowColor: 'rgba(76, 175, 80, 0.6)',
        },
      },
    },
  ],
}));

watch(viewMode, () => {
  if (chartInstance.value && graphData.value.nodes.length > 0) {
    chartInstance.value.setOption(chartOption.value, true);
  }
});

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    snackbarStore.showWarningMessage(`请输入${selectedEntityTypeLabel.value}进行搜索`);
    return;
  }
  
  isLoading.value = true;
  initialLoad.value = false;
  
  const endpoint = `/graph/${selectedEntityType.value}/${encodeURIComponent(searchKeyword.value.trim())}`;

  try {
    const response = await http.get(endpoint);
    const graphDataFromBackend = response.data.data;

    if (graphDataFromBackend && graphDataFromBackend.nodes && graphDataFromBackend.nodes.length > 0) {
      graphData.value = {
          nodes: graphDataFromBackend.nodes || [],
          links: graphDataFromBackend.links || []
      };
      
      await nextTick();
      chartInstance.value?.setOption(chartOption.value, true);

    } else {
      graphData.value = { nodes: [], links: [] };
      chartInstance.value?.clear();
      snackbarStore.showInfoMessage('没有找到相关的图谱数据。');
    }
  } catch (error: any) {
    console.error(`请求或处理图谱数据失败:`, error);
    graphData.value = { nodes: [], links: [] };
    chartInstance.value?.clear();
    snackbarStore.showErrorMessage('加载知识图谱失败，请检查网络连接。');
  } finally {
    isLoading.value = false;
  }
};

const quickSearch = (example: any) => {
  selectedEntityType.value = example.type;
  searchKeyword.value = example.keyword;
  handleSearch();
};

const resetSearch = () => {
  searchKeyword.value = '';
  selectedEntityType.value = 'formula';
  graphData.value = { nodes: [], links: [] };
  chartInstance.value?.clear();
  initialLoad.value = true;
};

const resetGraph = () => {
  if (chartInstance.value) {
    chartInstance.value.setOption(chartOption.value, true);
  }
};

const fitView = () => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  }
};

onMounted(() => {
  if (chartContainer.value) {
    chartInstance.value = echarts.init(chartContainer.value, 'light', { renderer: 'svg' });
  }
  
  window.addEventListener('resize', () => {
    chartInstance.value?.resize();
  });
});
</script>

<style scoped>
.knowledge-graph-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 50%, #FFFFFF 100%);
  padding: 20px;
}

.main-container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(76, 175, 80, 0.1);
  overflow: hidden;
}

.header-section {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  color: white;
  padding: 32px 40px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-bg {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.pulse-ring {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

.main-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.1rem;
  margin: 8px 0 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.search-section {
  flex: 1;
  max-width: 600px;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input-group {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.entity-select {
  flex: 0 0 160px;
}

.keyword-input {
  flex: 1;
}

.search-btn {
  background: linear-gradient(45deg, #66BB6A, #4CAF50);
  color: white;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.4);
  transition: all 0.3s ease;
  align-self: flex-start;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
}

.content-section {
  display: flex;
  min-height: 70vh;
}

.sidebar {
  width: 300px;
  background: #FAFAFA;
  padding: 24px;
  border-right: 1px solid #E8F5E8;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.1);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.info-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #2E7D32;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-text {
  font-size: 13px;
  color: #333;
  flex: 1;
}

.legend-count {
  font-size: 12px;
  color: #666;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F8FFF8;
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.1);
}

.stat-icon {
  width: 32px;
  height: 32px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #2E7D32;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.chart-area {
  flex: 1;
  position: relative;
  background: white;
}

.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.chart-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.overlay-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(2px);
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  position: relative;
}

.loading-text h3 {
  font-size: 1.4rem;
  color: #2E7D32;
  margin: 0;
  font-weight: 600;
}

.loading-text p {
  font-size: 1rem;
  color: #666;
  margin: 8px 0 0 0;
}

.empty-content,
.welcome-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 500px;
  padding: 40px;
}

.empty-title,
.welcome-title {
  font-size: 1.6rem;
  color: #2E7D32;
  margin: 0;
  font-weight: 600;
}

.empty-subtitle,
.welcome-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.floating-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.quick-examples {
  width: 100%;
  margin-top: 20px;
}

.quick-examples h4 {
  font-size: 1.1rem;
  color: #2E7D32;
  margin-bottom: 16px;
  font-weight: 600;
}

.example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.example-chip {
  transition: all 0.3s ease;
  cursor: pointer;
}

.example-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.opacity-60 {
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 24px;
  }
  
  .search-section {
    max-width: none;
  }
  
  .content-section {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #E8F5E8;
  }
}

@media (max-width: 768px) {
  .knowledge-graph-wrapper {
    padding: 12px;
  }
  
  .header-section {
    padding: 24px 20px;
  }
  
  .main-title {
    font-size: 1.8rem;
  }
  
  .search-input-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .entity-select {
    flex: 1;
  }
  
  .sidebar {
    padding: 16px;
  }
  
  .chart-canvas {
    min-height: 400px;
  }
}
</style>