<template>
  <div class="ai-research-assistant">
    <div class="messsage-area">
      <perfect-scrollbar v-if="messages.length > 0" class="message-container">
        <template v-for="message in messages" :key="message.timestamp">
          <div v-if="message.isUser" class="pa-4 user-message">
            <v-avatar class="ml-4" rounded="sm" variant="elevated">
              <img :src="user.avatarUrl || defaultAvatar" alt="user" />
            </v-avatar>
            <v-card class="gradient gray text-pre-wrap" theme="dark">
              <v-card-text><b>{{ message.text }}</b></v-card-text>
            </v-card>
          </div>
          <div v-else class="pa-2 pa-md-5 assistant-message">
            <v-avatar class="d-none d-md-block mr-2 mr-md-4" rounded="sm" variant="elevated">
              <img src="@/assets/images/avatars/avatar_assistant.jpg" alt="assistant" />
            </v-avatar>
            <v-card>
              <div v-html="formatMessage(message.text)"></div>
            </v-card>
          </div>
        </template>
      </perfect-scrollbar>
      <div v-else class="no-message-container">
        <h1 class="text-h4 text-md-h2 text-primary font-weight-bold">AI 科研助手</h1>
        <p class="text-h6 text-grey-darken-1 mt-2">随时为您提供学术支持</p>
        <AnimationAi :size="300" />
      </div>
    </div>

    <div class="input-area">
      <v-sheet color="transparent" class="input-panel d-flex align-center pa-2">
        <v-btn-toggle v-model="selectedMode" variant="outlined" density="compact" mandatory>
          <v-btn value="qa" title="智能问答"><v-icon>mdi-chat-question-outline</v-icon></v-btn>
          <v-btn value="proposal" title="生成开题报告"><v-icon>mdi-file-document-edit-outline</v-icon></v-btn>
        </v-btn-toggle>
        <v-text-field
          v-model="inputMessage"
          :placeholder="inputPlaceholder"
          class="mx-3"
          variant="solo"
          rounded
          hide-details
          @keydown.enter="sendMessage"
          :loading="isTyping"
        ></v-text-field>
        <v-btn color="primary" @click="sendMessage" :disabled="isTyping" icon="mdi-send" />
      </v-sheet>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useProfileStore } from "@/stores/profileStore";
import { useApi } from '@/composables/useApi'; // 假设你有一个封装好的API请求
import { marked } from 'marked';
import { perfectScrollbar } from 'vue3-perfect-scrollbar';
import AnimationAi from "@/components/animations/AnimationBot1.vue";
import defaultAvatar from '@/assets/images/avatars/avatar_user.jpg';

const profileStore = useProfileStore();
const { request } = useApi(); // 假设的API请求方法

const user = computed(() => profileStore.user || {});
const messages = ref([]);
const inputMessage = ref('');
const isTyping = ref(false);
const selectedMode = ref('qa'); // 'qa' 或 'proposal'

const inputPlaceholder = computed(() => {
  return selectedMode.value === 'qa' ? '输入您的问题，例如：川芎的功效与作用' : '输入您的研究课题，例如：血府逐瘀汤治疗冠心病机制研究';
});

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;
  
  const userMessageText = inputMessage.value;
  messages.value.push({ text: userMessageText, isUser: true, timestamp: new Date() });
  inputMessage.value = '';
  isTyping.value = true;
  
  try {
    let response;
    if (selectedMode.value === 'qa') {
      response = await request.post('/api/ai/qa', { question: userMessageText });
    } else {
      response = await request.post('/api/ai/research-proposal', { topic: userMessageText });
    }
    messages.value.push({ text: response.data.answer || response.data.proposal, isUser: false, timestamp: new Date() });
  } catch (error) {
    messages.value.push({ text: '抱歉，AI助手暂时不可用。', isUser: false, timestamp: new Date() });
  } finally {
    isTyping.value = false;
    nextTick(() => {
        const container = document.querySelector('.message-container .ps');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    });
  }
};

const formatMessage = (text) => marked(text);
</script>

<style scoped>
.ai-research-assistant {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* 减去Appbar的高度 */
}
.messsage-area {
  flex-grow: 1;
  overflow-y: auto;
}
.input-area {
  flex-shrink: 0;
  padding: 1rem;
  background-color: #f5f5f5;
}
.message-container {
  height: 100%;
}
.user-message {
  display: flex; justify-content: flex-end;
}
.assistant-message {
  display: flex; justify-content: flex-start;
}
.no-message-container {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
</style>