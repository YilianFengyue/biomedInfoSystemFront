<!--
* @Component: 数据统计页面
* @Description: 显示项目统计数据和成果
-->
<script setup lang="ts">
import { useResearchStore } from "../researchStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useProfileStore } from "@/stores/profileStore";   // ← 路径按你项目实际调整

const researchStore = useResearchStore();
const snackbarStore = useSnackbarStore();
const profile = useProfileStore();

const loading = ref(false);
const selectedProjectId = ref<number | null>(null);
const projectStatistics = ref<any>(null);
const projectAchievements = ref<any[]>([]);

const userRole = computed<'teacher' | 'student'>(() => {
  const val = profile.user?.role;
  return val === 2 || val === 0 ? 'teacher' : 'student';
});
// 获取项目列表用于选择
const projects = computed(() => researchStore.projects);

// 加载项目列表
const loadProjects = async () => {
  try {
    researchStore.setUserRole(userRole.value); // 现在类型完全匹配
    await researchStore.fetchProjects({ page: 1, size: 100 });
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
};

// 加载项目统计数据
const loadStatistics = async () => {
  if (!selectedProjectId.value) return;
  
  loading.value = true;
  try {
    const stats = await researchStore.fetchProjectStatistics(selectedProjectId.value);
    projectStatistics.value = stats;
    
    // 同时加载项目成果
    const { data } = await researchStore.commonApi.getProjectAchievements(selectedProjectId.value);
    if (data.code === 20000) {
      projectAchievements.value = data.data;
    }
  } catch (error) {
    console.error('Failed to load statistics:', error);
    snackbarStore.showErrorMessage('加载统计数据失败');
  } finally {
    loading.value = false;
  }
};

// 获取进度状态颜色
const getProgressStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    ahead: 'success',
    good: 'success',
    normal: 'primary',
    behind: 'warning',
    critical: 'error'
  };
  return colors[status] || 'grey';
};

// 获取进度状态文本
const getProgressStatusText = (status: string) => {
  const texts: Record<string, string> = {
    ahead: '超前',
    good: '良好',
    normal: '正常',
    behind: '滞后',
    critical: '严重滞后'
  };
  return texts[status] || status;
};

