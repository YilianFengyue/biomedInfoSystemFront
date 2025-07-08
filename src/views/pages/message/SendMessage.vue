<template>
  <v-container>
    <v-card max-width="800" class="mx-auto pa-5" elevation="4">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center">
        <v-icon color="primary" class="mr-3">mdi-send</v-icon>
        发送新消息
      </v-card-title>
      <v-divider class="my-4"></v-divider>

      <v-card-text>
        <v-form ref="form" v-model="isFormValid">
          <v-text-field
            v-model="recipientId"
            label="收件人ID"
            placeholder="请输入对方的用户ID"
            variant="outlined"
            :rules="[v => !!v || '收件人ID不能为空']"
            class="mb-4"
          ></v-text-field>

          <v-textarea
            v-model="messageContent"
            label="消息内容"
            variant="outlined"
            rows="5"
            counter
            :rules="[v => !!v || '消息内容不能为空', v => v.length <= 500 || '消息不能超过500字']"
          ></v-textarea>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          size="large" 
          @click="handleSendMessage" 
          :loading="isSending"
          :disabled="!isFormValid || !isConnected"
        >
          {{ isConnected ? '发送' : '连接消息服务中...' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProfileStore } from "@/stores/profileStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useWebSocket } from '@/utils/websocket';

const route = useRoute();
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();

// 从中央服务获取状态和方法
const { isConnected, send } = useWebSocket();

const recipientId = ref(route.query.recipientId as string || '');
const messageContent = ref('');
const isSending = ref(false);
const form = ref<any>(null); // 表单引用
const isFormValid = ref(false);

const senderId = computed(() => profileStore.user?.id);

const handleSendMessage = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    snackbarStore.showWarningMessage('请检查输入内容');
    return;
  }
  
  if (!isConnected.value) {
    snackbarStore.showErrorMessage('消息服务当前不可用，请稍后重试。');
    return;
  }

  if (!senderId.value) {
      snackbarStore.showErrorMessage('无法获取您的用户信息，请重新登录。');
      return;
  }

  isSending.value = true;
  
  const messagePayload = {
    from: String(senderId.value),
    to: recipientId.value,
    content: messageContent.value,
  };

  try {
    send(messagePayload); // 调用中央服务的发送方法
    snackbarStore.showSuccessMessage('消息已发送！');
    messageContent.value = ''; 
    form.value?.resetValidation();
  } catch (error) {
     snackbarStore.showErrorMessage('消息发送失败！');
     console.error("发送消息时出错:", error);
  } finally {
     isSending.value = false;
  }
};
</script>