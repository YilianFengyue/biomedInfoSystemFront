<template>
  <v-container>
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-grey-darken-1">视频资源加载中...</p>
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      title="视频加载失败"
      :text="error"
      variant="tonal"
      class="my-5"
    >
      <template v-slot:append>
        <v-btn @click="router.back()" color="error">返回列表</v-btn>
      </template>
    </v-alert>

    <v-card v-else-if="videoItem" rounded="lg">
      <v-row no-gutters>
        <v-col cols="12" md="7">
          <v-responsive :aspect-ratio="16/9" class="position-relative">
            <video
              v-if="videoItem.videoUrl"
              :src="videoItem.videoUrl"
              controls
              class="w-100 h-100 position-absolute"
              :poster="videoItem.coverUrl || ''"
              style="object-fit: contain; top: 0; left: 0;"
            >
              您的浏览器不支持 Video 标签。
            </video>
            <div v-else class="d-flex align-center justify-center fill-height bg-grey-lighten-2">
              <p class="text-h6 text-grey">视频地址无效</p>
            </div>
          </v-responsive>
        </v-col>

        <v-col cols="12" md="5">
          <v-card-title class="text-h5 pt-4">
            {{ videoItem.title }}
          </v-card-title>

          <v-card-subtitle class="d-flex align-center flex-wrap">
            <v-icon size="small" class="mr-1">mdi-account-circle</v-icon>
            <span>{{ videoItem.uploaderName }}</span>
            <v-spacer></v-spacer>
            <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
            <span>发布于: {{ new Date(videoItem.createdAt).toLocaleDateString() }}</span>
          </v-card-subtitle>

          <v-card-text class="py-4">
            <p class="text-body-1">{{ videoItem.description }}</p>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-btn @click="toggleLike" :color="isLiked ? 'pink' : 'primary'" :loading="likeLoading">
              <v-icon left>{{ isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              {{ isLiked ? '已赞' : '点赞' }} ({{ likeCount }})
            </v-btn>

            <v-btn @click="shareVideo" color="primary" prepend-icon="mdi-share-variant">
              分享
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="router.back()" variant="text">
              返回
            </v-btn>
          </v-card-actions>
        </v-col>
      </v-row>

      <v-divider></v-divider>

      <div class="pa-4">
        <h3 class="text-h6 mb-4">留言区 ({{ comments.length }})</h3>

        <p v-if="comments.length === 0" class="text-center text-grey-darken-1 my-8">暂无留言，快来抢沙发吧！</p>
        <RecycleScroller
          v-else
          class="comments-scroller mb-6"
          :items="comments"
          :item-size="88" 
          key-field="id"
          v-slot="{ item }"
        >
          <v-list-item three-line>
              <template v-slot:prepend>
                 <v-avatar color="primary" class="mr-4">
                    <v-icon>mdi-account</v-icon>
                 </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">{{ item.authorName || '匿名用户' }}</v-list-item-title>
              <v-list-item-subtitle class="text-wrap">{{ item.content }}</v-list-item-subtitle>
              
              <template v-slot:append>
                <span class="text-caption text-grey">{{ formatRelativeTime(item.createdAt) }}</span>
              </template>
          </v-list-item>
        </RecycleScroller>
        
        <v-textarea
          v-model="newComment"
          label="发表你的看法..."
          variant="outlined"
          rows="3"
          clearable
          class="mb-2"
        ></v-textarea>
        <v-btn color="success" @click="postComment" :loading="commentLoading" :disabled="!newComment.trim()">
          发表留言
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useProfileStore } from '@/stores/profileStore';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { RecycleScroller } from 'vue-virtual-scroller';

// 记得在 main.ts 中引入样式:
// import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

interface VideoDetailData {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  coverUrl: string | null;
  uploaderName: string;
  createdAt: string;
}

interface Comment {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

const route = useRoute();
const router = useRouter();
const snackbarStore = useSnackbarStore();
const profileStore = useProfileStore();

const videoItem = ref<VideoDetailData | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

const isLiked = ref(false);
const likeCount = ref(0);
const likeLoading = ref(false);
const comments = ref<Comment[]>([]);
const commentLoading = ref(false);
const newComment = ref('');

const videoId = computed(() => route.params.id);
const userId = computed(() => profileStore.user?.id);

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return '';
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN });
};

