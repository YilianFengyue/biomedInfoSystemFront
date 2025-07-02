<template>
  <v-container fluid class="pa-4">
    <!-- 主卡片 -->
    <v-card rounded="lg" class="elevation-4">
      <!-- 标题和介绍 -->
      <v-card-title class="pa-5 d-flex align-center">
        <v-icon color="primary" class="mr-3" size="x-large">mdi-sitemap</v-icon>
        <div>
          <h2 class="text-h5 font-weight-bold">个性化学习路径生成器</h2>
          <p class="text-body-2 text-grey-darken-1 mt-1">
            输入您的学习目标，AI将为您量身定制系统化的中医药学习方案。
          </p>
        </div>
      </v-card-title>
      <v-divider></v-divider>

      <!-- 用户输入与功能按钮 -->
      <v-sheet class="pa-4" color="grey-lighten-5">
        <v-row align="center" justify="center" class="ma-0">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="userInput"
              label="请输入您的学习目标, 例如: '学习人参的鉴别和应用'"
              variant="solo"
              class="elevation-1"
              hide-details
              prepend-inner-icon="mdi-brain"
              @keydown.enter="generatePlan"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-start">
            <v-btn
              color="primary"
              variant="flat"
              @click="generatePlan"
              :loading="isGenerating"
              class="mr-3"
              size="large"
            >
              <v-icon left>mdi-auto-fix</v-icon>
              {{ isGenerating ? '生成中...' : 'AI智能生成' }}
            </v-btn>
            <v-btn
              color="success"
              variant="flat"
              @click="exportToPDF"
              :loading="isExporting"
              :disabled="!learningPath.steps.length"
              size="large"
            >
              <v-icon left>mdi-file-pdf-box</v-icon>
              导出为PDF
            </v-btn>
          </v-col>
        </v-row>
      </v-sheet>
      <v-divider></v-divider>

      <!-- 学习路径展示 -->
      <v-card-text class="pa-md-8 pa-4" id="learning-path-content">
        <!-- 当没有生成路径时的占位符 -->
        <div v-if="!learningPath.steps.length && !isGenerating" class="text-center py-16">
          <v-icon size="80" color="grey-lighten-2">mdi-school-outline</v-icon>
          <h3 class="text-h6 text-grey-darken-1 mt-4">等待您输入学习目标...</h3>
        </div>

        <!-- 加载动画 -->
        <div v-if="isGenerating" class="text-center py-16">
          <Vue3Lottie
            animationLink="https://assets6.lottiefiles.com/packages/lf20_x62chJ.json"
            :height="200"
            :width="200"
          />
          <p class="mt-4 text-grey-darken-1">AI正在为您生成专属学习路径...</p>
        </div>

        <!-- 路径标题 -->
        <div v-if="learningPath.steps.length" class="text-center mb-10">
          <h1 class="text-h4 font-weight-bold text-primary">{{ learningPath.title }}</h1>
          <p class="text-body-1 mt-2 mx-auto" style="max-width: 700px;">{{ learningPath.description }}</p>
        </div>

        <!-- 时间线视图 -->
        <v-timeline v-if="learningPath.steps.length" align="start" side="end">
          <v-timeline-item
            v-for="(step, index) in learningPath.steps"
            :key="index"
            :dot-color="step.completed ? 'green' : 'primary'"
            size="large"
            fill-dot
          >
            <template v-slot:icon>
              <v-icon>{{ step.icon }}</v-icon>
            </template>

            <v-card class="elevation-2" rounded="lg">
              <v-row no-gutters>
                <!-- 左侧图片 -->
                <v-col cols="12" md="4">
                  <v-img
                    v-if="step.imageUrl"
                    :src="step.imageUrl"
                    height="100%"
                    cover
                  >
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                      </div>
                    </template>
                  </v-img>
                </v-col>
                <!-- 右侧内容 -->
                <v-col cols="12" md="8">
                  <div class="d-flex flex-column h-100">
                    <v-card-title class="text-h6 font-weight-bold pt-4">
                      {{ `第 ${index + 1} 步: ${step.title}` }}
                    </v-card-title>
                    <v-card-text class="flex-grow-1">
                      {{ step.description }}
                      <div class="mt-4">
                        <v-chip
                          v-for="tag in step.tags"
                          :key="tag"
                          class="mr-2 mb-2 font-weight-medium"
                          color="blue-darken-4"
                          variant="flat"
                          size="small"
                          label
                        >
                          {{ tag }}
                        </v-chip>
                      </div>
                    </v-card-text>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useChatGPTStore } from '@/stores/chatGPTStore';
import { createCompletionApi } from '@/api/aiApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- 导入Lottie动画组件 ---
import { Vue3Lottie } from "vue3-lottie";

