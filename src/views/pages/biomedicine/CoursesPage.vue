<template>
  <v-container fluid>
    <v-card flat>
      <v-card-title class="text-h4 font-weight-bold d-flex align-center">
        <v-icon color="primary" class="mr-3">mdi-school-outline</v-icon>
        课程总览
      </v-card-title>
      <v-card-subtitle>点击课程名称展开查看章节目录</v-card-subtitle>

      <v-card-text>
        <div v-if="loading" class="text-center py-10">
          <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
          <p class="mt-4 text-grey-darken-1">正在加载课程列表...</p>
        </div>

        <v-alert v-else-if="error" type="error" title="加载失败" :text="error" variant="tonal" class="my-5"></v-alert>

        <v-list v-else v-model:opened="openCourses" class="py-0">
          <v-list-group
            v-for="course in courses"
            :key="course.id"
            :value="course.id"
          >
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" class="course-title-item">
                <template v-slot:prepend>
                   <v-icon color="blue-grey-lighten-1">mdi-book-open-page-variant-outline</v-icon>
                </template>
                <v-list-item-title class="text-h6 font-weight-medium">{{ course.title }}</v-list-item-title>
                 <v-list-item-subtitle>{{ course.teacherName }}</v-list-item-subtitle>
              </v-list-item>
            </template>
            
            <div v-if="course.loadingDetails" class="d-flex justify-center my-4">
               <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
            </div>

            <v-alert v-else-if="course.errorDetails" density="compact" type="warning" variant="text" class="ma-2" :text="course.errorDetails"></v-alert>

            <template v-else-if="course.chapters">
              <v-list-item v-if="course.chapters.length === 0" disabled>
                <v-list-item-title class="text-grey-darken-1 ml-4">本课程暂无章节内容</v-list-item-title>
              </v-list-item>
              <v-list-group
                v-else
                v-for="chapter in course.chapters"
                :key="chapter.id"
                :value="`${course.id}-${chapter.id}`"
                subgroup
              >
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-folder-open-outline</v-icon>
                    </template>
                    <v-list-item-title>{{ chapter.title }}</v-list-item-title>
                  </v-list-item>
                </template>

                <v-list-item
                  v-for="lesson in chapter.lessons"
                  :key="lesson.id"
                  @click="playResource(lesson.resourceUrl)"
                  class="lesson-item"
                >
                  <template v-slot:prepend>
                    <v-icon :color="getIconColor(lesson.contentType)" class="ml-2">{{ getContentTypeIcon(lesson.contentType) }}</v-icon>
                  </template>
                  <v-list-item-title>{{ lesson.title }}</v-list-item-title>
                  <template v-slot:append>
                    <v-chip size="small" variant="tonal" :color="getIconColor(lesson.contentType)">
                      {{ formatDuration(lesson.duration) }}
                    </v-chip>
                  </template>
                </v-list-item>

                <v-list-item v-if="!chapter.lessons || chapter.lessons.length === 0" disabled>
                   <v-list-item-title class="text-grey ml-4">本章节暂无内容</v-list-item-title>
                </v-list-item>
              </v-list-group>
            </template>

          </v-list-group>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

// --- 接口定义 ---
interface Lesson {
  id: number;
  title: string;
  contentType: string;
  resourceUrl: string;
  duration: number;
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
  coverImage: string | null;
  studentCount: number;
  rating: number;
  // 以下为动态添加的属性
  chapters?: Chapter[];
  loadingDetails?: boolean;
  errorDetails?: string | null;
}

// --- 响应式状态 ---
const courses = ref<Course[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const openCourses = ref<number[]>([]); // 控制列表的展开状态

// --- API 调用 ---
const fetchCourses = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get('http://localhost:81/api/courses');
    if (response.data.code === 20000) {
      courses.value = response.data.data;
    } else {
      throw new Error(response.data.msg || '无法加载课程列表');
    }
  } catch (err: any) {
    error.value = err.message || '请求失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
};

const fetchCourseDetails = async (course: Course) => {
  // 仅在首次展开时获取数据
  if (course.chapters || course.loadingDetails) {
    return;
  }
  
  course.loadingDetails = true;
  course.errorDetails = null;
  try {
    const response = await axios.get(`http://localhost:81/api/courses/${course.id}`);
    if (response.data.code === 20000) {
      course.chapters = response.data.data.chapters || [];
    } else {
      throw new Error(response.data.msg || '无法加载课程详情');
    }
  } catch (err: any) {
    course.errorDetails = err.message || '获取章节失败。';
  } finally {
    course.loadingDetails = false;
  }
};

// --- 侦听器 (关键修正) ---
watch(openCourses, (newIds, oldIds) => {
  // 找出新展开的课程ID
  const addedId = newIds.find(id => !oldIds.includes(id));
  if (addedId) {
    const courseToLoad = courses.value.find(c => c.id === addedId);
    if (courseToLoad) {
      fetchCourseDetails(courseToLoad);
    }
  }
}, { deep: true });


// --- 视图控制与辅助函数 ---
const playResource = (url: string) => {
  if (url) {
    window.open(url, '_blank');
  } else {
    alert('该资源当前不可用。');
  }
};

const getContentTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'video': return 'mdi-play-circle-outline';
    case 'audio': return 'mdi-microphone-outline';
    case 'document': return 'mdi-file-document-outline';
    default: return 'mdi-help-circle-outline';
  }
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'video': return 'error';
    case 'audio': return 'info';
    case 'document': return 'success';
    default: return 'grey';
  }
}

const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchCourses();
});
</script>

<style scoped lang="scss">
.course-title-item {
  border-bottom: 1px solid #e0e0e0;
  &:last-child {
    border-bottom: none;
  }
}

.lesson-item {
  cursor: pointer;
  padding-left: 32px !important; // 增加课时缩进
  border-left: 2px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
    border-left-color: var(--v-theme-primary);
  }
}
</style>