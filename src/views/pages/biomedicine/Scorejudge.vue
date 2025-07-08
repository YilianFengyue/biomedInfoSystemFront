<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { useProfileStore } from '@/stores/profileStore';
import { useSnackbarStore } from '@/stores/snackbarStore';

// --- Pinia Stores ---
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();

// --- Interfaces ---
interface DisplayResource {
  id: number;
  type: 'text' | 'video';
  title: string;
}

interface Lesson {
    id: number;
    title: string;
    contentType: 'video' | 'text';
    resourceUrl: string;
}

interface Chapter {
    id: number;
    title: string;
    lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  teacherName: string;
  chapters?: Chapter[]; 
  detailsLoaded: boolean;
  loadingDetails: boolean;
}

// NEW: Interface for evaluation records from the backend
interface Evaluation {
  id: number;
  userId: number;
  periodId: number;
  evaluatorId: number;
  totalScore: number;
  weightedScore?: number;
  ranking?: number;
  level?: string;
  status: 'draft' | 'submitted' | 'approved';
  comments: string;
}

interface Teacher {
  id: number;
  username: string;
  avatar: string;
  profile?: {
    bio?: string;
  };
  courses?: Course[];
  resources?: DisplayResource[];
  // This will be synced with the evaluation object
  performanceScore: number; 
  // This will hold the full evaluation record for a teacher
  evaluation: Evaluation | null;
  detailsLoaded: boolean;
  loadingDetails: boolean;
  errorDetails: string | null;
}

// --- Component State ---
const teachers = ref<Teacher[]>([]);
const allCourses = ref<Course[]>([]);
const allEvaluations = ref<Evaluation[]>([]); // Store all evaluation records
const loading = ref(true);
const error = ref<string | null>(null);
const teacherPanel = ref<number | undefined>(undefined);
const coursePanels = ref<number[]>([]);

// --- User Role Check ---
const currentUserRole = computed(() => profileStore.user?.role);
const canEvaluate = computed(() => currentUserRole.value === 3);

// --- Component Methods ---

const fetchTeachers = async () => {
  try {
    const response = await axios.get('/api/users/teachers');
    if (response.data && Array.isArray(response.data.data)) {
      teachers.value = response.data.data.map((teacher: any) => ({
        id: teacher.id,
        username: teacher.username,
        avatar: teacher.avatar,
        profile: teacher.profile || {},
        performanceScore: 80, // Default score
        evaluation: null, // Initialize evaluation as null
        detailsLoaded: false,
        loadingDetails: false,
        errorDetails: null,
      }));
    } else {
      throw new Error('教师数据格式不正确。');
    }
  } catch (err) {
    console.error("Failed to fetch teachers:", err);
    throw new Error('无法加载教师列表。');
  }
};

const fetchAllCourses = async () => {
  try {
    const response = await axios.get('/api/courses');
    if (response.data && Array.isArray(response.data.data)) {
      allCourses.value = response.data.data.map((c: any) => ({
          ...c,
          detailsLoaded: false,
          loadingDetails: false,
      }));
    } else {
      allCourses.value = [];
    }
  } catch (err) {
    console.error("Failed to fetch courses:", err);
    throw new Error('无法加载课程数据。');
  }
};

// NEW: Fetch all existing evaluation records
const fetchEvaluations = async () => {
    try {
        const response = await axios.get('/api/evaluations');
        if (response.data && Array.isArray(response.data.data)) {
            allEvaluations.value = response.data.data;
        } else {
            allEvaluations.value = [];
        }
    } catch (err) {
        console.error("Failed to fetch evaluations:", err);
        throw new Error('无法加载评价记录。');
    }
}

// NEW: Merge evaluation data into teacher objects
const mergeEvaluationData = () => {
    teachers.value.forEach(teacher => {
        const foundEvaluation = allEvaluations.value.find(e => e.userId === teacher.id);
        if (foundEvaluation) {
            teacher.evaluation = { ...foundEvaluation };
            // Sync the slider with the fetched score
            teacher.performanceScore = foundEvaluation.totalScore;
        }
    });
}


