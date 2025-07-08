<!-- ChatBot.vue -->
<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';

// 导入你的 stores 和 UI 组件
import { useProfileStore } from "@/stores/profileStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useChatGPTStore } from "@/stores/chatGPTStore"; // 后续可重命名
import { read } from "@/utils/aiUtils";
import { scrollToBottom } from "@/utils/common";

import AnimationChat from "@/components/animations/AnimationChat1.vue";
import AnimationAi from "@/components/animations/AnimationBot1.vue";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";
import ApiKeyDialog from "@/components/ApiKeyDialog.vue";
import FileUploadDialog from './FileUploadDialog.vue';

// --- 1. 定义适配 Gemini 的数据结构 ---
type MessagePart = {
  type: 'text';
  text: string;
};
// 扩展文件信息
interface FileInfo {
  url: string;
  name: string;
  type: string;
}
interface Message {
  role: "user" | "assistant" | "system";
  content: MessagePart[];
}

// --- 2. 初始化所有状态 ---
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();
const user = computed(() => profileStore.user);
const messages = ref<Message[]>([]);
const userMessage = ref("");
const isLoading = ref(false); // 用于控制加载条
const inputRow = ref(1);
// 新增：文件上传相关状态
const fileUploadDialog = ref(false);
const pendingFiles = ref<FileInfo[]>([]); // 待发送的文件

// --- 3. 核心交互逻辑 ---

// 发送消息
const sendMessage = async () => {
  const messageText = userMessage.value.trim();
  if (!messageText && pendingFiles.value.length === 0) return;

  // 构建消息内容
  const content: MessagePart[] = [];
  
  // 添加文本内容
  if (messageText) {
    content.push({ type: 'text', text: messageText });
  }
  
  // 添加文件内容
  pendingFiles.value.forEach(file => {
    content.push({
      type: 'file_url',
      file_url: { url: file.url }
    });
  });

  // 将用户输入包装成新的数据结构
  messages.value.push({
    role: "user",
    content,
    files: [...pendingFiles.value] // 保存文件信息用于显示
  });

  userMessage.value = "";
  pendingFiles.value = []; // 清空待发送文件
  await createCompletion();
};


// 调用 API
const createCompletion = async () => {
  const proxyUrl = chatGPTStore.proxyUrl || "https://api.vveai.com";
  isLoading.value = true;

  // 转换历史消息，以适配 API 要求
  const historyMessages = messages.value.slice(-10);

  // 如果有全局prompt，也加进去
  const requestPayload = [...historyMessages];
  if(chatGPTStore.propmpt) {
    // 假设prompt也是字符串，需要包装
    requestPayload.unshift({ role: 'system', content: [{type: 'text', text: chatGPTStore.propmpt}] });
  }


  try {
    const completion = await fetch(`${proxyUrl}/v1/chat/completions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chatGPTStore.getApiKey}`,
      },
      method: "POST",
      body: JSON.stringify({
        messages: requestPayload,
        model: chatGPTStore.model,
        stream: true,
      }),
    });

    if (!completion.ok) {
      const errorData = await completion.json();
      throw new Error(errorData.error.message || "请求失败，请检查网络或API Key。");
    }

    const reader = completion.body?.getReader();
    if (!reader) throw new Error("无法读取响应流。");

    // 预置一个空的助手消息，结构要正确
    messages.value.push({
      role: "assistant",
      content: [{ type: "text", text: "" }],
    });

    // 调用修正后的 read 函数
    await read(reader, messages);

  } catch (error: any) {
    snackbarStore.showErrorMessage(error.message);
  } finally {
    isLoading.value = false; // 确保请求结束后关闭加载状态
  }
};

// --- 4. 新增：文件处理逻辑 ---
const openFileUpload = () => {
  fileUploadDialog.value = true;
};

const handleFileUploaded = (fileUrl: string, fileName: string, fileType: string) => {
  pendingFiles.value.push({
    url: fileUrl,
    name: fileName,
    type: fileType
  });
};

// --- 4. 辅助函数 ---
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey && !isLoading.value) {
    e.preventDefault();
    sendMessage();
  }
};
const removeFile = (index: number) => {
  pendingFiles.value.splice(index, 1);
};

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return 'mdi-file-pdf-box';
  if (type.includes('text')) return 'mdi-file-document';
  if (type.includes('image')) return 'mdi-file-image';
  return 'mdi-file';
};

// 确保能自动滚动
watch(messages, () => {
  // 使用 nextTick 确保在DOM更新后再滚动
  import('vue').then(({ nextTick }) => {
    nextTick(() => {
      scrollToBottom(document.querySelector(".message-container"));
    });
  });
}, { deep: true });

</script>

