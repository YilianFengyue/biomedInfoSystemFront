<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

// --- 类型定义 ---
// 推荐接口返回的基本信息
interface FormulaRecommendVO {
  formulaId: number;
  formulaName: string;
  score: number;
  recommendation: string;
  // 新增：用于存储从详情接口获取的额外数据
  details?: FormulaDetail;
  loadingDetails?: boolean; // 用于控制单个卡片的加载状态
}

// 详情接口返回的完整信息
interface FormulaDetail {
  id: number;
  name: string;
  composition: string;
  preparation: string;
  usage: string;
  dosageForm: string;
  functionEffect: string;
  mainTreatment: string;
}

// --- 组件状态 ---
const symptoms = ref<string[]>(['头痛']);
const recommendations = ref<FormulaRecommendVO[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// --- 模拟一些常见症状用于输入提示 ---
const commonSymptoms = [
  '头痛', '发热', '恶寒', '咳嗽', '咽痛', '无汗',
  '胸痛', '心悸', '失眠', '急躁易怒', '食少', '便溏'
];

// --- 方法 ---
const getRecommendations = async () => {
  if (symptoms.value.length === 0) {
    error.value = '请输入至少一个症状。';
    recommendations.value = [];
    return;
  }

  loading.value = true;
  error.value = null;
  recommendations.value = [];

  try {
    // 第一步：获取推荐列表
    const recommendResponse = await axios.post('/api/formula/recommend', {
      symptoms: symptoms.value,
    });

    if (recommendResponse.data && recommendResponse.data.code === 20000) {
      const initialRecommendations = recommendResponse.data.data as FormulaRecommendVO[];
      if (initialRecommendations.length === 0) {
        error.value = '根据您提供的症状，暂未找到合适的方剂。';
        loading.value = false;
        return;
      }
      // 初始化推荐列表，并为每个项目添加加载状态
      recommendations.value = initialRecommendations.map(rec => ({ ...rec, loadingDetails: true }));

      // 第二步：并发获取所有推荐方剂的详细信息
      await fetchAllFormulaDetails();

    } else {
      throw new Error(recommendResponse.data.msg || '获取推荐失败');
    }
  } catch (err: any) {
    console.error('获取方剂推荐时出错:', err);
    error.value = err.message || '网络请求失败，请检查后端服务是否可用。';
  } finally {
    loading.value = false;
  }
};

// 新增：获取所有推荐方剂详情的函数
const fetchAllFormulaDetails = async () => {
  const detailPromises = recommendations.value.map(rec =>
    axios.get(`/api/formula/${rec.formulaId}`)
      .then(response => {
        if (response.data && response.data.code === 20000) {
          // 找到对应的推荐项并更新其详情
          const targetRec = recommendations.value.find(r => r.formulaId === response.data.data.id);
          if (targetRec) {
            targetRec.details = response.data.data;
            targetRec.loadingDetails = false;
          }
        }
      })
      .catch(err => {
        console.error(`获取方剂 ${rec.formulaId} 详情失败:`, err);
        const targetRec = recommendations.value.find(r => r.formulaId === rec.formulaId);
        if (targetRec) targetRec.loadingDetails = false; // 即使失败也要停止加载动画
      })
  );
  await Promise.all(detailPromises);
};


// --- 计算属性，用于动态显示UI ---
const getScoreColor = (score: number) => {
  if (score > 0.7) return 'success';
  if (score > 0.5) return 'primary';
  return 'grey';
};
</script>

<template>
  <v-container class="py-8 px-6" fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <div class="text-center mb-8">
          <v-icon size="48" color="primary" class="mb-4">mdi-brain-sync-outline</v-icon>
          <h1 class="text-h4 font-weight-bold">智能辨证论治</h1>
          <p class="text-h6 text-grey-darken-1 font-weight-regular mt-2">
            根据您的症状，为您提供专业的中医药方剂参考
          </p>
        </div>

        <v-card class="pa-4 pa-md-6" elevation="5" rounded="xl">
          <v-card-title class="text-h6 font-weight-medium mb-4">
            请输入您的症状
          </v-card-title>
          <v-combobox
            v-model="symptoms"
            :items="commonSymptoms"
            label="输入症状后按回车键确认，可输入多个"
            variant="outlined"
            multiple
            chips
            clearable
            prepend-inner-icon="mdi-clipboard-text-search-outline"
          >
            <template v-slot:no-data>
              <v-list-item>
                <v-list-item-title>
                  未找到匹配项。按 <kbd>enter</kbd> 创建新症状。
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-combobox>

          <v-card-actions class="mt-4">
            <v-spacer></v-spacer>
            <v-btn
              :loading="loading"
              color="primary"
              variant="flat"
              size="x-large"
              @click="getRecommendations"
              block
            >
              获取方剂推荐
              <v-icon right>mdi-arrow-right-circle-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>

        <div class="mt-8">
          <div v-if="loading" class="text-center">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4 text-grey-darken-1">正在为您辨证分析，请稍候...</p>
          </div>

          <v-alert
            v-if="error"
            type="warning"
            :text="error"
            variant="tonal"
            class="mb-6"
            border="start"
          ></v-alert>

          <v-list lines="three" bg-color="transparent" v-if="recommendations.length > 0">
             <v-list-subheader class="font-weight-bold">推荐方剂列表 (根据匹配度排序)</v-list-subheader>
            <v-list-item
              v-for="rec in recommendations"
              :key="rec.formulaId"
              class="mb-4"
            >
              <v-card variant="outlined" rounded="lg">
                <v-card-title class="d-flex justify-space-between">
                  <span class="text-h6 font-weight-bold text-primary">{{ rec.formulaName }}</span>
                  <v-chip :color="getScoreColor(rec.score)" label>
                    匹配度: {{ (rec.score * 100).toFixed(1) }}%
                  </v-chip>
                </v-card-title>
                <v-card-text>
                  <v-progress-linear
                    :model-value="rec.score * 100"
                    :color="getScoreColor(rec.score)"
                    height="8"
                    rounded
                    class="mb-4"
                  ></v-progress-linear>
                  <div class="text-body-1">{{ rec.recommendation }}</div>

                  <div v-if="rec.loadingDetails" class="text-center pa-4">
                    <v-progress-circular indeterminate size="24" width="2"></v-progress-circular>
                    <span class="ml-2 text-caption">正在加载方剂详情...</span>
                  </div>
                  
                  <div v-if="rec.details && !rec.loadingDetails">
                    <v-divider class="my-4"></v-divider>
                    <div class="mb-3">
                      <p class="font-weight-bold">药物组成:</p>
                      <v-chip v-for="(herb, i) in rec.details.composition.split('、')" :key="i" size="small" class="mr-2 mt-2" label>
                          {{ herb }}
                      </v-chip>
                    </div>
                    <div class="mb-3">
                      <p class="font-weight-bold">用法用量:</p>
                      <p class="text-body-2">{{ rec.details.usage }}</p>
                    </div>
                    <div class="mb-3">
                      <p class="font-weight-bold">制法:</p>
                      <p class="text-body-2">{{ rec.details.preparation }}</p>
                    </div>
                     <div class="mb-3">
                      <p class="font-weight-bold">剂型:</p>
                      <p class="text-body-2">{{ rec.details.dosageForm }}</p>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-list-item>
          </v-list>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>