<template>
  <v-container class="chat-container">
    <v-card class="chat-card mx-auto" elevation="4">
      <v-toolbar color="primary" dark dense>
        <v-btn icon @click="goBack"><v-icon>mdi-arrow-left</v-icon></v-btn>
        <v-toolbar-title>与用户 {{ contactId }} 的对话</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip small :color="isConnected ? 'green' : 'red'" text-color="white">{{ isConnected ? '已连接' : '未连接' }}</v-chip>
      </v-toolbar>

      <v-card-text ref="messageArea" class="message-area">
        <div v-if="loading" class="text-center pa-5">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2 text-grey">正在加载历史消息...</p>
        </div>
        <div v-else-if="chatMessages.length === 0" class="text-center pa-5 text-grey">
          暂无消息，开始你的对话吧！
        </div>
        <div v-else>
          <div v-for="msg in chatMessages" :key="msg.id" class="message-wrapper" :class="{'my-message': msg.senderId === String(currentUser?.id)}">
            <div class="message-bubble">
              <p class="message-content">{{ msg.content }}</p>
              <div class="message-time">{{ formatTime(msg.sendTime) }}</div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="input-area pa-2">
        <v-textarea v-model="newMessage" placeholder="输入消息..." rows="1" auto-grow hide-details variant="solo" @keydown.enter.prevent="handleSendMessage"></v-textarea>
        <v-btn icon="mdi-send" color="primary" class="ml-2" @click="handleSendMessage" :disabled="!newMessage.trim() || !isConnected"></v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useProfileStore } from '@/stores/profileStore';
import { useWebSocket, type MessagePayload } from '@/utils/websocket';

const route = useRoute();
const router = useRouter();
const profileStore = useProfileStore();
const { isConnected, messages: globalMessages, send } = useWebSocket();

const chatMessages = ref<MessagePayload[]>([]);
const newMessage = ref('');
const loading = ref(true);
const messageArea = ref<any>(null);

const currentUser = computed(() => profileStore.user);
const contactId = computed(() => route.params.contactId as string);

const fetchHistory = async () => {
  if (!currentUser.value?.id || !contactId.value) return;
  loading.value = true;
  try {
    const response = await axios.get('/api/messages/history/all', {
      params: {
        userId: currentUser.value.id,
        contactId: contactId.value,
        pageNum: 1,
        pageSize: 100,
      }
    });
    if (response.data.code === 200 && response.data.data.records) {
      chatMessages.value = response.data.data.records.reverse();
    }
  } catch (error) {
    console.error("[ChatPage] 加载历史消息失败:", error);
  } finally {
    loading.value = false;
    scrollToBottom('auto'); // 初始加载时快速滚动
  }
};

const markMessagesAsRead = async () => {
  const unreadMessagesFromContact = globalMessages.value.filter(
    m => m.senderId === contactId.value && m.readStatus === 0
  );
  if (unreadMessagesFromContact.length === 0) return;

  for (const msg of unreadMessagesFromContact) {
    try {
      const params = new URLSearchParams();
      params.append('messageId', String(msg.id));
      await axios.post('/api/messages/read', params);
      
      const msgInStore = globalMessages.value.find(m => m.id === msg.id);
      if (msgInStore) msgInStore.readStatus = 1;
    } catch (error) {
      console.error(`[ChatPage] 标记消息 ${msg.id} 为已读失败:`, error);
    }
  }
};

const handleSendMessage = () => {
  if (!isConnected.value || !newMessage.value.trim() || !currentUser.value?.id) return;

  const payload = {
    from: String(currentUser.value.id),
    to: contactId.value,
    content: newMessage.value.trim(),
  };
  send(payload);

  const optimisticMessage: MessagePayload = {
    id: String(Date.now()),
    senderId: String(currentUser.value.id),
    receiverId: contactId.value,
    content: payload.content,
    sendTime: new Date().toISOString(),
    readStatus: 1,
  };
  chatMessages.value.push(optimisticMessage);
  newMessage.value = '';
  scrollToBottom();
};

const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
  nextTick(() => {
    const containerComponent = messageArea.value;
    if (containerComponent) {
      const element = containerComponent.$el || containerComponent;
      if (element && typeof element.scrollTo === 'function') {
        element.scrollTo({ top: element.scrollHeight, behavior });
      }
    }
  });
};

const goBack = () => router.back();
const formatTime = (timestamp?: string) => timestamp ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';

onMounted(fetchHistory);

watch(globalMessages, (currentGlobalMessages) => {
  const newMessagesForThisChat = currentGlobalMessages.filter(
    globalMsg => 
      (globalMsg.senderId === contactId.value || (globalMsg.senderId === String(currentUser.value?.id) && globalMsg.receiverId === contactId.value)) 
      && !chatMessages.value.some(chatMsg => chatMsg.id === globalMsg.id)
  );
  
  if (newMessagesForThisChat.length > 0) {
    chatMessages.value.push(...newMessagesForThisChat);
    scrollToBottom();
  }
  markMessagesAsRead();
}, { deep: true, immediate: true });
</script>

<style scoped>
.chat-container { height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; padding: 0; }
.chat-card { width: 100%; max-width: 100%; height: 100%; display: flex; flex-direction: column; border-radius: 0; }
@media (min-width: 600px) { .chat-card { max-width: 800px; height: calc(100% - 32px); border-radius: 4px; } }
.message-area { flex-grow: 1; overflow-y: auto; padding: 16px; background-color: #f5f5f5; }
.message-wrapper { display: flex; margin-bottom: 12px; }
.my-message { justify-content: flex-end; }
.message-bubble { max-width: 70%; padding: 10px 15px; border-radius: 18px; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.my-message .message-bubble { background-color: rgb(var(--v-theme-primary)); color: white; border-bottom-right-radius: 4px; }
.message-wrapper:not(.my-message) .message-bubble { background-color: white; color: black; border-bottom-left-radius: 4px; }
.message-content { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
.message-time { font-size: 0.75rem; color: rgba(255, 255, 255, 0.7); text-align: right; margin-top: 4px; }
.message-wrapper:not(.my-message) .message-time { color: #9e9e9e; }
.input-area { background-color: #f5f5f5; padding: 8px !important; }
</style>