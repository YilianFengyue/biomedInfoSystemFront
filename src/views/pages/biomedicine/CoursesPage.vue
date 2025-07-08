<template>
  <v-card flat class="main-card">
    <v-card-text class="px-6 pt-6">
      <div v-if="loading" class="loading-section">
        <v-progress-circular indeterminate color="blue-darken-3" size="60"></v-progress-circular>
        <p class="text-h6 mt-6 text-grey-darken-1">正在加载课程列表...</p>
      </div>
      <v-alert v-else-if="error" type="error" variant="tonal" class="error-alert">
        <template v-slot:prepend>
          <v-icon>mdi-alert-circle</v-icon>
        </template>
        <v-alert-title>加载失败</v-alert-title>
        <div>{{ error }}</div>
      </v-alert>
      <div v-else class="courses-content">
        <v-list class="courses-list" v-model:opened="openCourses">
          <v-list-group
            v-for="course in courses"
            :key="course.id"
            :value="course.id"
            class="course-group"
          >
            <template v-slot:activator="{ props }">
              <v-card v-bind="props" class="course-card mb-4" elevation="2" hover>
                <v-card-text class="py-4">
                  <v-row align="center">
                    <v-col cols="auto">
                      <v-avatar size="56" color="blue-lighten-4">
                        <v-icon color="blue-darken-3" size="32">mdi-book-open-page-variant</v-icon>
                      </v-avatar>
                    </v-col>
                    <v-col>
                      <h3 class="text-h5 font-weight-bold text-blue-darken-4 mb-1">{{ course.title }}</h3>
                      <p class="text-body-1 text-grey-darken-2 mb-0">
                        <v-icon size="16" class="mr-1">mdi-account-tie</v-icon>
                        {{ course.teacherName }}
                      </p>
                    </v-col>
                    <v-col cols="auto">
                      <v-chip color="blue-lighten-2" variant="tonal" size="small">
                        <v-icon start size="16">mdi-school</v-icon>
                        课程
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </template>
            <v-card class="chapter-container ml-4 mb-4" elevation="1">
              <div v-if="course.loadingDetails" class="loading-details">
                <v-progress-circular indeterminate color="blue-darken-3" size="40"></v-progress-circular>
                <p class="text-body-2 mt-3 text-grey-darken-1">正在加载章节详情...</p>
              </div>
              <v-alert v-else-if="course.errorDetails" type="warning" variant="text" class="ma-3">
                {{ course.errorDetails }}
              </v-alert>
              <div v-else-if="course.chapters" class="chapters-content">
                <div v-if="course.chapters.length === 0" class="empty-chapters">
                  <v-icon color="grey-lighten-1" size="48">mdi-book-off</v-icon>
                  <p class="text-body-1 text-grey-darken-1 mt-2">本课程暂无章节内容</p>
                </div>
                <v-list v-else class="chapters-list">
                  <v-list-group
                    v-for="chapter in course.chapters"
                    :key="chapter.id"
                    :value="`${course.id}-${chapter.id}`"
                    subgroup
                    class="chapter-group"
                  >
                    <template v-slot:activator="{ props }">
                      <v-list-item v-bind="props" class="chapter-item">
                        <template v-slot:prepend>
                          <v-icon color="teal-darken-2" size="20">mdi-folder-open</v-icon>
                        </template>
                        <v-list-item-title class="text-subtitle-1 font-weight-medium">
                          {{ chapter.title }}
                        </v-list-item-title>
                        <template v-slot:append>
                          <v-chip size="x-small" color="teal-lighten-3" variant="tonal">
                            {{ chapter.lessons?.length || 0 }} 节课
                          </v-chip>
                        </template>
                      </v-list-item>
                    </template>
                    <div v-if="!chapter.lessons || chapter.lessons.length === 0" class="empty-lessons">
                      <v-icon color="grey-lighten-2" size="24">mdi-playlist-remove</v-icon>
                      <span class="text-body-2 text-grey ml-2">本章节暂无内容</span>
                    </div>
                    <v-list-item
                      v-else
                      v-for="lesson in chapter.lessons"
                      :key="lesson.id"
                      @click="playResource(lesson.resourceUrl)"
                      class="lesson-item"
                    >
                      <template v-slot:prepend>
                        <v-avatar size="32" :color="getIconColor(lesson.contentType)" variant="tonal">
                          <v-icon size="16" :color="getIconColor(lesson.contentType)">
                            {{ getContentTypeIcon(lesson.contentType) }}
                          </v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title class="text-subtitle-2">{{ lesson.title }}</v-list-item-title>
                      <template v-slot:append>
                        <v-chip size="small" variant="outlined" :color="getIconColor(lesson.contentType)">
                          <v-icon start size="14">mdi-clock-outline</v-icon>
                          {{ formatDuration(lesson.duration) }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list-group>
                </v-list>
              </div>
            </v-card>
          </v-list-group>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

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
  chapters?: Chapter[];
  loadingDetails?: boolean;
  errorDetails?: string | null;
}

const courses = ref<Course[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const openCourses = ref<number[]>([]);

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
  if (course.chapters || course.loadingDetails) return;

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

watch(openCourses, (newIds, oldIds) => {
  const addedId = newIds.find(id => !oldIds.includes(id));
  if (addedId) {
    const courseToLoad = courses.value.find(c => c.id === addedId);
    if (courseToLoad) {
      fetchCourseDetails(courseToLoad);
    }
  }
}, { deep: true });

const playResource = (url: string) => {
  if (url) {
    window.open(url, '_blank');
  } else {
    alert('该资源当前不可用。');
  }
};

const getContentTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'video': return 'mdi-play-circle';
    case 'audio': return 'mdi-microphone';
    case 'document': return 'mdi-file-document';
    default: return 'mdi-help-circle';
  }
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'video': return 'red-darken-1';
    case 'audio': return 'blue-darken-1';
    case 'document': return 'green-darken-1';
    default: return 'grey-darken-1';
  }
}

const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
};

onMounted(() => {
  fetchCourses();
});
</script>

<style scoped lang="scss">
/* .courses-container 及其样式已被移除 */

.main-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  /* 如果希望卡片在页面中有边距，可以添加 margin */
  margin: 2rem;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.error-alert {
  margin: 2rem 0;
}

/* .courses-hint 及其样式已被移除 */

.courses-list {
  background: transparent;
}

.course-group {
  margin-bottom: 1.5rem;
}

.course-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: #1976d2;
  }
}

.chapter-container {
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
}

.loading-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.empty-chapters, .empty-lessons {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 2rem;
  text-align: center;
}

.empty-lessons {
  flex-direction: row;
  padding: 1rem;
  margin-left: 2rem;
}

.chapters-content {
  padding: 1rem;
}

.chapters-list {
  background: transparent;
}

.chapter-group {
  margin-bottom: 0.5rem;
}

.chapter-item {
  background: white;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border: 1px solid #e8f5e8;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fdf8;
    border-color: #4caf50;
  }
}

.lesson-item {
  cursor: pointer;
  border-radius: 6px;
  margin: 0.25rem 0;
  margin-left: 1rem;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    background: rgba(33, 150, 243, 0.05);
    border-color: #2196f3;
    transform: translateX(4px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-card {
    margin: 1rem; /* 在小屏幕上调整边距 */
  }

  .chapter-container {
    margin-left: 0.5rem;
  }

  .lesson-item {
    margin-left: 0.5rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>