const fetchVideoDetail = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(`/api/videos/${videoId.value}`);
    if (response.data.code === 20000 && response.data.data) {
      videoItem.value = response.data.data;
    } else {
      throw new Error(response.data.msg || '无法加载视频数据');
    }
  } catch (err: any) {
    error.value = err.message || '请求失败，请稍后重试。';
    snackbarStore.showErrorMessage(error.value);
  } finally {
    loading.value = false;
  }
};

const fetchLikes = async () => {
  if (!videoId.value) return;
  try {
    const response = await axios.get(`/api/videos/${videoId.value}/likes`, {
      params: { userId: userId.value }
    });
    if (response.data.code === 20000) {
      likeCount.value = response.data.data.count;
      isLiked.value = response.data.data.isLiked;
    }
  } catch (err) {
    console.error('获取点赞信息失败:', err);
  }
};

const fetchComments = async () => {
  commentLoading.value = true;
  try {
    const response = await axios.get(`/api/videos/${videoId.value}/comments`);
    if (response.data.code === 20000) {
      // 直接使用从后端获取的真实评论数据
      comments.value = response.data.data || [];
    } else {
       comments.value = [];
    }
  } catch (err) {
    console.error('获取留言失败:', err);
    snackbarStore.showErrorMessage('获取留言列表失败');
  } finally {
    commentLoading.value = false;
  }
};

const toggleLike = async () => {
  if (!userId.value) {
    snackbarStore.showWarningMessage('请先登录再进行操作');
    return;
  }
  likeLoading.value = true;
  try {
    const response = await axios.post(`/api/videos/${videoId.value}/like`, { userId: userId.value });
    if (response.data.code === 20000) {
        likeCount.value = response.data.data.count;
        isLiked.value = response.data.data.isLiked;
    } else {
        throw new Error(response.data.msg);
    }
  } catch (err: any) {
    console.error('点赞操作失败:', err);
    snackbarStore.showErrorMessage(err.message ||'操作失败，请重试');
  } finally {
    likeLoading.value = false;
  }
};

const postComment = async () => {
  if (!userId.value) {
    snackbarStore.showWarningMessage('请先登录再发表留言');
    return;
  }
  if (!newComment.value.trim()) return;

  commentLoading.value = true;
  try {
    const response = await axios.post(`/api/videos/${videoId.value}/comments`, {
      userId: userId.value,
      content: newComment.value,
    });
    if (response.data.code === 20000) {
      comments.value.unshift(response.data.data);
      newComment.value = '';
      snackbarStore.showSuccessMessage('留言成功！');
    } else {
        throw new Error(response.data.msg);
    }
  } catch (err: any) {
    console.error('发表留言失败:', err);
    snackbarStore.showErrorMessage(err.message || '发表留言失败');
  } finally {
    commentLoading.value = false;
  }
};


const shareVideo = async () => {
  if (!videoItem.value) return;
  const shareData = {
    title: videoItem.value.title,
    text: `来看看这个教学视频: ${videoItem.value.title}`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      snackbarStore.showSuccessMessage('页面链接已复制到剪贴板');
    }
  } catch (err) {
    console.error('分享失败:', err);
    snackbarStore.showErrorMessage('分享失败');
  }
};

onMounted(() => {
  fetchVideoDetail();
  fetchLikes();
  fetchComments();
});
</script>

<style scoped>
.v-container {
  max-width: 1000px;
  padding-top: 2rem;
  padding-bottom: 2rem;
}
video {
  background-color: #000;
}
.comments-scroller {
  height: 400px; /* 定义一个固定的高度 */
  overflow-y: auto; /* 当内容超出时显示滚动条 */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
</style>