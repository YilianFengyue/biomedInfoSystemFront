<!--
* @Component: 任务管理页面
* @Description: 显示和管理研究任务
-->
<script setup lang="ts">
import { useResearchStore } from "../researchStore";
import { useSnackbarStore } from "@/stores/snackbarStore";

import { useProfileStore } from "@/stores/profileStore";   
const profile = useProfileStore();
const researchStore = useResearchStore();
const snackbarStore = useSnackbarStore();


const loading = computed(() => researchStore.tasksLoading);
const tasks = computed(() => researchStore.tasks);
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

// 创建任务对话框
const createDialog = ref(false);
const taskForm = reactive({
  projectId: null,
  studentId: null,
  title: '',
  description: '',
  requirements: '',
  deadline: '',
  priority: 'medium'
});

// 更新进度对话框
const progressDialog = ref(false);
const selectedTaskId = ref<number | null>(null);
const progressContent = ref('');

// 状态和优先级选项
const priorityOptions = [
  { value: 'low', text: '低', color: 'success' },
  { value: 'medium', text: '中', color: 'warning' },
  { value: 'high', text: '高', color: 'error' }
];

const statusOptions = [
  { value: 'assigned', text: '已分配', color: 'grey' },
  { value: 'in_progress', text: '进行中', color: 'info' },
  { value: 'submitted', text: '已提交', color: 'success' },
  { value: 'completed', text: '已完成', color: 'primary' }
];

// 获取状态颜色
const getStatusColor = (status: string) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option?.color || 'grey';
};

// 获取优先级颜色
const getPriorityColor = (priority: string) => {
  const option = priorityOptions.find(opt => opt.value === priority);
  return option?.color || 'grey';
};

