<template>
  <div class="knowledge-graph-wrapper">
    <div class="main-container">
      <div class="header-section">
        <div class="header-content">
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
                  color="primary"
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
                  color="primary"
                  @keydown.enter="handleSearch"
                  clearable
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary" size="20">mdi-magnify</v-icon>
                  </template>
                </v-text-field>
              </div>
              
              <v-btn 
                @click="handleSearch"
                :loading="isLoading"
                size="large"
                class="search-btn"
                :disabled="!searchKeyword.trim()"
                color="primary"
                elevation="3"
              >
                <v-icon left size="20">mdi-send</v-icon>
                开始探索
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <div class="content-section">
        <v-row class="fill-height ma-0">
          <v-col cols="12" md="2" class="sidebar">
            <v-card class="info-card" elevation="1">
              <v-card-title class="info-card-header">
                <v-icon size="20" color="primary">mdi-palette</v-icon>
                <span class="info-card-title">节点类型</span>
              </v-card-title>
              <v-card-text>
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
                    <v-chip 
                      size="x-small" 
                      color="primary" 
                      variant="outlined"
                      class="legend-count"
                    >
                      {{ getCategoryCount(category.name) }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="info-card" elevation="1">
              <v-card-title class="info-card-header">
                <v-icon size="20" color="primary">mdi-chart-line</v-icon>
                <span class="info-card-title">图谱统计</span>
              </v-card-title>
              <v-card-text>
                <div class="stats-list">
                  <div class="stat-item">
                    <v-avatar size="40" color="primary" variant="tonal">
                      <v-icon size="20">mdi-circle</v-icon>
                    </v-avatar>
                    <div class="stat-content">
                      <div class="stat-value">{{ graphData.nodes.length }}</div>
                      <div class="stat-label">节点数量</div>
                    </div>
                  </div>
                  <div class="stat-item">
                    <v-avatar size="40" color="secondary" variant="tonal">
                      <v-icon size="20">mdi-vector-link</v-icon>
                    </v-avatar>
                    <div class="stat-content">
                      <div class="stat-value">{{ graphData.links.length }}</div>
                      <div class="stat-label">关系数量</div>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
            
             <v-card class="info-card" elevation="1">
              <v-card-title class="info-card-header">
                <v-icon size="20" color="primary">mdi-cog</v-icon>
                <span class="info-card-title">图谱操作</span>
              </v-card-title>
              <v-card-text>
                <div class="action-buttons">
                  <v-btn 
                    variant="tonal" 
                    color="primary" 
                    size="small" 
                    @click="resetGraph"
                    block
                    class="mb-2"
                  >
                    <v-icon left size="16">mdi-refresh</v-icon>
                    重置视图
                  </v-btn>
                  <v-btn 
                    variant="tonal" 
                    color="secondary" 
                    size="small" 
                    @click="fitView"
                    block
                    class="mb-2"
                  >
                    <v-icon left size="16">mdi-fit-to-screen</v-icon>
                    适应窗口
                  </v-btn>
                  <v-btn
                    variant="tonal"
                    color="error"
                    size="small"
                    @click="resetSearch"
                    block
                  >
                    <v-icon left size="16">mdi-eraser-variant</v-icon>
                    清空重置
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="7" class="chart-area pa-0">
            <div class="chart-container">
              <div ref="chartContainer" class="chart-canvas"></div>
              
              <div v-if="graphData.nodes.length > 0" class="chart-toolbar">
                <v-btn-toggle 
                  v-model="viewMode" 
                  variant="outlined" 
                  color="primary"
                  density="compact"
                  mandatory
                  elevation="2"
                  class="toolbar-toggle"
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
            <div v-if="isLoading" class="overlay-state">
              <v-card class="loading-card" elevation="3">
                <v-card-text class="loading-content">
                  <v-progress-circular 
                    indeterminate 
                    color="primary" 
                    size="56" 
                    width="4"
                    class="mb-4"
                  ></v-progress-circular>
                  <h3 class="loading-title">正在构建知识图谱</h3>
                  <p class="loading-text">分析中医药关联关系中...</p>
                </v-card-text>
              </v-card>
            </div>
            <div v-else-if="!graphData.nodes.length && !initialLoad" class="overlay-state">
              <v-card class="empty-card" elevation="3">
                <v-card-text class="empty-content">
                  <v-icon size="64" color="primary" class="mb-4">mdi-database-search</v-icon>
                  <h3 class="empty-title">未找到相关数据</h3>
                  <p class="empty-subtitle">请尝试其他关键词或切换实体类型</p>
                  <v-btn 
                    color="primary" 
                    variant="tonal" 
                    @click="resetSearch"
                    class="mt-4"
                  >
                    <v-icon left size="16">mdi-refresh</v-icon>
                    重新搜索
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
            <div v-else-if="!graphData.nodes.length && initialLoad" class="overlay-state">
              <v-card class="welcome-card" elevation="3">
                <v-card-text class="welcome-content">
                  <v-icon size="80" color="primary" class="floating-icon mb-4">mdi-graph-outline</v-icon>
                  <h2 class="welcome-title">探索中医药知识图谱</h2>
                  <p class="welcome-subtitle">发现中医药材、方剂、疾病与症状之间的神奇关联</p>
                  
                  <div class="quick-examples">
                    <h4>快速开始</h4>
                    <div class="example-chips">
                      <v-chip 
                        v-for="example in quickExamples" 
                        :key="example.keyword"
                        @click="quickSearch(example)"
                        color="primary"
                        variant="tonal"
                        size="small"
                        class="example-chip"
                      >
                        <v-icon left size="14">{{ getEntityIcon(example.type) }}</v-icon>
                        {{ example.keyword }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>

          <v-col cols="12" md="3" class="details-panel">
            <v-card class="fill-height info-card" elevation="1">
              <v-card-title class="info-card-header">
                <v-icon size="20" color="primary">mdi-information-outline</v-icon>
                <span class="info-card-title">节点详情</span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text class="details-content">
                <div v-if="selectedNode" class="node-details">
                    <!-- 1. 添加一个 div 作为 Flex 容器 -->
                    <div class="d-flex justify-space-between align-center mb-2">
                        <!-- 2. 把标题放进来 -->
                        <h3 class="text-h6 font-weight-bold">{{ selectedNode.name }}</h3>

                        <!-- 3. 把收藏按钮也放进来 -->
                        <CollectBtn 
                            :data="getNodeCollectData(selectedNode)"
                            size="small"
                            variant="tonal"
                        />
                    </div>

                      <!-- 其他元素保持原样，它们会自动排在下面 -->
                      <v-chip :color="getEntityColor(selectedNode.category)" label size="small" class="mb-4">
                          {{ selectedNode.category }}
                      </v-chip>
                      <p class="text-body-2">
                          {{ selectedNode.description || '暂无详细描述。' }}
                      </p>
                </div>
                <div v-else class="placeholder-text">
                  <v-icon size="48" color="grey-lighten-2">mdi-cursor-default-click-outline</v-icon>
                  <p class="mt-3 text-grey-darken-1">点击图谱中的节点查看详情</p>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
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
import CollectBtn from '@/components/common/Pin/CollectBtn.vue';

const chartContainer = ref<HTMLDivElement | null>(null);
const chartInstance = shallowRef<echarts.ECharts | null>(null);
const snackbarStore = useSnackbarStore();

const searchKeyword = ref('');
const isLoading = ref(false);
const initialLoad = ref(true); 
const graphData = ref<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
const selectedEntityType = ref('formula');
const viewMode = ref('force');

// 新增：用于存储选中节点的信息
const selectedNode = ref<any>(null);


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
  { keyword: '发热', type: 'symptom' },
  { keyword: '风热感冒', type: 'disease' },
  { keyword: '脾胃气虚证', type: 'syndrome' },
];

const selectedEntityTypeLabel = computed(() => {
    return entityTypes.find(t => t.value === selectedEntityType.value)?.label || '关键词';
});

const nodeCategories = [
  { name: '方剂', itemStyle: { color: '#B0D183' } },
  { name: '药材', itemStyle: { color: '#C1CBAD' } },
  { name: '疾病', itemStyle: { color: '#BBC23F' } },
  { name: '症状', itemStyle: { color: '#BCA881' } },
  { name: '证候', itemStyle: { color: '#C2185B' } },
  { name: '核心节点', itemStyle: { color: '#424242' } },
];



// 添加这个方法：把节点数据转为收藏格式
const getNodeCollectData = (node: any) => {
  return {
    type: getNodeType(node.category), // 根据节点类别确定类型
    title: node.name,
    subtitle: `知识图谱 - ${node.category}`,
    content: node.description || `${node.category}节点：${node.name}`,
    sourceType: '知识图谱',
    tags: ['知识图谱', node.category, searchKeyword.value].filter(Boolean),
    metadata: {
      originalData: node,
      graphContext: {
        searchKeyword: searchKeyword.value,
        entityType: selectedEntityType.value
      }
    }
  }
}
// 节点类别映射到收藏类型
const getNodeType = (category: string) => {
  const typeMap = {
    '方剂': 'paper',
    '药材': 'herb', 
    '疾病': 'text',
    '症状': 'text',
    '证候': 'text'
  }
  return typeMap[category] || 'chart'
}

const activeCategories = computed(() => {
  const usedCategories = new Set(graphData.value.nodes.map(node => node.category));
  return nodeCategories.filter(category => usedCategories.has(category.name));
});

const getCategoryCount = (categoryName: string) => {
  return graphData.value.nodes.filter(node => node.category === categoryName).length;
};

const getEntityColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    formula: '#1976D2',
    herb: '#388E3C',
    disease: '#F57C00',
    symptom: '#7B1FA2',
    syndrome: '#C2185B',
  };
  return colorMap[type] || '#757575';
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
    backgroundColor: 'rgba(33, 33, 33, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
            <div style="color: #e0e0e0; font-size: 12px;">
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
          color: nodeCategories.find(c => c.name === node.category)?.itemStyle.color || '#757575',
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 8,
        },
      })),
      links: graphData.value.links.map(link => ({
        ...link,
        lineStyle: {
          color: 'rgba(117, 117, 117, 0.6)',
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
        color: '#424242',
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
          color: 'rgba(66, 66, 66, 0.9)',
        },
        itemStyle: {
          shadowBlur: 15,
          shadowColor: 'rgba(0, 0, 0, 0.4)',
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
      if (chartInstance.value) {
          chartInstance.value.setOption(chartOption.value, true);
          // 绑定点击事件
          chartInstance.value.on('click', (params) => {
              if (params.dataType === 'node') {
                  selectedNode.value = params.data;
              }
          });
      }

    } else {
      graphData.value = { nodes: [], links: [] };
      selectedNode.value = null; // 清空选中节点
      chartInstance.value?.clear();
      snackbarStore.showInfoMessage('没有找到相关的图谱数据。');
    }
  } catch (error: any) {
    console.error(`请求或处理图谱数据失败:`, error);
    graphData.value = { nodes: [], links: [] };
    selectedNode.value = null; // 清空选中节点
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
  selectedNode.value = null; // 清空选中节点
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.main-container {
  max-width: 1600px; /* 调整为更宽的布局 */
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header-section {
  /* 修改为您喜欢的柔和蓝色系渐变 */
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
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
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
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

/* --- START: TEXT COLOR FIX --- */
.search-input-group :deep(.v-field__input),
.search-input-group :deep(.v-select__selection-text) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.search-input-group :deep(.v-label) {
  color: rgba(0, 0, 0, 0.6) !important;
}
/* --- END: TEXT COLOR FIX --- */


.entity-select {
  flex: 0 0 160px;
}

.keyword-input {
  flex: 1;
}

.search-btn {
  align-self: flex-start;
  border-radius: 8px;
  text-transform: none;
  font-weight: 600;
}

.content-section {
  display: flex;
  min-height: 70vh;
}

.sidebar {
  width: 280px; /* Keep sidebar relatively narrow */
  background: rgb(var(--v-theme-surface));
  padding: 24px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;
}

.info-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 8px 16px;
  font-size: 14px;
  font-weight: 600;
}

.legend-list, .stats-list, .action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.details-panel {
  flex-shrink: 0;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.details-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.node-details {
    animation: fadeIn 0.5s ease-in-out;
}

.placeholder-text {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chart-area {
  flex: 1;
  position: relative;
  background: rgb(var(--v-theme-surface));
  min-width: 0; /* Important for flex-shrink to work */
}

/* ... other styles remain unchanged ... */
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

.toolbar-toggle {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
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
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

.loading-card,
.empty-card,
.welcome-card {
  max-width: 400px;
  margin: 20px;
  border-radius: 16px;
}

.loading-content,
.empty-content,
.welcome-content {
  text-align: center;
  padding: 40px 20px;
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
  margin-top: 24px;
}
.quick-examples h4 {
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
  font-weight: 600;
}

.example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.example-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .content-section .v-row {
    flex-direction: column;
  }
  .sidebar, .details-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
  .details-panel {
      border-left: none;
      border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
}

.knowledge-graph-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.main-container {
  max-width: 1600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header-section {
  background: linear-gradient(135deg, #B0D183 0%, #C1CBAD 100%);
  color: white;
  padding: 32px 40px;
}
</style>