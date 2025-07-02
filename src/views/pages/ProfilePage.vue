<script setup lang="ts">
import { useProfileStore } from "@/stores/profileStore";
import { useAuthStore } from "@/stores/authStore";
import { Icon } from "@iconify/vue";
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSnackbarStore } from "@/stores/snackbarStore";
import AvatarCropper from '@/components/User/AvatarCropper.vue';
import { getOSSPolicyApi, uploadFileToOSS } from '@/api/herbApi';
import http from '@/api/http';

// --- Store 和工具 ---
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();
const authStore = useAuthStore();
const router = useRouter();

// --- 响应式状态 ---
const user = computed(() => profileStore.user);
const isCropperOpen = ref(false);
const isUploading = ref(false);

// 用于编辑的表单数据
const editableProfile = reactive({
  nickname: '',
  bio: '',
  // 注意：后端DTO不包含以下字段，仅为UI占位
  email: 'user@example.com',
  phone: '138-xxxx-xxxx',
});

const passwords = reactive({
  old_pwd: "",
  new_pwd: "",
  re_pwd: "",
});

const passwordFormValid = ref(false);
const currentPasswordShow = ref(false);
const newPasswordShow = ref(false);
const confirmPasswordShow = ref(false);

// --- 密码验证规则 ---
const passwordRules = {
  required: (v: string) => !!v || "密码不能为空",
  minLength: (v: string) => (v && v.length >= 6) || "新密码至少为6位",
  match: (v: string) => v === passwords.new_pwd || "两次输入的新密码不一致",
};

// --- 生命周期钩子 ---
onMounted(() => {
  if (!profileStore.isLoaded) {
    profileStore.fetchUserProfile();
  }
});

// 监听 Pinia store 的变化，同步更新本地编辑对象
watch(user, (newUser) => {
  if (newUser) {
    editableProfile.nickname = newUser.nickname || '';
    editableProfile.bio = newUser.bio || '';
    // 假设 email 从 user 对象获取，如果后端不提供，则显示静态文本
    editableProfile.email = newUser.email || 'backend-no-email-data'; 
  }
}, { immediate: true, deep: true });


// --- 方法 ---

/**
 * 处理头像上传：获取策略 -> 上传OSS -> 更新URL到后端
 */
const handleAvatarUpload = async (blob: Blob, done: () => void) => {
  isUploading.value = true;
  try {
    const policyRes = await getOSSPolicyApi();
    const policyData = policyRes.data.data;
    const avatarFile = new File([blob], `avatar_${user.value?.userId}.jpg`, { type: "image/jpeg" });

    const newAvatarUrl = await uploadFileToOSS(avatarFile, policyData);

    await http.patch('/users/updateAvatar', null, { params: { avatar: newAvatarUrl } });
    
    // 更新 Pinia Store 以立即刷新 UI
    if (profileStore.user) {
      profileStore.user.avatarUrl = newAvatarUrl;
    }

    snackbarStore.showSuccessMessage('头像更新成功！');
    isCropperOpen.value = false;
  } catch (error: any) {
    const errorMessage = error.response?.data?.msg || '头像更新失败，请重试';
    snackbarStore.showErrorMessage(errorMessage);
  } finally {
    isUploading.value = false;
    done(); // 通知子组件处理完成
  }
};

/**
 * 更新用户基本信息
 */
const updateUserInfo = async () => {
  try {
    // 仅提交后端支持的字段
    const profileData = {
      nickname: editableProfile.nickname,
      bio: editableProfile.bio,
    };
    await http.put('/users/update', profileData);
    
    // 成功后更新 Store
    if(profileStore.user){
       profileStore.user.nickname = editableProfile.nickname;
       profileStore.user.bio = editableProfile.bio;
    }

    snackbarStore.showSuccessMessage('用户信息更新成功！');
  } catch (error: any) {
    snackbarStore.showErrorMessage(error.response?.data?.msg || '更新失败');
  }
};

/**
 * 修改密码
 */
const updatePassword = async () => {
  // @ts-ignore
  if (!passwordFormValid.value) {
      snackbarStore.showWarningMessage('请检查密码输入');
      return;
  }
  try {
    await http.patch('/users/updatePwd', passwords);
    snackbarStore.showSuccessMessage('密码修改成功，会话已失效，请重新登录。');
    authStore.logout();
  } catch (error: any) {
    snackbarStore.showErrorMessage(error.response?.data?.msg || '密码修改失败');
  }
};

</script>

