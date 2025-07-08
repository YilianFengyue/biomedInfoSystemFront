<template>
  <v-menu
    location="bottom right"
    transition="slide-y-transition"
    :close-on-content-click="false"
    width="400"
  >
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="text-none">
        <v-badge :content="totalUnreadCount" color="error" :model-value="totalUnreadCount > 0">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card>
      <v-list lines="two" density="compact">
        <v-list-subheader class="font-weight-bold">消息中心</v-list-subheader>
        <v-divider />

        <div v-if="!isConnected" class="pa-8 text-center text-grey">
          <v-icon size="48" class="mb-2">mdi-wifi-off</v-icon>
          <p>消息服务未连接</p>
        </div>
        <div v-else-if="conversations.length === 0" class="pa-8 text-center text-grey">
           <v-icon size="48" class="mb-2">mdi-message-text-outline</v-icon>
          <p>暂无消息</p>
        </div>

        <div v-else class="message-list-container">
          <v-list-item
            v-for="convo in conversations"
            :key="convo.contactId"
            @click="handleConversationClick(convo)"
            link
            :class="{ 'unread-conversation': convo.unreadCount > 0 }"
          >
            <template v-slot:prepend>
              <v-badge
                :content="convo.unreadCount"
                color="error"
                :model-value="convo.unreadCount > 0"
                offset-x="8"
                offset-y="8"
              >
                <v-avatar color="primary">
                  <span class="white--text text-h6">{{ String(convo.contactId).charAt(0).toUpperCase() }}</span>
                </v-avatar>
              </v-badge>
            </template>

            <v-list-item-title class="font-weight-bold">
              用户 {{ convo.contactId }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-truncate">
              {{ convo.lastMessage.content }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="text-caption text-grey">{{ formatTime(convo.lastMessage.sendTime) }}</div>
            </template>
          </v-list-item>
        </div>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useWebSocket, type MessagePayload } from '@/utils/websocket';
import { useProfileStore } from '@/stores/profileStore';

interface Conversation {
  contactId: string;
  lastMessage: MessagePayload;
  unreadCount: number;
}

const router = useRouter();
const profileStore = useProfileStore();
const { isConnected, messages: globalMessages } = useWebSocket();

const currentUser = computed(() => profileStore.user);

/**
 * 【核心逻辑】将会话列表进行分组和排序
 * 1. 从全局消息列表（globalMessages）中，找出所有与当前用户相关的对话。
 * 2. 按“对方ID”进行分组。
 * 3. 在每个分组内，找到最新的一条消息作为该会话的预览。
 * 4. 计算每个会话的未读消息数。
 * 5. 按最新消息的时间进行排序，确保最新的会话显示在最上面。
 */
const conversations = computed((): Conversation[] => {
  if (!currentUser.value?.id) return [];

  const conversationsMap = new Map<string, { messages: MessagePayload[] }>();

  // 遍历所有消息，按对方ID进行分组
  for (const msg of globalMessages.value) {
    const contactId = msg.senderId === String(currentUser.value.id) ? msg.receiverId : msg.senderId;
    if (!conversationsMap.has(contactId)) {
      conversationsMap.set(contactId, { messages: [] });
    }
    conversationsMap.get(contactId)!.messages.push(msg);
  }

  const result: Conversation[] = [];

  // 处理每个会话
  for (const [contactId, data] of conversationsMap.entries()) {
    // 按时间排序，找到最新的一条消息
    const sortedMessages = [...data.messages].sort((a, b) => new Date(b.sendTime).getTime() - new Date(a.sendTime).getTime());
    const lastMessage = sortedMessages[0];
    
    // 计算未读消息数
    const unreadCount = data.messages.filter(m => m.senderId === contactId && m.readStatus === 0).length;

    result.push({
      contactId,
      lastMessage,
      unreadCount,
    });
  }

  // 按最新消息时间对所有会话进行排序
  return result.sort((a, b) => new Date(b.lastMessage.sendTime).getTime() - new Date(a.lastMessage.sendTime).getTime());
});

/**
 * 计算所有会话的总未读数，用于显示在小铃铛上
 */
const totalUnreadCount = computed(() => {
  return conversations.value.reduce((total, convo) => total + convo.unreadCount, 0);
});

/**
 * 【核心功能】处理会话点击事件
 * 1. 将该会话内的所有未读消息标记为已读。
 * 2. 跳转到与该用户的完整聊天页面。
 */
const handleConversationClick = async (conversation: Conversation) => {
  // 找出所有需要标记为已读的消息
  const messagesToMark = globalMessages.value.filter(
    m => m.senderId === conversation.contactId && m.readStatus === 0
  );

  // 异步发送所有标记为已读的请求
  const markAsReadPromises = messagesToMark.map(async (msg) => {
    try {
      const params = new URLSearchParams();
      params.append('messageId', String(msg.id));
      await axios.post('/api/messages/read', params);
      
      // 直接更新全局状态，让界面实时响应
      const msgInStore = globalMessages.value.find(m => m.id === msg.id);
      if (msgInStore) {
        msgInStore.readStatus = 1;
      }
    } catch (err) {
      console.error(`标记消息 ${msg.id} 为已读失败:`, err);
    }
  });

  await Promise.all(markAsReadPromises);

  // 跳转到与该用户的完整聊天页面
  // 注意：我们仍然保留了 ChatPage，因为它是查看完整历史记录的最佳场所
  // 如果你确认不需要，可以注释掉这行
  router.push({ name: 'ChatPage', params: { contactId: conversation.contactId } });
};


/**
 * 格式化时间戳，用于显示在消息预览上
 */
const formatTime = (timestamp?: string) => {
  if (!timestamp) return '';
  const now = new Date();
  const msgTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - msgTime.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return '刚刚';
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
  if (diffInHours < 24) return `${diffInHours}小时前`;
  return `${diffInDays}天前`;
};
</script>

<style scoped>
.message-list-container {
  max-height: 450px; /* 增加最大高度以容纳更多会话 */
  overflow-y: auto;
}
.unread-conversation {
  background-color: rgba(var(--v-theme-primary), 0.05); /* 未读会话的背景高亮 */
}
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>