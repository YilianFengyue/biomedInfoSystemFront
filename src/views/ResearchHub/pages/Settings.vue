<!--
* @Component: 系统设置页面
* @Description: 用户偏好设置
-->
<script setup lang="ts">
import { useSnackbarStore } from "@/stores/snackbarStore";

const snackbarStore = useSnackbarStore();

// 设置项
const settings = reactive({
  notifications: {
    email: true,
    system: true,
    taskReminder: true,
    reviewReminder: false
  },
  display: {
    itemsPerPage: 10,
    theme: 'light',
    language: 'zh-CN'
  },
  privacy: {
    showProfile: true,
    showEmail: false,
    showPhone: false
  }
});

// 保存设置
const saveSettings = () => {
  // TODO: 调用API保存设置
  localStorage.setItem('userSettings', JSON.stringify(settings));
  snackbarStore.showSuccessMessage('设置已保存');
};

// 重置设置
const resetSettings = () => {
  Object.assign(settings, {
    notifications: {
      email: true,
      system: true,
      taskReminder: true,
      reviewReminder: false
    },
    display: {
      itemsPerPage: 10,
      theme: 'light',
      language: 'zh-CN'
    },
    privacy: {
      showProfile: true,
      showEmail: false,
      showPhone: false
    }
  });
  snackbarStore.showSuccessMessage('设置已重置');
};

// 加载设置
onMounted(() => {
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings));
  }
});
</script>

<template>
  <v-card elevation="2" class="settings-card">
    <!-- 头部工具栏 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon start color="primary">mdi-cog</v-icon>
        系统设置
      </v-toolbar-title>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 设置内容 -->
    <perfect-scrollbar class="settings-content">
      <v-container fluid class="pa-6">
        <!-- 通知设置 -->
        <v-card elevation="0" class="mb-6">
          <v-card-title>
            <v-icon start>mdi-bell</v-icon>
            通知设置
          </v-card-title>
          <v-card-text>
            <v-switch
              v-model="settings.notifications.email"
              label="邮件通知"
              color="primary"
              hide-details
              class="mb-3"
            ></v-switch>
            
            <v-switch
              v-model="settings.notifications.system"
              label="系统通知"
              color="primary"
              hide-details
              class="mb-3"
            ></v-switch>
            
            <v-switch
              v-model="settings.notifications.taskReminder"
              label="任务提醒"
              color="primary"
              hide-details
              class="mb-3"
            ></v-switch>
            
            <v-switch
              v-model="settings.notifications.reviewReminder"
              label="评审提醒"
              color="primary"
              hide-details
            ></v-switch>
          </v-card-text>
        </v-card>

        <!-- 显示设置 -->
        <v-card elevation="0" class="mb-6">
          <v-card-title>
            <v-icon start>mdi-monitor</v-icon>
            显示设置
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="settings.display.itemsPerPage"
              :items="[10, 20, 50, 100]"
              label="每页显示条数"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-select>
            
            <v-select
              v-model="settings.display.theme"
              :items="[
                { value: 'light', title: '浅色主题' },
                { value: 'dark', title: '深色主题' },
                { value: 'auto', title: '跟随系统' }
              ]"
              label="界面主题"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-select>
            
            <v-select
              v-model="settings.display.language"
              :items="[
                { value: 'zh-CN', title: '简体中文' },
                { value: 'en-US', title: 'English' }
              ]"
              label="界面语言"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-card-text>
        </v-card>

        <!-- 隐私设置 -->
        <v-card elevation="0" class="mb-6">
          <v-card-title>
            <v-icon start>mdi-shield-lock</v-icon>
            隐私设置
          </v-card-title>
          <v-card-text>
            <v-switch
              v-model="settings.privacy.showProfile"
              label="公开个人资料"
              color="primary"
              hide-details
              class="mb-3"
            ></v-switch>
            
            <v-switch
              v-model="settings.privacy.showEmail"
              label="公开邮箱地址"
              color="primary"
              hide-details
              class="mb-3"
            ></v-switch>
            
            <v-switch
              v-model="settings.privacy.showPhone"
              label="公开手机号码"
              color="primary"
              hide-details
            ></v-switch>
          </v-card-text>
        </v-card>

        <!-- 操作按钮 -->
        <v-row>
          <v-col cols="12" class="text-center">
            <v-btn
              variant="text"
              class="mr-2"
              @click="resetSettings"
            >
              重置设置
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="saveSettings"
            >
              保存设置
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </perfect-scrollbar>
  </v-card>
</template>

<style scoped lang="scss">
.settings-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  overflow: hidden;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  background-color: #f9f9f9;
  
  .v-card {
    border: 1px solid #e0e0e0;
    border-radius: 12px !important;
  }
}
</style>