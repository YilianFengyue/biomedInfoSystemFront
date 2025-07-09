<template>
  <v-card flat class="main-card">
    <div v-if="loading" class="loading-section">
      <v-progress-circular indeterminate color="#B0D183" size="60"></v-progress-circular>
      <p class="text-h6 mt-6 text-grey-darken-1">正在加载课程列表...</p>
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      <template v-slot:prepend>
        <v-icon>mdi-alert-circle</v-icon>
      </template>
      <v-alert-title>加载失败</v-alert-title>
      <div>{{ error }}</div>
    </v-alert>

    <v-list v-else v-model:opened="openCourses" lines="two">
      <v-list-subheader inset>所有课程</v-list-subheader>

      <v-list-group v-for="course in courses" :key="course.id" :value="course.id">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props" :title="course.title" :subtitle="course.teacherName" class="course-item">
            <template v-slot:prepend>
              <v-avatar color="#C1CBAD">
                <v-icon color="white">mdi-book-open-page-variant</v-icon>
              </v-avatar>
            </template>
          </v-list-item>
        </template>

        <div v-if="course.loadingDetails" class="loading-details">
          <v-progress-circular indeterminate color="#B0D183" size="30"></v-progress-circular>
          <p class="text-body-2 ml-4 text-grey-darken-1">正在加载章节详情...</p>
        </div>

        <v-alert v-else-if="course.errorDetails" type="warning" variant="text" class="mx-4 my-2">
          {{ course.errorDetails }}
        </v-alert>

        <div v-else-if="course.chapters">
          <div v-if="course.chapters.length === 0" class="empty-content">
            <v-icon color="grey-lighten-1" size="36">mdi-book-off</v-icon>
            <p class="text-body-1 text-grey-darken-1 mt-2">本课程暂无章节内容</p>
          </div>

          <template v-for="chapter in course.chapters" :key="chapter.id">
            <v-list-subheader v-if="chapter.lessons && chapter.lessons.length > 0" class="chapter-subheader">
              {{ chapter.title }}
            </v-list-subheader>

            <v-list-item
              v-for="lesson in chapter.lessons"
              :key="lesson.id"
              :title="lesson.title"
              @click="playResource(lesson.resourceUrl)"
              class="lesson-item"
            >
              <template v-slot:prepend>
                <v-avatar size="32" :color="getIconColor(lesson.contentType)" variant="tonal">
                  <v-icon size="16">{{ getContentTypeIcon(lesson.contentType) }}</v-icon>
                </v-avatar>
              </template>
              <template v-slot:append>
                <v-chip size="small" variant="text" :color="getIconColor(lesson.contentType)">
                  <v-icon start size="14">mdi-clock-outline</v-icon>
                  {{ formatDuration(lesson.duration) }}
                </v-chip>
              </template>
            </v-list-item>
          </template>
        </div>
      </v-list-group>
    </v-list>
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
const openCourses = ref<string[]>([]); // Note: v-list-group with string/number values works best if the array type matches

const fetchCourses = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get('http://localhost:81/api/courses');
    if (response.data.code === 20000) {
      courses.value = response.data.data.map((c: Course) => ({ ...c, id: String(c.id) })); // Ensure ID is string for v-model
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

watch(openCourses, (newIds) => {
  const latestId = newIds[newIds.length - 1]; // Get the last opened item
  if (latestId) {
    const courseToLoad = courses.value.find(c => c.id === latestId);
    if (courseToLoad && !courseToLoad.chapters) {
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
    case 'video': return '#D9A689';
    case 'audio': return '#BCA881';
    case 'document': return '#B0D183';
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
.main-card {
  border-radius: 0; // No border-radius for a full-width look
  margin: 0; // Ensure no margin
  background-color: #f9f9f9;
}

.loading-section, .empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.loading-details {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.course-item {
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }
}

.chapter-subheader {
  font-weight: bold;
  color: #555;
  margin-left: 1rem;
  margin-top: 0.5rem;
}

.lesson-item {
  margin-left: 2rem;
  margin-right: 1rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  padding-left: 1rem;

  &:hover {
    background-color: rgba(176, 209, 131, 0.1);
  }
}

// Responsive design
@media (max-width: 768px) {
  .lesson-item {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
}
</style>