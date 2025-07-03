<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useSnackbarStore } from '@/stores/snackbarStore';
import SalesCard from "@/components/Administrator/SalesCard.vue";
import ActivityCard from "@/components/Administrator/ActivityCard.vue";
import ResourcePreviewCard from '@/views/pages/biomedicine/ResourcePreviewCard.vue';

// --- 类型定义 ---

interface User {
  id: number;
  username: string;
  role: number;
  createdAt: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface Resource {
  id: number;
  type: 'text' | 'video';
  title: string;
  authorName: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  content?: string;
  coverImageUrl?: string | null;
  videoUrl?: string;
  description?: string;
}

// --- 状态管理 ---
const snackbarStore = useSnackbarStore();
const router = useRouter();

// 用户管理状态
const loadingUsers = ref(true);
const users = ref<User[]>([]);
const resetPasswordDialog = ref(false);
const selectedUserForAction = ref<User | null>(null);
const roleOptions = [
  { title: '管理员', value: 0 },
  { title: '学生', value: 1 },
  { title: '教师', value: 2 },
];

// 资源管理状态
const loadingResources = ref(true);
const allResources = ref<Resource[]>([]);
const resourceSearchQuery = ref('');
const statusOptions = ['draft', 'published', 'archived'];

// 预览功能状态
const previewDialog = ref(false);
const isFetchingPreview = ref(false);
const previewResource = ref<Resource | null>(null);


// --- 表头定义 ---
const userHeaders = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: '头像', key: 'avatarUrl', sortable: false },
  { title: '用户名', key: 'username' },
  { title: '昵称', key: 'nickname' },
  { title: '角色', key: 'role', width: '180px' },
  { title: '注册时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'center', width: '120px' },
];

const resourceHeaders = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: '类型', key: 'type', width: '100px' },
  { title: '标题', key: 'title' },
  { title: '作者/上传者', key: 'authorName' },
  { title: '创建时间', key: 'createdAt', width: '180px' },
  { title: '状态', key: 'status', sortable: false, width: '180px' },
  { title: '操作', key: 'actions', sortable: false, align: 'center', width: '120px' },
];

// --- 计算属性 ---
const filteredResources = computed(() => {
    if (!resourceSearchQuery.value) {
        return allResources.value;
    }
    const query = resourceSearchQuery.value.toLowerCase();
    return allResources.value.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.authorName.toLowerCase().includes(query)
    );
});


// --- API 调用 ---

const fetchAllUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await axios.get('/api/users/all');
    if (response.data.code === 20000 && Array.isArray(response.data.data)) {
      users.value = response.data.data;
    } else {
      throw new Error(response.data.msg || '获取用户数据失败');
    }
  } catch (error: any) {
    snackbarStore.showErrorMessage(error.message || '网络请求失败');
  } finally {
    loadingUsers.value = false;
  }
};

const fetchAllResources = async () => {
    loadingResources.value = true;
    try {
        const [textRes, videoRes] = await Promise.all([
            axios.get('/api/edu/resources/page', { params: { pageSize: 999 } }),
            axios.get('/api/videos/page', { params: { pageSize: 999 } })
        ]);

        const combinedList: Resource[] = [];

        if (textRes.data.code === 20000 && textRes.data.data?.records) {
            const textResources = textRes.data.data.records.map((item: any) => ({
                ...item, type: 'text', authorName: item.authorName || '未知作者',
            }));
            combinedList.push(...textResources);
        }

        if (videoRes.data.code === 20000 && videoRes.data.data?.content) {
            const videoResources = videoRes.data.data.content.map((item: any) => ({
                ...item, type: 'video', authorName: item.uploaderName || '未知上传者', status: item.status || 'draft'
            }));
            combinedList.push(...videoResources);
        }
        
        allResources.value = combinedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    } catch (error: any) {
        snackbarStore.showErrorMessage(error.message || '获取资源数据时发生网络错误');
    } finally {
        loadingResources.value = false;
    }
};

const updateResourceStatus = async (resource: Resource, newStatus: 'draft' | 'published' | 'archived') => {
  const endpoint = resource.type === 'text'
    ? `/api/resources/${resource.id}/status`
    : `/api/videos/${resource.id}/status`;
  try {
    const response = await axios.patch(endpoint, { status: newStatus });
    if (response.data.code === 20000) {
      snackbarStore.showSuccessMessage(`资源 #${resource.id} 状态已更新`);
      resource.status = newStatus;
    } else {
      throw new Error(response.data.msg || '操作失败');
    }
  } catch (error: any) {
    snackbarStore.showErrorMessage(error.message || '修改资源状态时发生错误');
    await fetchAllResources();
  }
};

