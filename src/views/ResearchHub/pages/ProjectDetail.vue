<!--
* @Component: 项目详情页面
* @Description: 显示项目详细信息
-->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useResearchStore } from "../researchStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
// import{prof}
import { useProfileStore } from "@/stores/profileStore";  
const profile = useProfileStore();
const route = useRoute();
const router = useRouter();
const researchStore = useResearchStore();
const snackbarStore = useSnackbarStore();
// const userStore = useUserStore();

const projectId = computed(() => Number(route.params.id));
const project = computed(() => researchStore.currentProject);
const userRole = computed<'admin' | 'student' | 'teacher'>(() => {
  const roleVal = profile.user?.role;
  switch (roleVal) {
    case 0:
      return "admin";
    case 2:
      return "teacher";
    default:
      return "student";
  }
});
const loading = ref(false);

// 申请对话框
const applyDialog = ref(false);
const applicationReason = ref('');

// 添加 loading 状态
const applyLoading = ref(false);

//申请状态检查
const hasApplied = ref(false);
const applicationStatus = ref('');

// 检查是否已申请过该课题
const checkApplicationStatus = async () => {
  if (userRole.value === 'student') {
    try {
      const { data } = await researchStore.studentApi.projects.getApplications();
      if (data.code === 20000) {
        const existingApp = data.data.find(app => app.projectId === projectId.value);
        if (existingApp) {
          hasApplied.value = true;
          applicationStatus.value = existingApp.status;
        }
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    }
  }
};

// 加载项目详情
const loadProject = async () => {
  loading.value = true;
  try {
    const role = userRole.value === 'teacher' ? 'teacher' : 'student';
    researchStore.setUserRole(role);
    await researchStore.fetchProjectDetail(projectId.value);
    // 加载完项目后检查申请状态
    
    await checkApplicationStatus();
  } catch (error) {
    console.error('Failed to load project:', error);
    snackbarStore.showErrorMessage('加载项目详情失败');
  } finally {
    loading.value = false;
  }
};

// 申请加入项目（学生）
const applyForProject = async () => {
  if (!applicationReason.value) {
    snackbarStore.showErrorMessage('请填写申请理由');
    return;
  }
  
  applyLoading.value = true;
  try {
    await researchStore.applyForProject(projectId.value, applicationReason.value);
    snackbarStore.showSuccessMessage('申请已提交');
    applyDialog.value = false;
    applicationReason.value = '';
    
    // 更新申请状态
    hasApplied.value = true;
    applicationStatus.value = 'pending';
  } catch (error) {
    console.error('Failed to apply for project:', error);
  } finally {
    applyLoading.value = false;
  }
};

// 格式化货币
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(amount);
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    completed: 'grey',
    pending: 'warning',
    suspended: 'error'
  };
  return colors[status] || 'grey';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    pending: '待启动',
    suspended: '已暂停'
  };
  return texts[status] || status;
};

onMounted(() => {
  loadProject();
});
</script>

