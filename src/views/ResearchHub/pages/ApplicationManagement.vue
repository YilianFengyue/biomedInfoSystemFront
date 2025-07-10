<!--
* @Component: 申请管理页面
* @Description: 教师审核学生的课题申请
-->
<script setup lang="ts">
import { useResearchStore } from "../researchStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
// 🔥 在 script setup 顶部添加：
import { useProfileStore } from "@/stores/profileStore";

const profile = useProfileStore(); 
const userRole = computed(() => {
  const roleVal = profile.user?.role;
  return roleVal === 2 ? 'teacher' : 'student';
});
const researchStore = useResearchStore();
const snackbarStore = useSnackbarStore();

const loading = computed(() => researchStore.applicationsLoading);
const applications = computed(() => researchStore.applications);

// 审核对话框
const reviewDialog = ref(false);
const selectedApplication = ref<any>(null);
const reviewAction = ref<'approve' | 'reject'>('approve');
const reviewComment = ref('');
//加载进度条
const reviewLoading = ref(false);
// 筛选条件
const filterProjectId = ref<number | null>(null);

// 加载申请列表
const loadApplications = async () => {
  try {
    if (userRole.value === 'teacher') {
      researchStore.setUserRole('teacher');
      const params: any = {
        page: 1,
        size: 10
      };
      if (filterProjectId.value) {
        params.projectId = filterProjectId.value;
      }
      await researchStore.fetchPendingApplications(params);
    } else {
      // 学生端加载自己的申请
      researchStore.setUserRole('student');
      await researchStore.fetchMyApplications();
    }
  } catch (error) {
    console.error('Failed to load applications:', error);
  }
};

// 打开审核对话框
const openReviewDialog = (application: any, action: 'approve' | 'reject') => {
  selectedApplication.value = application;
  reviewAction.value = action;
  reviewComment.value = '';
  reviewDialog.value = true;
};

// 提交审核
const submitReview = async () => {
  if (!selectedApplication.value || !reviewComment.value) {
    snackbarStore.showErrorMessage('请填写审核意见');
    return;
  }
  reviewLoading.value = true;  // 添加这行
  try {
    await researchStore.reviewApplication(
      selectedApplication.value.id,
      reviewAction.value,
      reviewComment.value
    );
    
    snackbarStore.showSuccessMessage(
      reviewAction.value === 'approve' ? '申请已通过' : '申请已拒绝'
    );
    
    reviewDialog.value = false;
    await loadApplications();
  } catch (error) {
    console.error('Failed to review application:', error);
  }finally{
    reviewLoading.value = false;  // 添加这行
  };
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };
  return colors[status] || 'grey';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return texts[status] || status;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 监听筛选条件变化
watch(filterProjectId, () => {
  loadApplications();
});

onMounted(() => {
  loadApplications();
});
</script>

<template>
  <v-card elevation="2" class="application-card">
    <!-- 头部工具栏 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon start color="primary">mdi-account-check</v-icon>
        申请管理
      </v-toolbar-title>
      <v-spacer></v-spacer>
      
      <v-text-field
        v-model.number="filterProjectId"
        label="项目ID"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 200px"
        class="mr-2"
      ></v-text-field>
      
      <v-btn
        icon="mdi-refresh"
        variant="text"
        @click="loadApplications"
        :loading="loading"
      ></v-btn>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 申请列表 -->
    <perfect-scrollbar class="application-list-container">
      <v-container fluid class="pa-4">
        <v-row v-if="applications.length > 0">
          <v-col
            v-for="application in applications"
            :key="application.id"
            cols="12"
            md="6"
          >
            <v-card
              elevation="0"
              class="application-item"
            >
              <v-card-title>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-body-1">项目ID: {{ application.projectId }}</span>
                  <v-chip
                    :color="getStatusColor(application.status)"
                    size="small"
                    label
                  >
                    {{ getStatusText(application.status) }}
                  </v-chip>
                </div>
              </v-card-title>
              
              <v-card-text>
                <div class="mb-3">
                  <div class="text-caption text-grey mb-1">学生ID</div>
                  <div class="font-weight-medium">{{ application.studentId }}</div>
                </div>
                
                <div class="mb-3">
                  <div class="text-caption text-grey mb-1">申请理由</div>
                  <div class="text-body-2">{{ application.applicationReason }}</div>
                </div>
                
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <v-icon size="small" color="grey">mdi-calendar</v-icon>
                    <span class="text-caption ml-1">{{ formatDate(application.createdAt) }}</span>
                  </div>
                  
                  <div v-if="application.reviewComment" class="text-caption text-grey">
                    已审核
                  </div>
                </div>
                
                <div v-if="application.reviewComment" class="mt-3 pa-2 bg-grey-lighten-4 rounded">
                  <div class="text-caption text-grey mb-1">审核意见</div>
                  <div class="text-body-2">{{ application.reviewComment }}</div>
                </div>
              </v-card-text>
              
              <v-card-actions v-if="application.status === 'pending' && userRole === 'teacher'">
                <v-spacer></v-spacer>
                <v-btn
                  color="error"
                  variant="text"
                  @click="openReviewDialog(application, 'reject')"
                >
                  拒绝
                </v-btn>
                <v-btn
                  color="success"
                  variant="elevated"
                  @click="openReviewDialog(application, 'approve')"
                >
                  通过
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- 空状态 -->
        <div v-else-if="!loading" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1">mdi-account-clock-outline</v-icon>
          <p class="text-h6 mt-4 text-grey">暂无待审核申请</p>
          <p class="text-body-2 text-grey">所有申请已处理完毕</p>
        </div>
      </v-container>
    </perfect-scrollbar>

    <!-- 审核对话框 -->
    <v-dialog v-model="reviewDialog" max-width="500">
      <v-card>
        <v-toolbar 
          :color="reviewAction === 'approve' ? 'success' : 'error'" 
          dark 
          flat
        >
          <v-toolbar-title>
            {{ reviewAction === 'approve' ? '通过申请' : '拒绝申请' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="reviewDialog = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-4">
          <div class="mb-4">
            <div class="text-caption text-grey mb-1">申请学生</div>
            <div>学生ID: {{ selectedApplication?.studentId }}</div>
          </div>
          
          <div class="mb-4">
            <div class="text-caption text-grey mb-1">申请理由</div>
            <div class="text-body-2">{{ selectedApplication?.applicationReason }}</div>
          </div>
          
          <v-textarea
            v-model="reviewComment"
            :label="reviewAction === 'approve' ? '通过意见' : '拒绝理由'"
            :placeholder="reviewAction === 'approve' 
              ? '请说明通过的理由和对学生的期望...' 
              : '请说明拒绝的理由和建议...'"
            variant="outlined"
            rows="4"
            required
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="reviewDialog = false">取消</v-btn>
          <v-btn
            :color="reviewAction === 'approve' ? 'success' : 'error'"
            variant="elevated"
            @click="submitReview"
            :loading="reviewLoading"
  
            :disabled="!reviewComment"
          >
            确认{{ reviewAction === 'approve' ? '通过' : '拒绝' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped lang="scss">
.application-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  overflow: hidden;
}

.application-list-container {
  flex: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
}

.application-item {
  border: 1px solid #e0e0e0;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.bg-grey-lighten-4 {
  background-color: #f5f5f5;
}
</style>