// 获取成果类型图标
const getAchievementIcon = (type: string) => {
  const icons: Record<string, string> = {
    '论文': 'mdi-file-document',
    '专利': 'mdi-certificate',
    '软著': 'mdi-copyright',
    '获奖': 'mdi-trophy',
    '标准': 'mdi-file-check'
  };
  return icons[type] || 'mdi-file';
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 监听项目选择变化
watch(selectedProjectId, (newVal) => {
  if (newVal) {
    loadStatistics();
  }
});

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <v-card elevation="2" class="statistics-card">
    <!-- 头部工具栏 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon start color="primary">mdi-chart-box</v-icon>
        数据统计
      </v-toolbar-title>
      <v-spacer></v-spacer>
      
      <v-select
        v-model="selectedProjectId"
        :items="projects"
        item-title="projectName"
        item-value="id"
        label="选择项目"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 300px"
        class="mr-2"
      ></v-select>
      
      <v-btn
        icon="mdi-refresh"
        variant="text"
        @click="loadStatistics"
        :loading="loading"
        :disabled="!selectedProjectId"
      ></v-btn>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 统计内容 -->
    <perfect-scrollbar class="statistics-content">
      <v-container fluid class="pa-6">
        <!-- 未选择项目提示 -->
        <div v-if="!selectedProjectId" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1">mdi-chart-line</v-icon>
          <p class="text-h6 mt-4 text-grey">请选择一个项目查看统计数据</p>
        </div>
        
        <!-- 统计数据 -->
        <template v-else-if="projectStatistics">
          <!-- 概览卡片 -->
          <v-row class="mb-6">
            <v-col cols="12">
              <v-card elevation="0" class="overview-card">
                <v-card-title>
                  <h3 class="text-h5">{{ projectStatistics.projectName }}</h3>
                  <v-spacer></v-spacer>
                  <v-chip
                    :color="getProgressStatusColor(projectStatistics.progressStatus)"
                    label
                  >
                    进度{{ getProgressStatusText(projectStatistics.progressStatus) }}
                  </v-chip>
                </v-card-title>
                
                <v-card-text>
                  <v-progress-linear
                    :model-value="projectStatistics.completionRate"
                    height="20"
                    rounded
                    :color="projectStatistics.completionRate === 100 ? 'success' : 'primary'"
                    class="mb-2"
                  >
                    <template v-slot:default="{ value }">
                      <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                  </v-progress-linear>
                  <p class="text-caption text-grey">项目整体完成进度</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 统计指标 -->
          <v-row class="mb-6">
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="0" class="stat-item text-center">
                <v-card-text>
                  <v-icon size="40" color="primary" class="mb-2">mdi-clipboard-list</v-icon>
                  <div class="text-h3 font-weight-bold">{{ projectStatistics.totalTasks }}</div>
                  <div class="text-caption">总任务数</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="0" class="stat-item text-center">
                <v-card-text>
                  <v-icon size="40" color="success" class="mb-2">mdi-check-circle</v-icon>
                  <div class="text-h3 font-weight-bold">{{ projectStatistics.completedTasks }}</div>
                  <div class="text-caption">已完成任务</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="0" class="stat-item text-center">
                <v-card-text>
                  <v-icon size="40" color="info" class="mb-2">mdi-account-group</v-icon>
                  <div class="text-h3 font-weight-bold">{{ projectStatistics.totalMembers }}</div>
                  <div class="text-caption">项目成员</div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="0" class="stat-item text-center">
                <v-card-text>
                  <v-icon size="40" color="warning" class="mb-2">mdi-file-document-multiple</v-icon>
                  <div class="text-h3 font-weight-bold">{{ projectStatistics.totalSubmissions }}</div>
                  <div class="text-caption">论文提交</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 任务完成率图表 -->
          <v-row class="mb-6">
            <v-col cols="12" md="6">
              <v-card elevation="0">
                <v-card-title>
                  <v-icon start>mdi-chart-donut</v-icon>
                  任务完成情况
                </v-card-title>
                <v-card-text>
                  <div class="d-flex align-center justify-center" style="height: 200px;">
                    <div class="text-center">
                      <v-progress-circular
                        :model-value="(projectStatistics.completedTasks / projectStatistics.totalTasks) * 100"
                        :size="150"
                        :width="15"
                        color="success"
                      >
                        <span class="text-h4">
                          {{ Math.round((projectStatistics.completedTasks / projectStatistics.totalTasks) * 100) }}%
                        </span>
                      </v-progress-circular>
                      <p class="mt-4 text-body-2">
                        已完成 {{ projectStatistics.completedTasks }} / {{ projectStatistics.totalTasks }} 个任务
                      </p>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card elevation="0">
                <v-card-title>
                  <v-icon start>mdi-chart-bar</v-icon>
                  论文审核情况
                </v-card-title>
                <v-card-text>
                  <div class="d-flex align-center justify-center" style="height: 200px;">
                    <div class="text-center">
                      <v-progress-circular
                        :model-value="(projectStatistics.approvedSubmissions / projectStatistics.totalSubmissions) * 100"
                        :size="150"
                        :width="15"
                        color="primary"
                      >
                        <span class="text-h4">
                          {{ Math.round((projectStatistics.approvedSubmissions / projectStatistics.totalSubmissions) * 100) }}%
                        </span>
                      </v-progress-circular>
                      <p class="mt-4 text-body-2">
                        已通过 {{ projectStatistics.approvedSubmissions }} / {{ projectStatistics.totalSubmissions }} 篇论文
                      </p>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 项目成果 -->
          <v-card elevation="0" v-if="projectAchievements.length > 0">
            <v-card-title>
              <v-icon start>mdi-trophy</v-icon>
              项目成果
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="achievement in projectAchievements"
                  :key="achievement.id"
                  class="achievement-item"
                >
                  <template v-slot:prepend>
                    <v-icon :color="achievement.achievementType === '论文' ? 'primary' : 'success'">
                      {{ getAchievementIcon(achievement.achievementType) }}
                    </v-icon>
                  </template>
                  
                  <v-list-item-title>
                    {{ achievement.title }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle>
                    <span class="mr-3">{{ achievement.authors }}</span>
                    <span class="mr-3">{{ achievement.publication }}</span>
                    <span>{{ formatDate(achievement.publishDate) }}</span>
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <div class="text-right">
                      <v-chip
                        size="small"
                        color="orange"
                        variant="outlined"
                        v-if="achievement.impactFactor"
                      >
                        IF: {{ achievement.impactFactor }}
                      </v-chip>
                      <v-chip
                        size="small"
                        color="info"
                        variant="outlined"
                        v-if="achievement.citationCount"
                        class="ml-2"
                      >
                        引用: {{ achievement.citationCount }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </template>
      </v-container>
    </perfect-scrollbar>
  </v-card>
</template>

<style scoped lang="scss">
.statistics-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  overflow: hidden;
}

.statistics-content {
  flex: 1;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  .v-card-title,
  .v-card-text {
    color: white;
  }
  
  .text-caption {
    color: rgba(255, 255, 255, 0.8) !important;
  }
}

.stat-item {
  border: 1px solid #e0e0e0;
  border-radius: 12px !important;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.achievement-item {
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9f9f9;
  }
}
</style>