<template>
  <v-card elevation="2" class="project-detail-card" :loading="loading">
    <!-- 头部 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        @click="router.back()"
      ></v-btn>
      <v-toolbar-title class="text-h6 font-weight-bold">
        项目详情
      </v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- 学生申请按钮 -->
        <template v-if="userRole === 'student'">
          <v-btn
            v-if="!hasApplied"
            color="primary"
            @click="applyDialog = true"
          >
            申请加入
          </v-btn>
          <v-chip
            v-else
            :color="applicationStatus === 'approved' ? 'success' : 
                  applicationStatus === 'rejected' ? 'error' : 'warning'"
            label
          >
            {{ applicationStatus === 'approved' ? '已通过' : 
              applicationStatus === 'rejected' ? '已拒绝' : '待审核' }}
          </v-chip>
        </template>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 项目信息 -->
    <perfect-scrollbar class="project-content" v-if="project">
      <v-container fluid class="pa-6">
        <!-- 基本信息卡片 -->
        <v-card elevation="0" class="mb-6">
          <v-card-title class="d-flex align-center justify-space-between">
            <h2 class="text-h5">{{ project.projectName }}</h2>
            <v-chip
              :color="getStatusColor(project.status)"
              label
            >
              {{ getStatusText(project.status) }}
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="info-group">
                  <div class="info-label">项目编号</div>
                  <div class="info-value">{{ project.projectCode }}</div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="info-group">
                  <div class="info-label">项目类型</div>
                  <div class="info-value">{{ project.projectType }}</div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="info-group">
                  <div class="info-label">资金来源</div>
                  <div class="info-value">{{ project.fundingSource }}</div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="info-group">
                  <div class="info-label">资金金额</div>
                  <div class="info-value text-primary font-weight-bold">
                    {{ formatCurrency(project.fundingAmount) }}
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="info-group">
                  <div class="info-label">研究领域</div>
                  <div class="info-value">{{ project.researchField }}</div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="info-group">
                  <div class="info-label">项目周期</div>
                  <div class="info-value">
                    {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 项目摘要 -->
        <v-card elevation="0" class="mb-6" v-if="project.abstractText">
          <v-card-title>
            <v-icon start>mdi-text-box-outline</v-icon>
            项目摘要
          </v-card-title>
          <v-card-text>
            <p class="text-body-1">{{ project.abstractText }}</p>
          </v-card-text>
        </v-card>

        <!-- 关键词 -->
        <v-card elevation="0" class="mb-6" v-if="project.keywords">
          <v-card-title>
            <v-icon start>mdi-tag-multiple</v-icon>
            关键词
          </v-card-title>
          <v-card-text>
            <v-chip
              v-for="keyword in project.keywords.split(',')"
              :key="keyword"
              class="ma-1"
              variant="outlined"
              color="primary"
            >
              {{ keyword.trim() }}
            </v-chip>
          </v-card-text>
        </v-card>

        <!-- 统计信息 -->
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" class="stat-card text-center pa-4">
              <v-icon size="48" color="primary">mdi-account-group</v-icon>
              <div class="text-h4 font-weight-bold mt-2">{{ project.memberCount }}</div>
              <div class="text-caption">项目成员</div>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" class="stat-card text-center pa-4">
              <v-icon size="48" color="success">mdi-clipboard-list</v-icon>
              <div class="text-h4 font-weight-bold mt-2">{{ project.taskCount }}</div>
              <div class="text-caption">研究任务</div>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" class="stat-card text-center pa-4">
              <v-icon size="48" color="warning">mdi-calendar-range</v-icon>
              <div class="text-h4 font-weight-bold mt-2">
                {{ Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) }}
              </div>
              <div class="text-caption">剩余天数</div>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="0" class="stat-card text-center pa-4">
              <v-icon size="48" color="info">mdi-progress-check</v-icon>
              <div class="text-h4 font-weight-bold mt-2">0%</div>
              <div class="text-caption">完成进度</div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </perfect-scrollbar>

    <!-- 申请对话框（学生） -->
    <v-dialog v-model="applyDialog" max-width="600">
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-toolbar-title>申请加入项目</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="applyDialog = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-4">
          <div class="mb-4">
            <div class="text-caption text-grey mb-1">申请项目</div>
            <div class="font-weight-medium">{{ project?.projectName }}</div>
          </div>
          
          <v-textarea
            v-model="applicationReason"
            label="申请理由"
            placeholder="请说明您想加入该项目的理由，包括您的相关背景、技能和期望..."
            variant="outlined"
            rows="6"
            required
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="applyDialog = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="applyForProject"
            :loading="applyLoading"
            :disabled="!applicationReason"
          >
            提交申请
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped lang="scss">
.project-detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  overflow: hidden;
}

.project-content {
  flex: 1;
  overflow-y: auto;
}

.info-group {
  margin-bottom: 16px;
  
  .info-label {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 4px;
  }
  
  .info-value {
    font-size: 1rem;
    font-weight: 500;
  }
}

.stat-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px !important;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}
</style>