// --- 导入本地图片 ---
import edu1 from '@/assets/edu/edu1.jpg';
import edu2 from '@/assets/edu/edu2.jpg';
import edu3 from '@/assets/edu/edu3.jpg';
import edu4 from '@/assets/edu/edu4.jpg';
import edu5 from '@/assets/edu/edu5.jpg';

// --- 依赖与状态管理 ---
const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();

const userInput = ref('');
const isGenerating = ref(false);
const isExporting = ref(false);
const localImages = [edu1, edu2, edu3, edu4, edu5]; // 本地图片数组

// --- 数据结构定义 ---
interface LearningStep {
  title: string;
  description: string;
  icon: string;
  tags: string[];
  completed: boolean;
  imageUrl?: string;
}

const learningPath = ref<{
  title: string;
  description: string;
  steps: LearningStep[];
}>({
  title: '',
  description: '',
  steps: [],
});

// --- 智能生成学习计划 ---
const generatePlan = async () => {
  if (!userInput.value) {
    snackbarStore.showWarningMessage('请输入您的学习目标！');
    return;
  }
  isGenerating.value = true;
  learningPath.value = { title: '', description: '', steps: [] };

  const prompt = `
    你是一名专业的中医药教学内容规划师。请根据用户提供的学习主题：“${userInput.value}”，生成一个包含3到5个步骤的系统化学习路径。
    你需要为每个步骤提供详细的学习内容和目标，确保内容完整、专业，无需用户再查找外部资源。
    请严格按照以下JSON格式返回，不要包含任何额外的解释或Markdown标记：
    {
      "title": "关于“${userInput.value}”的深度学习路径",
      "description": "一个简洁、激励人心的学习路径总体描述，不超过80个字。",
      "steps": [
        {
          "title": "学习步骤一的标题",
          "description": "详细描述第一步的学习内容和目标，内容需详实，至少100字。",
          "icon": "mdi-numeric-1-box-outline",
          "tags": ["核心概念", "理论基础"]
        },
        {
          "title": "学习步骤二的标题",
          "description": "详细描述第二步的学习内容和目标，内容需详实，至少100字。",
          "icon": "mdi-numeric-2-box-outline",
          "tags": ["实践应用", "案例分析"]
        }
      ]
    }
  `;

  try {
    const response = await createCompletionApi({
      model: chatGPTStore.model,
      messages: [{ role: 'user', content: prompt }],
    }, chatGPTStore.getApiKey);

    const aiContent = response.data.choices[0].message.content;
    const parsedPlan = JSON.parse(aiContent);

    // 为每个步骤循环分配本地图片
    const stepsWithImages = parsedPlan.steps.map((step: Omit<LearningStep, 'imageUrl'>, index: number) => {
      return {
        ...step,
        completed: false,
        imageUrl: localImages[index % localImages.length], // 循环使用图片
      };
    });

    learningPath.value = {
      ...parsedPlan,
      steps: stepsWithImages,
    };

    snackbarStore.showSuccessMessage('已为您生成专属学习路径！');

  } catch (error: any) {
    console.error('AI生成失败:', error);
    snackbarStore.showErrorMessage(error.message || 'AI生成学习计划失败，请检查API Key或网络后重试。');
    learningPath.value = { title: '', description: '', steps: [] };
  } finally {
    isGenerating.value = false;
  }
};

// --- PDF导出功能 (保持不变) ---
const exportToPDF = async () => {
  const content = document.getElementById('learning-path-content');
  if (!content) {
    snackbarStore.showErrorMessage('无法找到要导出的内容！');
    return;
  }
  isExporting.value = true;
  snackbarStore.showInfoMessage('正在生成PDF，请稍候...');
  try {
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const canvasPdfWidth = pdfWidth - 20;
    let renderedHeight = 0;
    while (renderedHeight < imgHeight) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(imgHeight - renderedHeight, (pdfHeight - 20) * (imgWidth / canvasPdfWidth));
      const pageCtx = pageCanvas.getContext('2d');
      if (pageCtx) {
        pageCtx.drawImage(canvas, 0, renderedHeight, imgWidth, pageCanvas.height, 0, 0, imgWidth, pageCanvas.height);
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
        if (renderedHeight > 0) {
          pdf.addPage();
        }
        pdf.addImage(pageData, 'JPEG', 10, 10, canvasPdfWidth, pageCanvas.height * (canvasPdfWidth / imgWidth));
        renderedHeight += pageCanvas.height;
      } else {
        throw new Error('无法获取2D上下文');
      }
    }
    pdf.save(`${learningPath.value.title || '我的学习路径'}.pdf`);
    snackbarStore.showSuccessMessage('PDF导出成功！');
  } catch (error: any) {
    console.error('PDF导出失败:', error);
    snackbarStore.showErrorMessage(`导出失败: ${error.message || error}`);
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
.v-timeline-item .v-card {
  transition: all 0.3s ease-in-out;
}
.v-timeline-item .v-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
}
</style>
