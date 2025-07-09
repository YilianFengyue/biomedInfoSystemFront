<!--
* @Component: 论文管理页面
* @Description: 学生提交论文，教师评审论文
-->
<script setup lang="ts">
import { useResearchStore } from "../researchStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useProfileStore } from "@/stores/profileStore";   // ← 路径按你项目实际调整


const researchStore = useResearchStore();
const snackbarStore = useSnackbarStore();
const profile = useProfileStore();

const loading = computed(() => researchStore.submissionsLoading);
const submissions = computed(() => researchStore.submissions);
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

// 提交论文对话框
const submitDialog = ref(false);
const paperForm = reactive({
  taskId: null as number | null,
  title: '',
  abstractText: '',
  keywords: '',
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  submissionNotes: ''
});

// 评审对话框
const reviewDialog = ref(false);
const selectedSubmissionId = ref<number | null>(null);
const reviewForm = reactive({
  overallScore: 0,
  contentScore: 0,
  innovationScore: 0,
  methodologyScore: 0,
  writingScore: 0,
  reviewComment: '',
  suggestions: '',
  reviewResult: '',
  isFinal: false
});

const reviewResults = [
  { value: 'accept', text: '接受', color: 'success' },
  { value: 'minor_revision', text: '小修', color: 'warning' },
  { value: 'major_revision', text: '大修', color: 'orange' },
  { value: 'reject', text: '拒绝', color: 'error' }
];

// 加载论文列表
const loadSubmissions = async () => {
  try {
    const role = userRole.value === 'teacher' ? 'teacher' : 'student';
    researchStore.setUserRole(role);
    
    if (role === 'teacher') {
      await researchStore.fetchPendingSubmissions({ page: 1, size: 10 });
    } else {
      // 学生获取自己的提交记录
      const { data } = await researchStore.studentApi.submissions.list();
      if (data.code === 20000) {
        researchStore.submissions = data.data;
      }
    }
  } catch (error) {
    console.error('Failed to load submissions:', error);
  }
};

// 提交论文（学生）
const submitPaper = async () => {
  if (!paperForm.taskId) {
    snackbarStore.showErrorMessage('请选择任务');
    return;
  }
  
  try {
    await researchStore.submitPaper(paperForm.taskId, paperForm);
    snackbarStore.showSuccessMessage('论文提交成功');
    submitDialog.value = false;
    resetPaperForm();
    await loadSubmissions();
  } catch (error) {
    console.error('Failed to submit paper:', error);
  }
};

// 提交评审（教师）
const submitReview = async () => {
  if (!selectedSubmissionId.value) return;
  
  try {
    await researchStore.submitReview({
      submissionId: selectedSubmissionId.value,
      ...reviewForm
    });
    snackbarStore.showSuccessMessage('评审提交成功');
    reviewDialog.value = false;
    resetReviewForm();
    await loadSubmissions();
  } catch (error) {
    console.error('Failed to submit review:', error);
  }
};

// 打开评审对话框
const openReviewDialog = (submissionId: number) => {
  selectedSubmissionId.value = submissionId;
  reviewDialog.value = true;
};

// 重置表单
const resetPaperForm = () => {
  Object.keys(paperForm).forEach(key => {
    (paperForm as any)[key] = '';
  });
};

const resetReviewForm = () => {
  Object.keys(reviewForm).forEach(key => {
    if (key.includes('Score')) {
      (reviewForm as any)[key] = 0;
    } else if (key === 'isFinal') {
      (reviewForm as any)[key] = false;
    } else {
      (reviewForm as any)[key] = '';
    }
  });
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    submitted: 'info',
    reviewing: 'warning',
    approved: 'success',
    needs_revision: 'orange',
    rejected: 'error'
  };
  return colors[status] || 'grey';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    submitted: '已提交',
    reviewing: '评审中',
    approved: '已通过',
    needs_revision: '需修改',
    rejected: '已拒绝'
  };
  return texts[status] || status;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

onMounted(() => {
  loadSubmissions();
});
</script>