<template>
  <div class="chat-bot">
    <div class="messsage-area">
      <!-- 聊天记录区 -->
      <perfect-scrollbar v-if="messages.length > 0" class="message-container">
        <template v-for="(message, index) in messages" :key="index">
          <!-- 用户消息 -->
          <div v-if="message.role === 'user'" class="pa-4 user-message">
            <v-avatar class="ml-4" rounded="sm" variant="elevated">
              <img :src="user?.avatarUrl || 'https://i.pinimg.com/736x/af/f4/56/aff45698092ec2541d641407584d5fc0.jpg'"
              alt="user avatar" />
            </v-avatar>
            <v-card class="gradient gray text-pre-wrap" theme="dark">
              <v-card-text>
                <b>{{ message.content[0]?.text || '' }}</b>
              </v-card-text>
            </v-card>
          </div>
          <!-- AI 助手消息 -->
          <div v-else-if="message.role === 'assistant'" class="pa-2 pa-md-5 assistant-message">
            <v-avatar class="d-none d-md-block mr-2 mr-md-4" rounded="sm" variant="elevated">
              <img src="@/assets/images/avatars/avatar_assistant.jpg" alt="assistant avatar" />
            </v-avatar>
            <v-card>
              <!-- ✨ 加载条已从此移除 -->
              <div>
                <md-preview :modelValue="message.content[0]?.text || ''" class="font-1" />
              </div>
            </v-card>
          </div>
        </template>
      </perfect-scrollbar>
      <!-- 欢迎页 -->
      <div class="no-message-container mt-10" v-else>
        <h1 class="text-h4 text-md-h2 text-primary font-weight-bold">Chat with Agent</h1>
        <AnimationChat :size="300" />
      </div>
    </div>
    
    <!-- 输入区 -->
    <div class="input-area">
      <!-- 待发送文件预览 -->
      <div v-if="pendingFiles.length > 0" class="pending-files-preview pa-2">
        <v-card variant="elevated" class="pa-2" max-width="400px">
          <div class="d-flex align-center flex-wrap">
            <span class="text-caption text-medium-emphasis mr-2">待发送文件：</span>
            <v-chip v-for="(file, index) in pendingFiles" 
                    :key="index"
                    class="mr-1 mb-1"
                    size="small"
                    closable
                    @click:close="removeFile(index)">
              <v-icon start :icon="getFileIcon(file.type)"></v-icon>
              {{ file.name }}
            </v-chip>
          </div>
        </v-card>
      </div>
      <v-sheet color="transparent" elevation="0" class="input-panel d-flex align-end pa-1">
        <!-- 配置按钮 -->
        <v-btn class="mb-1" variant="elevated" icon @click="chatGPTStore.configDialog = true" :disabled="isLoading">
          <v-icon size="30" class="text-primary">mdi-cog-outline</v-icon>
        </v-btn>
        
        <!-- 文件按钮 (暂时只是个占位符) -->
        <v-btn class="mb-1 ml-1" variant="elevated" icon @click="openFileUpload" :disabled="isLoading">
          <v-icon size="30" class="text-primary">mdi-paperclip</v-icon>
        </v-btn>
        
        <!-- ✨ 输入框：加载条的核心修改 -->
        <v-textarea
          class="mx-2"
          color="primary"
          type="text"
          clearable
          variant="solo"
          v-model="userMessage"
          placeholder="Ask Gemini..."
          hide-details
          @keydown="handleKeydown"
          :rows="inputRow"
          @focus="inputRow = 3"
          @blur="inputRow = 1"
          :loading="isLoading"
          :disabled="isLoading"
        ></v-textarea>
        
        <!-- 发送按钮 -->
        <v-btn class="mb-1" color="primary" variant="elevated" icon @click="sendMessage" :disabled="isLoading">
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-sheet>
      <ApiKeyDialog />
      <FileUploadDialog 
        v-model="fileUploadDialog"
        @file-uploaded="handleFileUploaded" />
    </div>
  </div>
</template>

<!-- 样式部分保持不变 -->
<style scoped lang="scss">
.chat-bot {
    min-height: 90vh;
    display: flex;
    flex-direction: column;

  .messsage-area {
    flex: 1;
    height: 100%;
  }

  .input-area {
    position: absolute;
    width: 100%;
    bottom: 0;
    padding: 1rem;
    align-items: center;

    .input-panel {
      border-radius: 5px;
      max-width: 1200px;
      margin: 0 auto;
    }
     // 新增：待发送文件预览样式
    .pending-files-preview {
      max-width: 1200px;
      margin: 0 auto;
      margin-bottom: 8px;
    }
  }
}
.user-message {
  display: flex;
  align-content: center;
  justify-content: end;
  flex-direction: row-reverse;
}
.assistant-message {
  display: flex;
  align-content: center;
  justify-content: start;
  flex-direction: row;
}
.message {
  margin: 0 auto;
  max-width: 1200px;
  display: flex;
}
.message-container {
  height: calc(100vh - 154px);
}
.no-message-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  h1 {
    font-size: 2rem;
    font-weight: 500;
  }
}
:deep(.md-editor-preview-wrapper) {
  padding: 5px 15px;
}
.font-1 {
  font-size: 13px !important;
}
@media screen and (max-width: 768px) {
  :deep(#md-editor-v3-preview),
  .user-message {
    font-size: 14px !important;
  }
}
</style>
