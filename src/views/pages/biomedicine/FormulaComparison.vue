<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// --- 类型定义 ---
// 方剂详情
interface FormulaDetail {
  id: number;
  name: string;
  alias: string | null;
  source: string;
  dynasty: string;
  author: string;
  composition: string;
  functionEffect: string;
  mainTreatment: string;
  // ... 其他详细字段
}

// 接口返回的完整数据结构
interface ComparisonData {
  formulas: FormulaDetail[];
  comparisonPoints: Record<string, string[]>;
}

// --- 组件状态 ---
const allFormulas = ref<{ id: number; name: string }[]>([]);
const selectedFormulaIds = ref<number[]>([1, 2]); // 默认选中两个，方便演示
const comparisonData = ref<ComparisonData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// --- 方法 ---
// 页面加载时，获取所有方剂用于选择器
const fetchAllFormulas = async () => {
  try {
    // 调用分页接口获取方剂列表，这里简化为只取前100条作为示例
    const response = await axios.get('/api/formula/page', {
      params: { page: 1, size: 100 }
    });
    if (response.data && response.data.code === 20000) {
      allFormulas.value = response.data.data.records.map((f: Formula) => ({
        id: f.id,
        name: f.name
      }));
    }
  } catch (err) {
    console.error("获取所有方剂列表失败:", err);
  }
};

// 执行对比
const performComparison = async () => {
  if (selectedFormulaIds.value.length < 2) {
    error.value = '请至少选择两个方剂进行对比。';
    comparisonData.value = null;
    return;
  }

  loading.value = true;
  error.value = null;
  comparisonData.value = null;

  try {
    const response = await axios.post('/api/formula/compare', selectedFormulaIds.value);
    
    if (response.data && response.data.code === 20000) {
      comparisonData.value = response.data.data;
    } else {
      throw new Error(response.data.msg || '获取对比数据失败');
    }
  } catch (err: any) {
    console.error('方剂对比请求出错:', err);
    error.value = err.message || '网络请求失败，请检查后端服务是否可用。';
  } finally {
    loading.value = false;
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchAllFormulas();
});
</script>

<template>
  <v-container class="py-8 px-6" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="9">
        <div class="text-center mb-8">
          <v-icon size="48" color="primary" class="mb-4">mdi-compare-horizontal</v-icon>
          <h1 class="text-h4 font-weight-bold">方剂对比分析</h1>
          <p class="text-h6 text-grey-darken-1 font-weight-regular mt-2">
            深入洞察不同方剂之间的异同
          </p>
        </div>

        <v-card class="pa-4 pa-md-6 mb-8" elevation="5" rounded="xl">
          <v-card-title class="text-h6 font-weight-medium mb-4">
            选择要对比的方剂
          </v-card-title>
          <v-select
            v-model="selectedFormulaIds"
            :items="allFormulas"
            item-title="name"
            item-value="id"
            label="选择两个或更多方剂"
            variant="outlined"
            multiple
            chips
            clearable
            prepend-inner-icon="mdi-pill"
          ></v-select>
          <v-card-actions class="mt-4">
            <v-spacer></v-spacer>
            <v-btn
              :loading="loading"
              :disabled="selectedFormulaIds.length < 2"
              color="primary"
              variant="flat"
              size="x-large"
              @click="performComparison"
              block
            >
              开始对比
              <v-icon right>mdi-arrow-right-bold-box-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>

        <div v-if="loading" class="text-center mt-12">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1">正在生成对比报告，请稍候...</p>
        </div>

        <v-alert
          v-if="error"
          type="error"
          :text="error"
          variant="tonal"
          class="mb-6"
          border="start"
        ></v-alert>

        <v-card v-if="comparisonData" variant="outlined" rounded="lg">
          <v-table class="comparison-table">
            <thead>
              <tr>
                <th class="text-left font-weight-bold" style="width: 15%;">对比项</th>
                <th 
                  v-for="formula in comparisonData.formulas" 
                  :key="formula.id"
                  class="text-left font-weight-bold text-primary"
                >
                  {{ formula.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(values, key) in comparisonData.comparisonPoints" :key="key">
                <td class="font-weight-medium text-grey-darken-2">{{ key }}</td>
                <td v-for="(value, index) in values" :key="index">
                  {{ value || '无' }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-container {
  background-color: #f5f5f5;
}

.comparison-table {
  border-radius: 8px;
}

.comparison-table th,
.comparison-table td {
  vertical-align: top;
  padding: 16px !important;
}

.comparison-table tbody tr:hover {
  background-color: #f9f9f9;
}
</style>