<template>
  <div v-if="user">
    <AvatarCropper v-model:dialog="isCropperOpen" @upload="handleAvatarUpload" />
    <v-sheet elevation="0" class="mx-auto" color="transparent" max-width="1600">
      <v-row>
        <v-col cols="12" md="3">
          <v-card>
            <div class="d-flex flex-column pa-10">
              <v-avatar size="120" class="mx-auto elevation-12" color="white" style="cursor: pointer;" title="点击更换头像" @click="isCropperOpen = true">
                <v-img :src="user.avatarUrl || 'https://i.pravatar.cc/150?img=1'" :alt="user.nickname"></v-img>
              </v-avatar>
              <div class="text-center mt-5">
                <h3 class="text-h6 font-weight-bold">{{ user.nickname || user.username }}</h3>
              </div>
            </div>
            <v-divider />
            <div class="py-5 px-10">
              <v-icon color="grey">mdi-account-circle-outline</v-icon>
              <span class="ml-4">用户名: {{ user.username }}</span>
            </div>
            <v-divider />
            <div class="py-5 px-10">
              <v-icon color="grey">mdi-email-outline</v-icon>
              <span class="ml-4">{{ editableProfile.email }}</span>
              <v-tooltip activator="parent" location="top">邮箱信息暂不支持修改</v-tooltip>
            </div>
            <v-divider />
            <div class="py-5 px-10">
              <v-icon color="grey">mdi-phone-outline</v-icon>
              <span class="ml-4">{{ editableProfile.phone }}</span>
              <v-tooltip activator="parent" location="top">电话信息暂不支持修改</v-tooltip>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="9">
          <v-card class="mb-5">
            <v-card-title class="py-4 font-weight-bold">基本信息</v-card-title>
            <v-divider />
            <v-card-text class="pa-7">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-label class="font-weight-medium mb-2">昵称</v-label>
                  <v-text-field v-model="editableProfile.nickname" color="primary" variant="outlined" density="compact" placeholder="你的昵称" hide-details />
                </v-col>
                <v-col cols="12">
                  <v-label class="font-weight-medium mb-2">个人简介</v-label>
                  <v-textarea v-model="editableProfile.bio" color="primary" variant="outlined" rows="3" placeholder="介绍一下自己吧" hide-details />
                </v-col>
              </v-row>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-5">
              <v-spacer />
              <v-btn class="px-5" color="primary" variant="elevated" @click="updateUserInfo">保存信息</v-btn>
            </v-card-actions>
          </v-card>

          <v-card class="mb-5">
            <v-card-title class="py-4 font-weight-bold">修改密码</v-card-title>
            <v-divider />
            <v-card-text class="pa-7">
              <v-form v-model="passwordFormValid">
                <v-row>
                  <v-col cols="12">
                    <v-label class="font-weight-medium mb-2">原密码</v-label>
                    <v-text-field v-model="passwords.old_pwd" type="password" density="compact" variant="outlined" color="primary" :rules="[passwordRules.required]" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-label class="font-weight-medium mb-2">新密码</v-label>
                    <v-text-field v-model="passwords.new_pwd" :type="newPasswordShow ? 'text' : 'password'" density="compact" variant="outlined" color="primary" :rules="[passwordRules.required, passwordRules.minLength]" :append-inner-icon="newPasswordShow ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="newPasswordShow = !newPasswordShow" @input="checkPasswordMatch" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-label class="font-weight-medium mb-2">确认新密码</v-label>
                    <v-text-field v-model="passwords.re_pwd" :type="confirmPasswordShow ? 'text' : 'password'" density="compact" variant="outlined" color="primary" :rules="[passwordRules.required, passwordRules.match]" :append-inner-icon="confirmPasswordShow ? 'mdi-eye' : 'mdi-eye-off'" @click:append-inner="confirmPasswordShow = !confirmPasswordShow" @input="checkPasswordMatch" />
                    <v-alert v-if="showPasswordMismatch" type="error" density="compact" class="mt-2" text="两次输入的密码不一致" />
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-5">
              <v-spacer />
              <v-btn class="px-5" color="primary" variant="elevated" @click="updatePassword">修改密码</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
  <div v-else class="text-center pa-10">
    <v-progress-circular indeterminate color="primary" size="50" />
    <p class="mt-4 text-grey-darken-1">正在加载用户信息...</p>
  </div>
</template>

<style scoped lang="scss">
/* 您可以在此添加自定义样式，以进一步微调布局 */
</style>