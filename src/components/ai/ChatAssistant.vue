<!--
* @Component:
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { useDisplay } from "vuetify";
import { useSnackbarStore } from "@/stores/snackbarStore";
import AnimationAi from "@/components/animations/AnimationBot1.vue";
import { read, countAndCompleteCodeBlocks } from "@/utils/aiUtils";
import { scrollToBottom } from "@/utils/common";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/preview.css";

import { useChatGPTStore } from "@/stores/chatGPTStore";

import { useProfileStore } from "@/stores/profileStore";
const profileStore = useProfileStore();
const user = computed(() => profileStore.user);
const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();

// 保持旧的数据结构用于显示
interface Message {
  content: string;
  role: "user" | "assistant" | "system";
}

// 新增：API用的数据结构
interface ApiMessage {
  role: "user" | "assistant" | "system";
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// User Input Message
const userMessage = ref("");

// Prompt Message
const promptMessage = computed(() => {
  console.log("chatGPTStore.propmpt", chatGPTStore.propmpt);

  return [
    {
      content: chatGPTStore.propmpt,
      role: "system",
    },
  ];
});

// Message List - 保持旧格式
const messages = ref<Message[]>([]);

// 🔥 新增：转换为API格式的计算属性
const requestMessages = computed(() => {
  let messagesToSend = [];
  
  if (messages.value.length <= 10) {
    messagesToSend = [...promptMessage.value, ...messages.value];
  } else {
    const slicedMessages = messages.value.slice(-10);
    messagesToSend = [...promptMessage.value, ...slicedMessages];
  }
  
  // 转换为API需要的格式
  return messagesToSend.map(msg => ({
    role: msg.role,
    content: [{
      type: 'text',
      text: msg.content
    }]
  }));
});

const isLoading = ref(false);

// Send Messsage - 保持不变
const sendMessage = async () => {
  if (userMessage.value) {
    // Add the message to the list
    messages.value.push({
      content: userMessage.value,
      role: "user",
    });

    // Clear the input
    userMessage.value = "";

    // Create a completion
    await createCompletion();
  }
};

const createCompletion = async () => {
  isLoading.value = true; // 🔥 添加加载状态

  try {
    // 🔥 使用转换后的消息格式
    const completion = await fetch(
      `${chatGPTStore.proxyUrl}/v1/chat/completions`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chatGPTStore.getApiKey}`,
        },
        method: "POST",
        body: JSON.stringify({
          messages: requestMessages.value, // 使用转换后的格式
          model: chatGPTStore.model,
          stream: true,
        }),
      }
    );

    // Handle errors
    if (!completion.ok) {
      const errorData = await completion.json();
      snackbarStore.showErrorMessage(errorData.error.message);
      return;
    }

    // Create a reader
    const reader = completion.body?.getReader();
    if (!reader) {
      snackbarStore.showErrorMessage("Cannot read the stream.");
      return;
    }

    // Add the bot message - 保持旧格式
    messages.value.push({
      content: "",
      role: "assistant",
    });

    // 🔥 创建一个临时的新格式数组用于read函数
    const tempMessages = ref([{
      role: "assistant" as const,
      content: [{ type: "text" as const, text: "" }]
    }]);

    // Read the stream
    await read(reader, tempMessages);

    // 🔥 将结果同步回旧格式
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage && tempMessages.value[0]) {
      lastMessage.content = tempMessages.value[0].content[0]?.text || "";
    }

  } catch (error) {
    snackbarStore.showErrorMessage(error.message);
  } finally {
    isLoading.value = false; // 🔥 结束加载状态
  }
};

watch(
  () => messages.value,
  (val) => {
    if (val) {
      scrollToBottom(document.querySelector(".message-container"));
    }
  },
  {
    deep: true,
  }
);

// 🔥 简化 displayMessages，因为现在content确保是string
const displayMessages = computed(() => {
  if (messages.value.length === 0) return []; 
  
  const messagesCopy = messages.value.slice();
  const lastMessage = messagesCopy[messagesCopy.length - 1];
  
  if (lastMessage && lastMessage.content) {
    const updatedLastMessage = {
      ...lastMessage,
      content: countAndCompleteCodeBlocks(lastMessage.content),
    };
    messagesCopy[messagesCopy.length - 1] = updatedLastMessage;
  }
  
  return messagesCopy;
});

const handleKeydown = (e) => {
  if (e.key === "Enter" && (e.altKey || e.shiftKey)) {
    // 当同时按下 alt或者shift 和 enter 时，插入一个换行符
    e.preventDefault();
    userMessage.value += "\n";
  } else if (e.key === "Enter") {
    // 当只按下 enter 时，发送消息
    e.preventDefault();
    sendMessage();
  }
};

const inputRow = ref(1);

const dialog = ref(false);
const { xs } = useDisplay();
</script>

<template>
  <v-btn size="50" @click="dialog = !dialog">
    <v-icon size="30">mdi-chat-outline </v-icon>
    <v-tooltip
      activator="parent"
      location="left"
      :text="$t('toolbox.chatAssistant.title')"
    ></v-tooltip>
  </v-btn>

  <teleport to="body">
    <transition name="slide-y">
      <v-card
        v-if="dialog"
        class="dialog-bottom d-flex flex-column"
        :width="xs ? '100%' : '600px'"
        height="500px"
      >
        <v-card-title>
          <span class="flex-fill">
            <v-avatar size="40">
              <img
                src="https://img.icons8.com/color/96/null/filled-chat.png"
                alt="alt"
              />
            </v-avatar>

            OpenAi Chat
          </span>

          <v-spacer></v-spacer>
          <v-btn icon @click.stop="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="overflow-scroll">
          <perfect-scrollbar
            v-if="messages.length > 0"
            class="message-container"
          >
            <template v-for="message in displayMessages">
              <div v-if="message.role === 'user'">
                <div class="pa-2 user-message">
                  <v-avatar class="ml-2" rounded="sm" variant="elevated">
                    <img
                      :src="user?.avatarUrl || 'https://i.pinimg.com/736x/af/f4/56/aff45698092ec2541d641407584d5fc0.jpg'"
                      alt="alt"
                    />
                  </v-avatar>
                  <v-card class="gradient gray text-pre-wrap" theme="dark">
                    <v-card-text>
                      <b> {{ message.content }}</b></v-card-text
                    >
                  </v-card>
                </div>
              </div>
              <div v-else>
                <div class="pa-2 assistant-message">
                  <v-avatar
                    class="d-none d-md-block mr-2"
                    rounded="sm"
                    variant="elevated"
                  >
                    <img
                      src="@/assets/images/avatars/avatar_assistant.jpg"
                      alt="alt"
                    />
                  </v-avatar>
                  <v-card>
                    <div>
                      <md-preview
                        :modelValue="message.content"
                        class="font-1"
                      />
                    </div>
                  </v-card>
                </div>
              </div>
            </template>
            
            
          </perfect-scrollbar>
        </v-card-text>
        <v-divider />

        <v-sheet
          color="transparent"
          elevation="0"
          class="d-flex align-end justify-center pa-2"
        >
          <v-btn
            class="mb-1"
            variant="elevated"
            size="42"
            icon
            @click="chatGPTStore.configDialog = true"
            :disabled="isLoading"
          >
            <v-icon size="30" class="text-primary">mdi-cog-outline</v-icon>
            <v-tooltip
              activator="parent"
              location="top"
              text="ChatGPT Config"
            ></v-tooltip>
          </v-btn>

          <v-textarea
            class="mx-2"
            color="primary"
            type="text"
            clearable
            variant="solo"
            ref="input"
            v-model="userMessage"
            placeholder="Ask Anything"
            hide-details
            @keydown="handleKeydown"
            :rows="inputRow"
            @focus="inputRow = 2"
            @blur="inputRow = 1"
            :disabled="isLoading"
          >
          </v-textarea>

          <v-btn size="42" class="mb-1" color="primary" variant="elevated" icon :disabled="isLoading">
            <v-icon @click="sendMessage" size="20">mdi-send</v-icon>
          </v-btn>
        </v-sheet>
      </v-card>
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
.dialog-bottom {
  z-index: 999;
  position: fixed;
  bottom: 10px;
  right: 0px;
}

.chat-bot {
  background-repeat: repeat;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

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
  height: 300px;

  background-repeat: repeat;
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

:deep(#md-editor-v3-preview),
.user-message {
  font-size: 14px !important;
}
</style>