// 加载任务列表
const loadTasks = async () => {
  try {
    const role = userRole.value === 'teacher' ? 'teacher' : 'student';
    researchStore.setUserRole(role);
    
    await researchStore.fetchTasks({
      page: 1,
      size: 10
    });
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
};

// 创建任务（教师）
const createTask = async () => {
  try {
    await researchStore.createTask(taskForm);
    snackbarStore.showSuccessMessage('任务创建成功');
    createDialog.value = false;
    resetTaskForm();
    await loadTasks();
  } catch (error) {
    console.error('Failed to create task:', error);
  }
};

// 更新任务状态（学生）
const updateTaskStatus = async (taskId: number, status: string) => {
  try {
    await researchStore.updateTaskStatus(taskId, status);
    snackbarStore.showSuccessMessage('任务状态更新成功');
    await loadTasks();
  } catch (error) {
    console.error('Failed to update task status:', error);
  }
};

// 更新任务进度（学生）
const updateProgress = async () => {
  if (!selectedTaskId.value || !progressContent.value) return;
  
  try {
    await researchStore.updateTaskProgress(selectedTaskId.value, progressContent.value);
    snackbarStore.showSuccessMessage('进度更新成功');
    progressDialog.value = false;
    progressContent.value = '';
    selectedTaskId.value = null;
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
};

// 打开进度更新对话框
const openProgressDialog = (taskId: number) => {
  selectedTaskId.value = taskId;
  progressDialog.value = true;
};

// 重置表单
const resetTaskForm = () => {
  Object.keys(taskForm).forEach(key => {
    (taskForm as any)[key] = key === 'priority' ? 'medium' : '';
  });
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

onMounted(() => {
  loadTasks();
});
</script>

<template>
  <v-card elevation="2" class="task-card">
    <!-- 头部工具栏 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon start color="primary">mdi-clipboard-list</v-icon>
        任务管理
      </v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- 教师创建任务按钮 -->
      <v-btn
        v-if="userRole === 'teacher'"
        color="primary"
        prepend-icon="mdi-plus"
        @click="createDialog = true"
      >
        创建任务
      </v-btn>
      
      <v-btn
        icon="mdi-refresh"
        variant="text"
        @click="loadTasks"
        :loading="loading"
      ></v-btn>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 任务列表 -->
    <perfect-scrollbar class="task-list-container">
      <v-container fluid class="pa-4">
        <v-row v-if="tasks.length > 0">
          <v-col
            v-for="task in tasks"
            :key="task.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card
              elevation="0"
              class="task-item"
              :class="{ 'border-warning': task.priority === 'high' }"
            >
              <v-card-title>
                <div class="d-flex align-center justify-space-between">
                  <v-chip
                    :color="getStatusColor(task.status)"
                    size="small"
                    label
                  >
                    {{ statusOptions.find(s => s.value === task.status)?.text }}
                  </v-chip>
                  <v-chip
                    :color="getPriorityColor(task.priority)"
                    size="small"
                    variant="outlined"
                  >
                    {{ priorityOptions.find(p => p.value === task.priority)?.text }}优先级
                  </v-chip>
                </div>
              </v-card-title>
              
              <v-card-text>
                <h3 class="text-subtitle-1 font-weight-bold mb-2">
                  {{ task.title }}
                </h3>
                
                <p class="text-body-2 text-grey-darken-1 mb-3">
                  {{ task.description }}
                </p>
                
                <div class="task-info">
                  <div class="info-item">
                    <v-icon size="small" color="grey">mdi-folder</v-icon>
                    <span>{{ task.projectName || '未知项目' }}</span>
                  </div>
                  
                  <div class="info-item">
                    <v-icon size="small" color="grey">mdi-calendar-clock</v-icon>
                    <span>截止：{{ formatDate(task.deadline) }}</span>
                  </div>
                  
                  <div class="info-item">
                    <v-icon size="small" color="grey">mdi-progress-check</v-icon>
                    <span>进度：{{ task.progress }}%</span>
                  </div>
                </div>
                
                <!-- 进度条 -->
                <v-progress-linear
                  :model-value="task.progress"
                  height="6"
                  rounded
                  class="mt-3"
                  :color="task.progress === 100 ? 'success' : 'primary'"
                ></v-progress-linear>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions>
                <!-- 学生操作 -->
                <template v-if="userRole === 'student'">
                  <v-menu v-if="task.status !== 'completed'">
                    <template v-slot:activator="{ props }">
                      <v-btn
                        size="small"
                        variant="text"
                        v-bind="props"
                      >
                        更新状态
                        <v-icon end>mdi-menu-down</v-icon>
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        v-for="status in statusOptions"
                        :key="status.value"
                        @click="updateTaskStatus(task.id, status.value)"
                      >
                        <v-list-item-title>{{ status.text }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  
                  <v-btn
                    size="small"
                    variant="text"
                    @click="openProgressDialog(task.id)"
                  >
                    更新进度
                  </v-btn>
                </template>
                
                <!-- 教师操作 -->
                <template v-else>
                  <v-btn
                    size="small"
                    variant="text"
                    @click="$router.push(`/research/tasks/${task.id}`)"
                  >
                    查看详情
                  </v-btn>
                </template>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- 空状态 -->
        <div v-else-if="!loading" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1">mdi-clipboard-text-outline</v-icon>
          <p class="text-h6 mt-4 text-grey">暂无任务数据</p>
          <p class="text-body-2 text-grey">
            {{ userRole === 'teacher' ? '点击上方按钮创建新任务' : '等待教师分配任务' }}
          </p>
        </div>
      </v-container>
    </perfect-scrollbar>

    <!-- 创建任务对话框（教师） -->
    <v-dialog v-model="createDialog" max-width="600">
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-toolbar-title>创建任务</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="createDialog = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-4">
          <v-form @submit.prevent="createTask">
            <v-text-field
              v-model="taskForm.title"
              label="任务标题"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="taskForm.description"
              label="任务描述"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-3"
            ></v-textarea>
            
            <v-textarea
              v-model="taskForm.requirements"
              label="任务要求"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-3"
            ></v-textarea>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="taskForm.projectId"
                  label="项目ID"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="taskForm.studentId"
                  label="学生ID"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="taskForm.deadline"
                  label="截止日期"
                  variant="outlined"
                  density="comfortable"
                  type="date"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="taskForm.priority"
                  :items="priorityOptions"
                  item-value="value"
                  item-title="text"
                  label="优先级"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" variant="elevated" @click="createTask">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 更新进度对话框（学生） -->
    <v-dialog v-model="progressDialog" max-width="500">
      <v-card>
        <v-toolbar color="primary" dark flat>
          <v-toolbar-title>更新任务进度</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="progressDialog = false"></v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-4">
          <v-textarea
            v-model="progressContent"
            label="进度说明"
            placeholder="请描述任务的最新进展..."
            variant="outlined"
            rows="4"
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="progressDialog = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="updateProgress"
            :disabled="!progressContent"
          >
            提交
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped lang="scss">
.task-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  overflow: hidden;
}

.task-list-container {
  flex: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
}

.task-item {
  border: 1px solid #e0e0e0;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &.border-warning {
    border-color: #ff6b6b;
  }
  
  .task-info {
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 0.875rem;
      color: #666;
      
      .v-icon {
        opacity: 0.7;
      }
    }
  }
}
</style>