const fetchResourceForPreview = async (resource: Resource) => {
    isFetchingPreview.value = true;
    previewResource.value = null;
    const endpoint = resource.type === 'text'
        ? `/api/edu/resources/${resource.id}`
        : `/api/videos/${resource.id}`;
    try {
        const response = await axios.get(endpoint);
        if (response.data.code === 20000 && response.data.data) {
            previewResource.value = { ...response.data.data, type: resource.type };
            previewDialog.value = true;
        } else {
            throw new Error(response.data.msg || '无法获取资源详情');
        }
    } catch (error: any) {
        snackbarStore.showErrorMessage(error.message || '获取资源详情失败');
    } finally {
        isFetchingPreview.value = false;
    }
}

const updateUserRole = async (user: User, newRole: number) => {
    try {
        const response = await axios.patch(`/api/users/${user.id}/role`, { role: newRole });
        if (response.data.code === 20000) {
            snackbarStore.showSuccessMessage(`用户 ${user.username} 的角色已更新`);
            user.role = newRole; // 更新本地数据
        } else {
            throw new Error(response.data.msg || '角色更新失败');
        }
    } catch (error: any) {
        snackbarStore.showErrorMessage(error.message || '更新角色时发生错误');
        await fetchAllUsers(); // 失败时重新同步数据
    }
};

const confirmResetPassword = async () => {
    if (!selectedUserForAction.value) return;
    try {
        const response = await axios.patch(`/api/users/${selectedUserForAction.value.id}/reset-password`);
        if (response.data.code === 20000) {
            snackbarStore.showSuccessMessage(response.data.msg);
        } else {
            throw new Error(response.data.msg || '密码重置失败');
        }
    } catch (error: any) {
        snackbarStore.showErrorMessage(error.message || '重置密码时发生错误');
    } finally {
        resetPasswordDialog.value = false;
        selectedUserForAction.value = null;
    }
};


// --- 辅助与导航函数 ---

const getRoleText = (role: number) => {
  switch (role) {
    case 0: return { text: '管理员', color: 'primary' };
    case 1: return { text: '学生', color: 'green' };
    case 2: return { text: '教师', color: 'orange' };
    default: return { text: '未知', color: 'grey' };
  }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'published': return 'success';
        case 'draft': return 'orange';
        case 'archived': return 'grey';
        default: return 'default';
    }
};

const getResourceTypeChip = (type: 'text' | 'video') => {
    return type === 'text'
        ? { text: '图文', color: 'blue', icon: 'mdi-text-box-outline' }
        : { text: '视频', color: 'purple', icon: 'mdi-play-box-outline' };
}

const goToResourceDetail = (resource: Resource) => {
    const path = resource.type === 'text'
        ? `/biomedicine/resource-detail/${resource.id}`
        : `/biomedicine/VideoDetail/${resource.id}`;
    router.push(path);
}

const openResetPasswordDialog = (user: User) => {
    selectedUserForAction.value = user;
    resetPasswordDialog.value = true;
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchAllUsers();
  fetchAllResources();
});
</script>

