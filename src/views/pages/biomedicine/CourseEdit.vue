<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-3">mdi-clipboard-edit-outline</v-icon>
            <div>
              <h2 class="text-h5 font-weight-bold">我的课程内容管理</h2>
              <p class="text-subtitle-2 text-grey">在这里管理您的课程、章节和课时。</p>
            </div>
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text>
            <div v-if="loading" class="text-center py-10">
              <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
              <p class="mt-4 text-grey-darken-1">正在加载您的课程...</p>
            </div>

            <v-alert v-else-if="error" type="error" :text="error" variant="tonal"></v-alert>

            <v-alert v-else-if="myCourses.length === 0" type="info" variant="tonal">
              您还没有创建任何课程，或系统中没有找到与您用户名 ({{ currentUser?.username }}) 匹配的课程。
            </v-alert>

            <v-list v-else v-model:opened="openItems" class="py-0">
              <v-list-group
                v-for="course in myCourses"
                :key="course.id"
                :value="course.id"
                @click="loadCourseDetails(course)"
              >
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props" class="course-title-item">
                    <template v-slot:prepend>
                      <v-icon>mdi-book-open-page-variant-outline</v-icon>
                    </template>
                    <v-list-item-title class="font-weight-medium">{{ course.title }}</v-list-item-title>
                    <template v-slot:append>
                      <v-btn icon color="error" size="small" @click.stop="confirmDeleteCourse(course)">
                        <v-icon>mdi-delete-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>
                </template>

                <div v-if="course.loadingDetails" class="text-center my-4">
                  <v-progress-circular indeterminate size="24" color="primary"></v-progress-circular>
                </div>

                <v-list-group
                  v-else-if="course.chapters"
                  v-for="chapter in course.chapters"
                  :key="chapter.id"
                  :value="`${course.id}-${chapter.id}`"
                  subgroup
                >
                  <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-icon>mdi-folder-open-outline</v-icon>
                      </template>
                      <v-list-item-title>{{ chapter.title }}</v-list-item-title>
                      <template v-slot:append>
                        <v-btn icon color="error" size="small" @click.stop="confirmDeleteChapter(chapter)">
                          <v-icon>mdi-delete-outline</v-icon>
                        </v-btn>
                      </template>
                    </v-list-item>
                  </template>

                  <v-list-item
                    v-for="lesson in chapter.lessons"
                    :key="lesson.id"
                    :title="lesson.title"
                    density="compact"
                    class="lesson-item"
                  >
                    <template v-slot:prepend>
                        <v-icon size="small" :color="getIconColor(lesson.contentType)" class="mr-2">{{ getContentTypeIcon(lesson.contentType) }}</v-icon>
                    </template>
                    <template v-slot:append>
                      <v-btn icon color="error" size="small" @click.stop="confirmDeleteLesson(lesson)">
                        <v-icon>mdi-delete-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>

                  <v-list-item @click="openAddLessonDialog(chapter)" class="add-lesson-btn">
                    <template v-slot:prepend>
                        <v-icon color="success">mdi-plus-box-outline</v-icon>
                    </template>
                    <v-list-item-title class="text-success">添加新课时</v-list-item-title>
                  </v-list-item>
                </v-list-group>
              </v-list-group>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 主弹窗：添加课时 -->
    <v-dialog v-model="addLessonDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">为“{{ activeChapter?.title }}”添加新课时</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="lessonForm">
            <v-text-field
              v-model="newLesson.title"
              label="课时标题"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="newLesson.resourceId"
              label="关联的资源"
              variant="outlined"
              readonly
              :rules="[rules.required]"
              class="mt-3"
              placeholder="请从右侧选择资源"
            >
              <template v-slot:append-inner>
                <v-btn color="primary" @click="openResourceDialog" size="small">
                  <v-icon left>mdi-magnify</v-icon> 搜索资源
                </v-btn>
              </template>
            </v-text-field>

            <v-select
              v-model="newLesson.contentType"
              :items="['video', 'document']"
              label="内容类型"
              :rules="[rules.required]"
              variant="outlined"
              class="mt-3"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="addLessonDialog = false">取消</v-btn>
          <v-btn color="blue-darken-1" variant="tonal" @click="submitLesson" :loading="isSubmitting">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 资源选择器弹窗 -->
    <v-dialog v-model="resourceDialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>选择课程资源</span>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="resourceSearch"
            placeholder="搜索资源标题..."
            variant="solo"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
            class="mr-2"
            style="max-width: 300px;"
          ></v-text-field>
          <v-btn icon @click="resourceDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text style="min-height: 400px; max-height: 60vh;">
          <div v-if="resourceLoading" class="text-center py-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p class="mt-2 text-grey">正在加载资源...</p>
          </div>
          <v-alert v-else-if="filteredResources.length === 0" type="info" variant="tonal">
            没有找到匹配的资源。
          </v-alert>
          <v-list v-else lines="two">
            <v-list-item
              v-for="resource in filteredResources"
              :key="`${resource.type}-${resource.id}`"
              class="resource-select-item"
            >
              <template v-slot:prepend>
                <v-avatar rounded="sm" size="64" class="mr-4">
                  <v-img :src="resource.coverImageUrl || defaultCover" cover>
                    <template v-slot:placeholder>
                      <v-icon>mdi-image</v-icon>
                    </template>
                  </v-img>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">{{ resource.title }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="resource.type === 'video' ? 'red' : 'orange'" label size="x-small" class="mr-2">{{ resource.type === 'video' ? '视频' : '文档' }}</v-chip>
                作者: {{ resource.authorName }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn color="success" @click="selectResource(resource)" variant="tonal">
                  选定
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="confirmDialog" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h6">{{ confirmTitle }}</v-card-title>
        <v-card-text>
          {{ confirmMessage }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="confirmDialog = false">取消</v-btn>
          <v-btn color="error" variant="tonal" :loading="isDeleting" @click="executeDelete">确认删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useProfileStore } from "@/stores/profileStore";
import defaultCover from '@/assets/edu/new.jpg';

// --- 类型定义 ---
interface Lesson {
  id: number;
  title: string;
  contentType: string;
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
  loadingDetails?: boolean;
}

interface SearchableResource {
  id: number;
  type: 'video' | 'document';
  title: string;
  authorName: string;
  coverImageUrl?: string | null;
}

// --- 状态管理 ---
const snackbarStore = useSnackbarStore();
const profileStore = useProfileStore();
const currentUser = computed(() => profileStore.user);

const myCourses = ref<Course[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const openItems = ref([]);

// --- 添加课时对话框状态 ---
const addLessonDialog = ref(false);
const resourceDialog = ref(false);
const isSubmitting = ref(false);
const lessonForm = ref<any>(null);
const activeChapter = ref<Chapter | null>(null);
const newLesson = reactive({
  title: '',
  resourceId: null as number | null,
  contentType: 'video' as 'video' | 'document'
});

// --- 资源选择器状态 ---
const allSearchableResources = ref<SearchableResource[]>([]);
const resourceLoading = ref(false);
const resourceSearch = ref('');

// --- 删除确认对话框状态 ---
const confirmDialog = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const isDeleting = ref(false);
const deletingItem = ref<Course | Chapter | Lesson | null>(null);
const deleteType = ref<'course' | 'chapter' | 'lesson' | null>(null);

// 【关键修改】将单个函数规则放入对象，方便在模板中用数组包裹
const rules = {
  required: (v: any) => (v !== null && v !== '') || '此项为必填项'
};

const filteredResources = computed(() => {
  if (!resourceSearch.value) return allSearchableResources.value;
  const query = resourceSearch.value.toLowerCase();
  return allSearchableResources.value.filter(r => r.title.toLowerCase().includes(query));
});

// --- 方法 ---
const openAddLessonDialog = (chapter: Chapter) => {
  activeChapter.value = chapter;
  lessonForm.value?.reset();
  newLesson.title = '';
  newLesson.resourceId = null;
  newLesson.contentType = 'video';
  addLessonDialog.value = true;
};

const openResourceDialog = () => {
  resourceDialog.value = true;
  if (allSearchableResources.value.length === 0) {
    fetchAllSearchableResources();
  }
}

const fetchAllSearchableResources = async () => {
  resourceLoading.value = true;
  try {
    const [docRes, videoRes] = await Promise.all([
      axios.get('/api/edu/resources/page', { params: { pageSize: 999, status: 'published', resourceType: 'document' } }),
      axios.get('/api/videos/page', { params: { pageSize: 999, status: 'published' } })
    ]);

    const combinedList: SearchableResource[] = [];
    if (docRes.data.code === 20000 && docRes.data.data?.records) {
      combinedList.push(...docRes.data.data.records.map((r: any) => ({
        id: r.id, type: 'document', title: r.title, authorName: r.authorName, coverImageUrl: r.coverImageUrl
      })));
    }
    if (videoRes.data.code === 20000 && videoRes.data.data?.content) {
      combinedList.push(...videoRes.data.data.content.map((v: any) => ({
        id: v.id, type: 'video', title: v.title, authorName: v.uploaderName, coverImageUrl: v.coverUrl
      })));
    }
    allSearchableResources.value = combinedList;

  } catch (err) {
    snackbarStore.showErrorMessage("加载资源列表失败");
  } finally {
    resourceLoading.value = false;
  }
};

const selectResource = (resource: SearchableResource) => {
  newLesson.resourceId = resource.id;
  newLesson.title = resource.title;
  newLesson.contentType = resource.type;
  resourceDialog.value = false;
};

const fetchAndFilterMyCourses = async () => {
  loading.value = true;
  error.value = null;
  if (!currentUser.value?.username) {
    error.value = "无法获取当前用户信息，请重新登录。";
    loading.value = false;
    return;
  }

  try {
    const response = await axios.get('/api/courses');
    if (response.data.code === 20000) {
      const allCourses = response.data.data as Course[];
      myCourses.value = allCourses.filter(course => course.teacherName === currentUser.value!.username);
    } else {
      throw new Error(response.data.msg || '无法加载课程列表');
    }
  } catch (err: any) {
    error.value = err.response?.data?.msg || err.message || "请求失败，请检查您的网络或联系管理员。";
    snackbarStore.showErrorMessage(error.value);
  } finally {
    loading.value = false;
  }
};

const loadCourseDetails = async (course: Course) => {
  if (course.chapters || course.loadingDetails) return;

  course.loadingDetails = true;
  try {
    const response = await axios.get(`/api/courses/${course.id}`);
    if (response.data.code === 20000) {
      course.chapters = response.data.data.chapters || [];
    } else {
      throw new Error(response.data.msg || '获取章节失败');
    }
  } catch (err: any) {
    snackbarStore.showErrorMessage(err.message || '无法加载课程章节');
  } finally {
    course.loadingDetails = false;
  }
};

const submitLesson = async () => {
  const { valid } = await lessonForm.value?.validate();
  if (!valid || !activeChapter.value) {
    snackbarStore.showWarningMessage('请填写所有必填项');
    return;
  }

  isSubmitting.value = true;
  try {
    const lessonData = {
        title: newLesson.title,
        resourceId: newLesson.resourceId,
        contentType: newLesson.contentType
    };
    const response = await axios.post('/api/lessons', lessonData, {
      params: {
        chapterId: activeChapter.value.id
      }
    });
    
    if (response.data.code === 20000) {
      snackbarStore.showSuccessMessage('课时添加成功！');
      const newLessonData = response.data.data;

      const course = myCourses.value.find(c => c.chapters?.some(ch => ch.id === activeChapter.value!.id));
      if (course) {
        const chapter = course.chapters?.find(ch => ch.id === activeChapter.value!.id);
        if (chapter) {
          chapter.lessons.push(newLessonData);
        }
      }
      addLessonDialog.value = false;
    } else {
      throw new Error(response.data.msg || '添加失败');
    }
  } catch (err: any) {
    const errorMessage = err.response?.data?.msg || err.message || "操作失败，请重试。";
    snackbarStore.showErrorMessage(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const getContentTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'video': return 'mdi-play-circle-outline';
    case 'document': return 'mdi-file-document-outline';
    default: return 'mdi-help-circle-outline';
  }
};

const getIconColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'video': return 'error';
    case 'document': return 'primary';
    default: return 'grey';
  }
}

// --- 删除功能 ---
const confirmDeleteCourse = (course: Course) => {
  confirmTitle.value = '删除课程';
  confirmMessage.value = `您确定要删除课程 “${course.title}” 及其所有章节和课时吗？此操作不可逆！`;
  deletingItem.value = course;
  deleteType.value = 'course';
  confirmDialog.value = true;
};

const confirmDeleteChapter = (chapter: Chapter) => {
  confirmTitle.value = '删除章节';
  confirmMessage.value = `您确定要删除章节 “${chapter.title}” 及其所有课时吗？此操作不可逆！`;
  deletingItem.value = chapter;
  deleteType.value = 'chapter';
  confirmDialog.value = true;
};

const confirmDeleteLesson = (lesson: Lesson) => {
  confirmTitle.value = '删除课时';
  confirmMessage.value = `您确定要删除课时 “${lesson.title}” 吗？此操作不可逆！`;
  deletingItem.value = lesson;
  deleteType.value = 'lesson';
  confirmDialog.value = true;
};

const executeDelete = async () => {
  if (!deletingItem.value || !deleteType.value) return;

  isDeleting.value = true;
  let deleteUrl = '';
  let successMessage = '';
  let itemId: number | undefined;

  switch (deleteType.value) {
    case 'course':
      itemId = (deletingItem.value as Course).id;
      deleteUrl = `/api/courses/${itemId}`;
      successMessage = '课程删除成功';
      break;
    case 'chapter':
      itemId = (deletingItem.value as Chapter).id;
      deleteUrl = `/api/chapters/${itemId}`;
      successMessage = '章节删除成功';
      break;
    case 'lesson':
      itemId = (deletingItem.value as Lesson).id;
      deleteUrl = `/api/lessons/${itemId}`;
      successMessage = '课时删除成功';
      break;
    default:
      return;
  }

  try {
    await axios.delete(deleteUrl);
    snackbarStore.showSuccessMessage(successMessage);
    confirmDialog.value = false;
    
    // 刷新列表或更新数据
    if (deleteType.value === 'course') {
      myCourses.value = myCourses.value.filter(c => c.id !== itemId);
    } else if (deleteType.value === 'chapter') {
      const course = myCourses.value.find(c => c.chapters?.some(ch => ch.id === itemId));
      if (course && course.chapters) {
        course.chapters = course.chapters.filter(ch => ch.id !== itemId);
      }
    } else if (deleteType.value === 'lesson') {
      myCourses.value.forEach(course => {
        if (course.chapters) {
          course.chapters.forEach(chapter => {
            chapter.lessons = chapter.lessons.filter(l => l.id !== itemId);
          });
        }
      });
    }
    deletingItem.value = null;
    deleteType.value = null;
  } catch (error: any) {
    snackbarStore.showErrorMessage(error.response?.data?.msg || error.message || '删除失败');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchAndFilterMyCourses();
});
</script>

<style scoped>
.course-title-item {
  border-bottom: 1px solid #e0e0e0;
}
.lesson-item {
  padding-left: 48px !important;
  background-color: #f8f9fa;
}
.add-lesson-btn {
  padding-left: 48px !important;
  cursor: pointer;
  background-color: #f8f9fa;
}
.add-lesson-btn:hover {
  background-color: rgba(var(--v-theme-success), 0.05);
}
.resource-select-item:hover {
  background-color: #f0f4ff;
}
</style>