<template>
  <v-card elevation="2" class="paper-card">
    <!-- 头部工具栏 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon start color="primary">mdi-file-document-multiple</v-icon>
        论文管理
      </v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- 学生提交论文按钮 -->
      <v-btn
        v-if="userRole === 'student'"
        color="primary"
        prepend-icon="mdi-upload"
        @click="submitDialog = true"
      >
        提交论文
      </v-btn>
      
      <v-btn
        icon="mdi-refresh"
        variant="text"
        @click="loadSubmissions"
        :loading="loading"
      ></v-btn>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 论文列表 -->
    <perfect-scrollbar class="paper-list-container">
      <v-data-table
        :headers="userRole === 'teacher' ? teacherHeaders : studentHeaders"
        :items="submissions"
        :loading="loading"
        class="elevation-0"
        item-value="id"
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            label
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        
        <template v-slot:item.version="{ item }">
          <v-chip size="small" variant="outlined">
            v{{ item.version }}
          </v-chip>
        </template>
        
        <template v-slot:item.fileSize="{ item }">
          {{ formatFileSize(item.fileSize) }}
        </template>
        
        <template v-slot:item.submissionTime="{ item }">
          {{ formatDate(item.submissionTime) }}
        </template>
        
        <template v-slot:item.actions="{ item }">
          <!-- 教师操作 -->
          <template v-if="userRole === 'teacher'">
            <v-btn
              size="small"
              color="primary"
              variant="text"
              @click="openReviewDialog(item.id)"
            >
              评审
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              :href="item.fileUrl"
              target="_blank"
            >
              下载
            </v-btn>
          </template>
          
          <!-- 学生操作 -->
          <template v-else>
            <v-btn
              size="small"
              variant="text"
              @click="$router.push(`/research/submissions/${item.id}/reviews`)"
            >
              查看评审
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              :href="item.fileUrl"
              target="_blank"
            >
              下载
            </v-btn>
          </template>
        </template>
        
        <template v-slot:no-data>
          <div class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1">mdi-file-document-outline</v-icon>
            <p class="text-h6 mt-4 text-grey">暂无论文数据</p>
            <p class="text-body-2 text-grey">
              {{ userRole === 'student' ? '点击上方按钮提交论文' : '等待学生提交论文' }}
            </p>
          </div>
        </template>
      </v-data-table>
    </perfect-scrollbar>

    <!-- 提交论文对话框（学生） -->
    <v-dialog v-model="submitDialog" max-width="700" persistent>
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-toolbar-title>提交论文</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="submitDialog = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-4">
          <v-form @submit.prevent="submitPaper">
            <v-text-field
              v-model.number="paperForm.taskId"
              label="任务ID"
              variant="outlined"
              density="comfortable"
              type="number"
              class="mb-3"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="paperForm.title"
              label="论文标题"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="paperForm.abstractText"
              label="摘要"
              variant="outlined"
              density="comfortable"
              rows="4"
              class="mb-3"
            ></v-textarea>
            
            <v-text-field
              v-model="paperForm.keywords"
              label="关键词（逗号分隔）"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-text-field>
            
            <v-text-field
              v-model="paperForm.fileUrl"
              label="文件URL"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              required
            ></v-text-field>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="paperForm.fileName"
                  label="文件名"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="paperForm.fileSize"
                  label="文件大小（字节）"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-textarea
              v-model="paperForm.submissionNotes"
              label="提交说明"
              variant="outlined"
              density="comfortable"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="submitDialog = false">取消</v-btn>
          <v-btn color="primary" variant="elevated" @click="submitPaper">提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 评审对话框（教师） -->
    <v-dialog v-model="reviewDialog" max-width="800" persistent>
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-toolbar-title>论文评审</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="reviewDialog = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-4">
          <v-form @submit.prevent="submitReview">
            <v-row>
              <v-col cols="12" md="6">
                <v-slider
                  v-model="reviewForm.overallScore"
                  label="总体评分"
                  :max="10"
                  :step="0.5"
                  thumb-label
                  color="primary"
                ></v-slider>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-slider
                  v-model="reviewForm.contentScore"
                  label="内容质量"
                  :max="10"
                  :step="0.5"
                  thumb-label
                  color="primary"
                ></v-slider>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-slider
                  v-model="reviewForm.innovationScore"
                  label="创新性"
                  :max="10"
                  :step="0.5"
                  thumb-label
                  color="primary"
                ></v-slider>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-slider
                  v-model="reviewForm.methodologyScore"
                  label="方法学"
                  :max="10"
                  :step="0.5"
                  thumb-label
                  color="primary"
                ></v-slider>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-slider
                  v-model="reviewForm.writingScore"
                  label="写作质量"
                  :max="10"
                  :step="0.5"
                  thumb-label
                  color="primary"
                ></v-slider>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="reviewForm.reviewResult"
                  :items="reviewResults"
                  item-value="value"
                  item-title="text"
                  label="评审结果"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-textarea
              v-model="reviewForm.reviewComment"
              label="评审意见"
              variant="outlined"
              density="comfortable"
              rows="4"
              class="mb-3"
            ></v-textarea>
            
            <v-textarea
              v-model="reviewForm.suggestions"
              label="修改建议"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-3"
            ></v-textarea>
            
            <v-checkbox
              v-model="reviewForm.isFinal"
              label="最终评审"
              color="primary"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="reviewDialog = false">取消</v-btn>
          <v-btn color="primary" variant="elevated" @click="submitReview">提交评审</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
// 表格列定义
const teacherHeaders = [
  { title: '标题', key: 'title', sortable: true },
  { title: '学生', key: 'studentName', sortable: true },
  { title: '状态', key: 'status', sortable: true },
  { title: '版本', key: 'version', sortable: true },
  { title: '文件大小', key: 'fileSize', sortable: true },
  { title: '提交时间', key: 'submissionTime', sortable: true },
  { title: '操作', key: 'actions', sortable: false }
];

const studentHeaders = [
  { title: '标题', key: 'title', sortable: true },
  { title: '任务', key: 'taskTitle', sortable: true },
  { title: '状态', key: 'status', sortable: true },
  { title: '版本', key: 'version', sortable: true },
  { title: '文件大小', key: 'fileSize', sortable: true },
  { title: '提交时间', key: 'submissionTime', sortable: true },
  { title: '操作', key: 'actions', sortable: false }
];
</script>

<style scoped lang="scss">
.paper-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  overflow: hidden;
}

.paper-list-container {
  flex: 1;
  overflow-y: auto;
  
  :deep(.v-data-table) {
    background-color: transparent;
  }
}
</style>