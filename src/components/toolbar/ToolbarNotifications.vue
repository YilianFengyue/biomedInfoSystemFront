// src/components/toolbar/ToolbarNotifications.vue

<script setup lang="ts">
import { computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useWebSocket } from '@/utils/websocket'; // 确保路径正确，可能是 @/utils/websocket

// 定义消息类型
interface Message {
  id: number;
  content: string;
  from: string; // 后端推送的可能是 from 或 senderId，我们需要兼容
  senderId?: string;
  readStatus: number; // 【已修复】将 status 修改为 readStatus
  timestamp?: string;
  sendTime?: string;
}

const router = useRouter();
const { isConnected, messages } = useWebSocket();

// 计算未读消息数量
const unreadCount = computed(() => {
  // 【已修复】根据 message.readStatus 进行过滤
  return messages.value.filter(m => m.readStatus === 0).length;
});

// 标记为已读
const markAsRead = async (message: Message) => {
  if (message.readStatus === 1) return;
  try {
    const params = new URLSearchParams();
    params.append('messageId', String(message.id));
    await axios.post('/api/messages/read', params); // 建议加上 /api 前缀，与 http.ts 保持一致
    
    const msgInStore = messages.value.find(m => m.id === message.id);
    if(msgInStore) {
        // 【已修复】更新正确的字段
        msgInStore.readStatus = 1; 
    }
  } catch (err) {
    console.error(`标记消息 ${message.id} 为已读失败:`, err);
  }
};

const handleMessageClick = (message: Message) => {
  // 我们不再需要在这里调用 markAsRead，因为进入聊天页面后会自动处理
  
  // 【核心修改】
  // 从消息中获取发件人ID
  const contactId = message.from || message.senderId;
  // 跳转到对应的聊天页面
  router.push({ name: 'ChatPage', params: { contactId: contactId } });
};

const formatTime = (message: Message) => {
  const timestamp = message.timestamp || message.sendTime;
  if (!timestamp) return '';
  const now = new Date();
  const msgTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - msgTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return '刚刚';
  if (diffInMinutes < 60) return `${diffInMinutes} 分钟前`;
  if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)} 小时前`;
  return `${Math.floor(diffInMinutes / (60 * 24))} 天前`;
};
</script>

<template>
  <v-menu location="bottom right" transition="slide-y-transition" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="text-none">
        <v-badge :content="unreadCount" color="error" :model-value="unreadCount > 0">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>
    
    <v-list elevation="1" lines="three" density="compact" width="400">
      <v-list-subheader class="font-weight-bold pl-2">消息列表</v-list-subheader>
      <v-divider />
      
      <div v-if="!isConnected" class="pa-4 text-center text-grey">
        消息服务未连接
      </div>
      <div v-else-if="messages.length === 0" class="pa-4 text-center text-grey">
        暂无消息
      </div>
      
      <div v-else class="message-list-container">
        <v-list-item 
          v-for="message in messages" 
          :key="message.id" 
          @click="handleMessageClick(message)"
          link
           :class="{'unread-message': message.readStatus === 0}"
        >
          <template v-slot:prepend>
             <v-badge dot :color="message.readStatus === 0 ? 'error' : 'transparent'" offset-x="-5">
                <v-avatar color="primary" size="40">
                  <span class="white--text text-h6">{{ String(message.from || message.senderId || 'S').charAt(0).toUpperCase() }}</span>
                </v-avatar>
             </v-badge>
          </template>
          
          <v-list-item-title class="font-weight-bold">
            来自用户 {{ message.from || message.senderId }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-truncate">{{ message.content }}</v-list-item-subtitle>
           <template v-slot:append>
            <div class="text-caption text-grey">{{ formatTime(message) }}</div>
           </template>
        </v-list-item>
      </div>
    </v-list>
  </v-menu>
</template>

<style scoped>
.message-list-container {
  max-height: 400px;
  overflow-y: auto;
}
.unread-message {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>