const fetchCourseDetails = async (course: Course) => {
    if (course.detailsLoaded) return;
    course.loadingDetails = true;
    try {
        const response = await axios.get(`/api/courses/${course.id}`);
        if (response.data && response.data.data) {
            course.chapters = response.data.data.chapters;
            course.detailsLoaded = true;
        }
    } catch (err) {
        console.error(`Failed to fetch details for course ${course.id}:`, err);
        snackbarStore.showErrorMessage(`无法加载课程 "${course.title}" 的章节信息。`);
    } finally {
        course.loadingDetails = false;
    }
}

const fetchTeacherDetails = async (teacher: Teacher) => {
  if (teacher.detailsLoaded) return;
  teacher.loadingDetails = true;
  teacher.errorDetails = null;
  try {
    teacher.courses = allCourses.value.filter(course => course.teacherName === teacher.username);
    const resourcesRes = await axios.get(`/api/users/${teacher.id}/resources`);
    if (resourcesRes.data && Array.isArray(resourcesRes.data.data)) {
      teacher.resources = resourcesRes.data.data.map((apiResource: any) => {
        const resourceType = apiResource.resourceType.toLowerCase();
        return {
          id: apiResource.id,
          type: resourceType,
          title: apiResource.title,
          description: `一个关于 "${apiResource.title}" 的资源。`,
          authorName: teacher.username,
          createdAt: new Date(apiResource.createdAt).toLocaleDateString(),
          detailUrl: resourceType === 'video' 
            ? `/biomedicine/VideoDetail/${apiResource.id}` 
            : `/biomedicine/resource-detail/${apiResource.id}`
        };
      });
    } else {
      teacher.resources = [];
    }
    teacher.detailsLoaded = true;
  } catch (err) {
    console.error(`Failed to fetch details for teacher ${teacher.id}:`, err);
    teacher.errorDetails = '无法加载此教师的详细信息。';
    snackbarStore.showErrorMessage(teacher.errorDetails);
  } finally {
    teacher.loadingDetails = false;
  }
};

const loadInitialData = async () => {
  loading.value = true;
  error.value = null;
  try {
    // Fetch all base data in parallel
    await Promise.all([fetchTeachers(), fetchAllCourses(), fetchEvaluations()]);
    // After all data is ready, merge evaluations into teachers
    mergeEvaluationData();
  } catch (err: any) {
    error.value = err.message || '初始化页面数据时发生错误。';
    snackbarStore.showErrorMessage(error.value);
  } finally {
    loading.value = false;
  }
};

// REFACTORED: Handles both creating and updating evaluations
const submitSingleScore = async (teacher: Teacher) => {
    // Prepare the payload. Use existing evaluation data or create new.
    const comments = teacher.evaluation?.comments || '';
    const payload = {
        userId: teacher.id,
        periodId: teacher.evaluation?.periodId || 2, // Use existing or default to 2
        evaluatorId: profileStore.user?.id || 0,
        totalScore: teacher.performanceScore,
        comments: comments,
        // You can add default values for other fields if needed by the backend
        weightedScore: teacher.performanceScore * 0.95, // Example
        level: teacher.performanceScore >= 90 ? '优秀' : (teacher.performanceScore >= 80 ? '良好' : '合格'),
        status: 'submitted',
    };

    try {
        // If an evaluation ID exists, it's an UPDATE (PUT)
        if (teacher.evaluation && teacher.evaluation.id) {
            const response = await axios.put(`/api/evaluations/${teacher.evaluation.id}`, payload);
            snackbarStore.showSuccessMessage(response.data.msg || '评价更新成功！');
            // Optionally update local data with response
            teacher.evaluation.status = 'submitted'; // Reflect status change
        } else { // No ID, it's a CREATE (POST)
            const response = await axios.post('/api/evaluations', payload);
            snackbarStore.showSuccessMessage(response.data.msg || '评价创建成功！');
            // After creating, refetch all evaluations to get the new ID and update the state
            await fetchEvaluations();
            mergeEvaluationData();
        }
    } catch (err: any) {
        console.error(`Failed to submit score for ${teacher.username}:`, err);
        const errorMsg = err.response?.data?.msg || '提交失败，请重试。';
        snackbarStore.showErrorMessage(errorMsg);
    }
}


