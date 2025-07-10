<!--
* @Component: 课题列表
* @Description: 显示科研课题列表，支持搜索和筛选
-->
<script setup lang="ts">
import { useResearchStore } from "~/src/views/ResearchHub/researchStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
// import { useUserStore } from "@/stores/userStore";
import { useProfileStore } from "@/stores/profileStore"; 
interface Props {
  researchFieldFilter?: string;
}

const props = defineProps<Props>();

interface Project {
  id: number;
  projectName: string;
  projectCode: string;
  projectType: string;
  fundingSource: string;
  fundingAmount: number;
  principalInvestigatorName: string | null;
  startDate: string;
  endDate: string;
  status: string;
  researchField: string;
  createdAt: string;
  memberCount: number;
  taskCount: number;
}

const router = useRouter();
const researchStore = useResearchStore();
const snackbarStore = useSnackbarStore();
// const userStore = useUserStore();
const profileStore = useProfileStore(); //  <-- 2. 实例化 profileStore
const searchKey = ref('');
const selectedType = ref('');
const selectedField = ref(props.researchFieldFilter || '');
const loading = computed(() => researchStore.projectsLoading);
const projects = computed(() => researchStore.projects);

const projectTypes = [
  '国家自然科学基金',
  '国家社会科学基金',
  '教育部人文社科基金',
  '省部级科研项目',
  '重庆市科技计划',
  '企业合作',
  '校级科研项目'
];

const researchFields = [
  '中医药网络药理学',
  '中药资源学',
  '中医信息学',
  '中医临床研究'
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'primary',
    completed: 'grey',
    pending: 'warning',
    suspended: 'error'
  };
  return colors[status] || 'grey';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    pending: '待启动',
    suspended: '已暂停'
  };
  return texts[status] || status;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 过滤项目列表
const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchKey.value.toLowerCase()) ||
                         project.projectCode.toLowerCase().includes(searchKey.value.toLowerCase());
    const matchesType = !selectedType.value || project.projectType === selectedType.value;
    const matchesField = !selectedField.value || project.researchField === selectedField.value;
    
    return matchesSearch && matchesType && matchesField;
  });
});

// 加载项目列表
const loadProjects = async () => {
  try {
    // 3. 使用您提供的正确角色判断逻辑
    const roleVal = profileStore.user?.role;
    let userRole: 'teacher' | 'student' = 'student'; // 默认为学生
    if (roleVal === 2) {
      userRole = 'teacher';
    }
    researchStore.setUserRole(userRole);

    // 构建查询参数 (这部分逻辑不变)
    const params: any = {
      page: 1,
      size: 10
    };
    if (searchKey.value) {
      params.keyword = searchKey.value;
    }
    if (selectedType.value) {
      params.projectType = selectedType.value;
    }
    if (selectedField.value) {
      params.researchField = selectedField.value;
    }

    // 调用 store action (这部分逻辑不变)
    await researchStore.fetchProjects(params);
     console.log('Projects loaded:', researchStore.projects);
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
};

const navigateToProject = (projectId: number) => {
  router.push(`/research/projects/${projectId}`);
};

// 监听搜索条件变化
watch([searchKey, selectedType, selectedField], () => {
  loadProjects();
});

// 监听传入的领域筛选变化
watch(() => props.researchFieldFilter, (newVal) => {
  if (newVal) {
    selectedField.value = newVal;
  }
});

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <v-card elevation="2" class="project-list-card">
    <!-- 头部工具栏 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon start color="primary">mdi-folder-multiple</v-icon>
        科研课题列表
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        @click="loadProjects"
        :loading="loading"
      ></v-btn>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 搜索和筛选栏 -->
    <div class="pa-4">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchKey"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            prepend-inner-icon="mdi-magnify"
            placeholder="搜索课题名称或编号..."
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="selectedType"
            :items="projectTypes"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            placeholder="课题类型"
          ></v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="selectedField"
            :items="researchFields"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            placeholder="研究领域"
          ></v-select>
        </v-col>
      </v-row>
    </div>

    <!-- 课题列表 -->
    <v-divider></v-divider>
    
    <perfect-scrollbar class="project-list-container">
      <v-container fluid class="pa-4">
        <v-row>
          <v-col
            v-for="project in filteredProjects"
            :key="project.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card
              elevation="0"
              class="project-card"
              @click="navigateToProject(project.id)"
            >
              <v-card-title>
                <div class="d-flex align-center justify-space-between">
                  <v-chip
                    :color="getStatusColor(project.status)"
                    size="small"
                    label
                  >
                    {{ getStatusText(project.status) }}
                  </v-chip>
                  <span class="text-caption text-grey">{{ project.projectCode }}</span>
                </div>
              </v-card-title>
              
              <v-card-text>
                <h3 class="text-subtitle-1 font-weight-bold mb-2 project-title">
                  {{ project.projectName }}
                </h3>
                
                <div class="project-info">
                  <div class="info-item">
                    <v-icon size="small" color="grey">mdi-shape</v-icon>
                    <span>{{ project.projectType }}</span>
                  </div>
                  
                  <div class="info-item">
                    <v-icon size="small" color="grey">mdi-flask</v-icon>
                    <span>{{ project.researchField }}</span>
                  </div>
                  
                  <div class="info-item">
                    <v-icon size="small" color="grey">mdi-currency-cny</v-icon>
                    <span class="font-weight-medium">{{ formatCurrency(project.fundingAmount) }}</span>
                  </div>
                  
                  <div class="info-item">
                    <v-icon size="small" color="grey">mdi-calendar-range</v-icon>
                    <span>{{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}</span>
                  </div>
                </div>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions>
                <v-chip size="small" variant="text" prepend-icon="mdi-account-group">
                  {{ project.memberCount }} 成员
                </v-chip>
                <v-chip size="small" variant="text" prepend-icon="mdi-clipboard-list">
                  {{ project.taskCount }} 任务
                </v-chip>
                <v-spacer></v-spacer>
                <v-btn
                  icon="mdi-arrow-right"
                  size="small"
                  variant="text"
                  color="primary"
                ></v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- 空状态 -->
        <div v-if="filteredProjects.length === 0 && !loading" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1">mdi-folder-open-outline</v-icon>
          <p class="text-h6 mt-4 text-grey">暂无课题数据</p>
          <p class="text-body-2 text-grey">请调整筛选条件或创建新课题</p>
        </div>
      </v-container>
    </perfect-scrollbar>
  </v-card>
</template>

<style scoped lang="scss">
.project-list-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 5px !important;
  overflow: hidden;
}

.project-list-container {
  flex: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
}

.project-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e0e0e0;
  border-radius: 12px !important;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: transparent;
    
    .project-title {
      color: #BCA881 ;
    }
  }
  
  .project-title {
    line-height: 1.4;
    transition: color 0.3s;
  }
  
  .project-info {
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.875rem;
      color: #666;
      
      .v-icon {
        opacity: 0.7;
      }
    }
  }
}
</style>