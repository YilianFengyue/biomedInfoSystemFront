<!--
* @Component: BackToTop
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useChatGPTStore } from "@/stores/chatGPTStore";
const chatGPTStore = useChatGPTStore();
import ApiKeyDialog from "@/components/ApiKeyDialog.vue";
import ChatAssistant from "@/components/ai/ChatAssistant.vue";
import TranslationAssistant from "@/components/ai/TranslationAssistant.vue";
import InspirationBoard from "@/components/InspirationBoard.vue";
const toolboxShow = ref(false);
</script>

<template>
  <v-btn
    class="toolbox-activator elevation-10"
    @click="toolboxShow = !toolboxShow"
    size="50"
    color="white"
  >
    <!-- <Icon width="30" icon="ri:openai-fill" /> -->
     <!-- 支持Deepseek -->
    <img src="@/assets/images/avatars/deepseek.png" alt="DeepSeek Logo" width="30" height="30" />
  </v-btn>

  <transition name="slide-y">
    <v-card
      v-if="toolboxShow"
      elevation="10"
      class="d-flex flex-column mb-1 toolbox"
    >
      <!-- ---------------------------------------------- -->
      <!-- ApiKey -->
      <!-- ---------------------------------------------- -->
      <v-btn
        @click="chatGPTStore.configDialog = true"
        variant="text"
        size="50"
        color="blue"
      >
        <v-icon size="30">mdi-key-outline</v-icon>
        <v-tooltip
          activator="parent"
          location="left"
          :text="$t('toolbox.chatgptConfig.title')"
        ></v-tooltip>
      </v-btn>
      <ApiKeyDialog />
      <v-divider />
      <!-- ---------------------------------------------- -->
      <!-- Chat Assistant -->
      <!-- ---------------------------------------------- -->
      <ChatAssistant />
      <v-divider />
       <!-- ---------------------------------------------- -->
      <!-- Translation Assistant -->
      <!-- ---------------------------------------------- -->
      <TranslationAssistant />
      <v-divider />
       <!-- ---------------------------------------------- -->
        <!-- Inspiration Board -->
      <!-- ---------------------------------------------- -->
      <InspirationBoard />
      <v-divider />
      <!-- ---------------------------------------------- -->
    </v-card>
  </transition>
</template>

<style scoped lang="scss">
.toolbox {
  z-index: 999;
  position: fixed;
  bottom: 150px;
  right: 5px;
}

.toolbox-activator {
  position: fixed;
  transition: all 0.3s ease;
  bottom: 100px;
  right: 5px;
  z-index: 999;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s;
  cursor: pointer;
}
</style>