const viewLesson = (lesson: Lesson) => {
    if (lesson.resourceUrl) {
        window.open(lesson.resourceUrl, '_blank');
    } else {
        snackbarStore.showWarningMessage('该课时没有可用的资源链接。');
    }
}

const viewResource = (resource: DisplayResource) => {
    if(resource.detailUrl){
        window.open(resource.detailUrl, '_blank');
    } else {
        snackbarStore.showWarningMessage('无法打开该资源。');
    }
}


watch(teacherPanel, (newIndex) => {
  if (typeof newIndex === 'number' && newIndex >= 0) {
    const teacher = teachers.value[newIndex];
    if (teacher) {
      fetchTeacherDetails(teacher);
    }
  }
});

onMounted(() => {
  if (canEvaluate.value) {
    loadInitialData();
  }
});

// Helper to get color for status chip
const getStatusColor = (status: string | undefined) => {
    if (!status) return 'grey';
    switch (status) {
        case 'approved': return 'success';
        case 'submitted': return 'warning';
        case 'draft': return 'info';
        default: return 'grey';
    }
}
</script>

<template>
  <v-container fluid>
    <v-alert v-if="!canEvaluate" type="error" variant="tonal" class="ma-4">
      您没有权限访问此页面。此功能仅对特定用户角色开放。
    </v-alert>

    <div v-else>
      <v-card class="mb-5">
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-3">mdi-chart-bar</v-icon>
          <span class="text-h5">教师业绩评定</span>
        </v-card-title>
        <v-card-subtitle>对各位老师的教学成果进行综合评价与打分。</v-card-subtitle>
      </v-card>

      <div v-if="loading" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4 text-grey-darken-1">正在加载基础数据...</p>
      </div>
      <v-alert v-if="error" type="warning" variant="tonal">{{ error }}</v-alert>
      
      <v-expansion-panels v-else v-model="teacherPanel" variant="accordion">
        <v-expansion-panel v-for="(teacher, index) in teachers" :key="teacher.id" :value="index">
          <v-expansion-panel-title>
            <v-row align="center" no-gutters>
              <v-col cols="auto" class="mr-4">
                <v-avatar size="50">
                  <v-img :src="teacher.avatar" :alt="teacher.username"></v-img>
                </v-avatar>
              </v-col>
              <v-col>
                <div class="text-h6">{{ teacher.username }}</div>
                <div class="text-body-2 text-grey">{{ teacher.profile?.bio || '暂无简介' }}</div>
              </v-col>
            </v-row>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-if="teacher.loadingDetails" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-2 text-caption">正在加载教师详情...</p>
            </div>
            <v-alert v-else-if="teacher.errorDetails" type="error" variant="text" density="compact">{{ teacher.errorDetails }}</v-alert>

            <div v-else>
              <v-divider class="my-4"></v-divider>
              <h3 class="text-h6 mb-3">教授课程</h3>
              <div v-if="teacher.courses && teacher.courses.length > 0">
                <v-expansion-panels v-model="coursePanels" variant="inset" class="my-4" multiple>
                  <v-expansion-panel
                    v-for="course in teacher.courses"
                    :key="course.id"
                    :value="course.id"
                    @group:selected="({ value }) => value && fetchCourseDetails(course)"
                  >
                   <v-expansion-panel-title color="transparent">
                      <v-icon color="indigo" class="mr-3">mdi-book-open-variant</v-icon>
                      {{ course.title }}
                   </v-expansion-panel-title>

                   <v-expansion-panel-text>
                      <div v-if="course.loadingDetails" class="text-center py-3">
                         <v-progress-circular indeterminate size="24" color="grey-darken-1"></v-progress-circular>
                         <p class="text-caption mt-2">正在加载章节...</p>
                      </div>
                      <v-list v-else-if="course.detailsLoaded" density="compact">
                        <div v-for="chapter in course.chapters" :key="chapter.id">
                          <v-list-subheader>{{ chapter.title }}</v-list-subheader>
                          <v-list-item
                            v-for="lesson in chapter.lessons"
                            :key="lesson.id"
                            :title="lesson.title"
                            class="pl-8"
                            link
                            @click="viewLesson(lesson)"
                          >
                             <template v-slot:prepend>
                              <v-icon size="small" :color="lesson.contentType === 'video' ? 'red' : 'grey-darken-1'">
                                {{ lesson.contentType === 'video' ? 'mdi-play-circle-outline' : 'mdi-file-document-outline' }}
                              </v-icon>
                            </template>
                          </v-list-item>
                        </div>
                         <p v-if="!course.chapters || course.chapters.length === 0" class="text-caption text-grey text-center pa-2">该课程暂无章节</p>
                      </v-list>
                   </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
              <p v-else class="text-grey-darken-1 ml-2">该教师暂无课程。</p>
              
              <v-divider class="my-4"></v-divider>
              <h3 class="text-h6 mb-3">上传的资源</h3>
              <div v-if="teacher.resources && teacher.resources.length > 0" class="d-flex" style="overflow-x: auto; padding-bottom: 12px;">
                <v-card
                  v-for="resource in teacher.resources"
                  :key="resource.id"
                  variant="tonal"
                  class="mr-4 flex-shrink-0"
                  width="280"
                  link
                  @click="viewResource(resource)"
                >
                  <v-card-item>
                     <div>
                       <div class="text-overline mb-1">
                          <v-icon size="small" :color="resource.type === 'video' ? 'blue' : 'green'" class="mr-1">
                             {{ resource.type === 'video' ? 'mdi-movie-outline' : 'mdi-text-box-outline' }}
                          </v-icon>
                          {{ resource.type === 'video' ? '视频资源' : '图文资源' }}
                       </div>
                       <div class="text-h6 mb-1">
                         {{ resource.title }}
                       </div>
                       <div class="text-caption">
                         由 {{ resource.authorName }} 创建于 {{ resource.createdAt }}
                       </div>
                     </div>
                   </v-card-item>
                </v-card>
              </div>
              <p v-else class="text-grey-darken-1 ml-2">该教师暂未上传任何资源。</p>

              <v-divider class="my-4"></v-divider>
              <h3 class="text-h6 mb-3">业绩打分</h3>
                <div class="d-flex align-center mb-2">
                    <v-slider
                        v-model="teacher.performanceScore"
                        :min="0"
                        :max="100"
                        :step="1"
                        thumb-label
                        class="mr-4"
                        label="评分"
                    >
                       <template v-slot:append>
                        <div class="text-h6 font-weight-bold" style="width: 40px;">{{ teacher.performanceScore }}</div>
                      </template>
                    </v-slider>
                </div>
                <!-- NEW: Comments Textarea -->
                <v-textarea
                    v-model="teacher.evaluation.comments"
                    label="评语"
                    rows="2"
                    variant="outlined"
                    density="compact"
                    placeholder="请输入对该教师的评语..."
                    v-if="teacher.evaluation"
                ></v-textarea>

              <div class="d-flex justify-space-between align-center mt-2">
                 <!-- NEW: Status Chip -->
                 <v-chip
                    v-if="teacher.evaluation && teacher.evaluation.id"
                    :color="getStatusColor(teacher.evaluation.status)"
                    size="small"
                    label
                 >
                    状态: {{ teacher.evaluation.status }}
                 </v-chip>
                 <v-spacer></v-spacer>
                 <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    @click="submitSingleScore(teacher)"
                 >
                    <v-icon start>mdi-send</v-icon>
                    {{ teacher.evaluation && teacher.evaluation.id ? '更新分数' : '提交分数' }}
                 </v-btn>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-container>
</template>