<template>
  <div class="pa-5">
    <!-- 统计卡片 -->
    <v-row class="flex-0" dense>
      <v-col cols="12" md="6">
        <SalesCard :value="1837.32" class="h-100" :percentage="3.2" style="min-height: 380px" :percentage-label="$t('dashboard.lastweek')" :action-label="$t('dashboard.viewReport')" />
      </v-col>
      <v-col cols="12" md="6">
        <ActivityCard />
      </v-col>
    </v-row>

    <!-- 用户总览 -->
    <v-row class="mt-5">
      <v-col cols="12">
        <v-card>
          <v-card-title class="font-weight-bold d-flex align-center">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            <span>用户总览</span>
            <v-spacer></v-spacer>
            <v-btn icon @click="fetchAllUsers" :loading="loadingUsers">
              <v-icon>mdi-refresh</v-icon>
              <v-tooltip activator="parent" location="top">刷新列表</v-tooltip>
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-data-table :headers="userHeaders" :items="users" :loading="loadingUsers" item-value="id" hover class="elevation-0">
            <template v-slot:item.avatarUrl="{ item }">
              <v-avatar size="40" class="my-2">
                <v-img :src="item.avatarUrl || 'https://i.pravatar.cc/150'" :alt="item.username"></v-img>
              </v-avatar>
            </template>
            <template v-slot:item.role="{ item }">
              <v-select
                :model-value="item.role"
                @update:modelValue="(newRole) => updateUserRole(item, newRole)"
                :items="roleOptions"
                :disabled="item.role === 0"
                density="compact"
                variant="outlined"
                hide-details
                :color="getRoleText(item.role).color"
              >
                <template v-slot:selection="{ item: selectedItem }">
                  <v-chip :color="getRoleText(selectedItem.value).color" size="small" label>
                    {{ selectedItem.title }}
                  </v-chip>
                </template>
              </v-select>
            </template>
             <template v-slot:item.actions="{ item }">
                <v-btn 
                    variant="text" 
                    size="small" 
                    @click="openResetPasswordDialog(item)" 
                    :disabled="item.role === 0"
                    title="重置密码"
                >
                  重置密码
                </v-btn>
             </template>
            <template v-slot:loading>
              <v-skeleton-loader type="table-tbody@5"></v-skeleton-loader>
            </template>
            <template v-slot:no-data>
              <div class="text-center pa-4 text-grey">暂无用户数据</div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- 资源管理 -->
    <v-row class="mt-5">
      <v-col cols="12">
        <v-card>
          <v-card-title class="font-weight-bold d-flex align-center">
            <v-icon class="mr-2">mdi-file-document-edit-outline</v-icon>
            <span>资源管理</span>
            <v-spacer></v-spacer>
            <v-text-field
                v-model="resourceSearchQuery"
                density="compact" variant="solo" label="搜索资源标题或作者"
                prepend-inner-icon="mdi-magnify" single-line hide-details
                clearable class="mr-4" style="max-width: 350px;"
            ></v-text-field>
            <v-btn icon @click="fetchAllResources" :loading="loadingResources">
              <v-icon>mdi-refresh</v-icon>
              <v-tooltip activator="parent" location="top">刷新列表</v-tooltip>
            </v-btn>
          </v-card-title>
          <v-divider />
           <v-data-table :headers="resourceHeaders" :items="filteredResources" :loading="loadingResources" item-value="id" hover class="elevation-0">
             <template v-slot:item.type="{ item }">
                <v-chip :color="getResourceTypeChip(item.type).color" size="small" label>
                    <v-icon start size="small">{{ getResourceTypeChip(item.type).icon }}</v-icon>
                    {{ getResourceTypeChip(item.type).text }}
                </v-chip>
             </template>
             <template v-slot:item.status="{ item }">
                <v-select
                  :model-value="item.status"
                  @update:modelValue="(newStatusVal) => updateResourceStatus(item, newStatusVal)"
                  :items="statusOptions" density="compact" variant="outlined" hide-details
                  :color="getStatusColor(item.status)"
                >
                    <template v-slot:selection="{ item: selectedItem }">
                         <v-chip :color="getStatusColor(selectedItem.value)" size="small" label>
                            {{ selectedItem.title }}
                        </v-chip>
                    </template>
                </v-select>
             </template>
             <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-eye-outline" variant="text" size="small" @click="fetchResourceForPreview(item)" title="预览"></v-btn>
                <v-btn icon="mdi-open-in-new" variant="text" size="small" @click="goToResourceDetail(item)" title="查看详情页"></v-btn>
             </template>
             <template v-slot:loading>
              <v-skeleton-loader type="table-tbody@5"></v-skeleton-loader>
            </template>
            <template v-slot:no-data>
              <div class="text-center pa-4 text-grey">暂无资源数据</div>
            </template>
           </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- 资源预览 Dialog -->
    <v-dialog v-model="previewDialog" max-width="900px" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <span>资源预览</span>
                <v-spacer></v-spacer>
                <v-btn icon @click="previewDialog = false"><v-icon>mdi-close</v-icon></v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-skeleton-loader v-if="isFetchingPreview" type="card-avatar, article, actions"></v-skeleton-loader>
                <div v-else-if="previewResource">
                    <div v-if="previewResource.type === 'video'">
                        <h2 class="text-h5 mb-2">{{ previewResource.title }}</h2>
                        <p class="text-caption text-grey-darken-1 mb-4">上传者: {{ previewResource.authorName }}</p>
                        <video v-if="previewResource.videoUrl" :src="previewResource.videoUrl" controls class="w-100 rounded" style="background-color: #000;"></video>
                        <p class="mt-4">{{ previewResource.description }}</p>
                    </div>
                    <ResourcePreviewCard v-else :resource="previewResource" />
                </div>
                <div v-else class="text-center pa-8 text-grey">无法加载预览内容。</div>
            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- 重置密码确认 Dialog -->
    <v-dialog v-model="resetPasswordDialog" max-width="450px">
        <v-card>
            <v-card-title class="text-h5 font-weight-bold d-flex align-center">
                <v-icon color="warning" class="mr-3">mdi-alert-circle-outline</v-icon>
                确认重置密码
            </v-card-title>
            <v-card-text>
                您确定要重置用户 <strong>{{ selectedUserForAction?.username }}</strong> 的密码吗？
                <br>
                操作后，密码将被设置为系统默认值。
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="resetPasswordDialog = false">取消</v-btn>
                <v-btn color="warning" variant="flat" @click="confirmResetPassword">确认重置</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </div>
</template>

<style scoped>
.v-data-table {
    font-size: 0.9rem;
}
</style>
