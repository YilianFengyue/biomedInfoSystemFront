<!--
* @Component:
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { useChatGPTStore } from "@/stores/chatGPTStore";
import { useLocale } from "vuetify";
import promptsZh from "@/data/ai/prompts-zh.json";
import promptsEn from "@/data/ai/prompts-en.json";
import promptsJa from "@/data/ai/prompts-ja.json";
import { Icon } from "@iconify/vue";
const { current } = useLocale();
const chatGPTStore = useChatGPTStore();

const close = () => {
  chatGPTStore.configDialog = false;
};

const apiKeyShow = ref(false);

const promptList = computed(() => {
    return promptsZh;
});
</script>

<template>
  <v-dialog v-model="chatGPTStore.configDialog" width="600">
    <v-card>
      <v-card-title class="font-weight-bold pa-5">
        智能助理配置</v-card-title
      >
      <v-divider />
      <v-card-text>
        <!-- ---------------------------------------------- -->
        <!-- APIKEY -->
        <!-- ---------------------------------------------- -->

        <v-label class="font-weight-medium mb-2 ml-2">{{
          $t("chatgpt.config.apikey")
        }}</v-label>
        <v-text-field
          color="primary"
          variant="outlined"
          v-model="chatGPTStore.apiKey"
          class="px-2 py-1"
          :placeholder="$t('chatgpt.config.apikeyPlaceholder')"
          prepend-inner-icon="mdi-key"
          autofocus
          clearable
          hide-details
          @click:prepend-inner="apiKeyShow = !apiKeyShow"
        ></v-text-field>

        <!-- ---------------------------------------------- -->
        <!-- Proxy Url -->
        <!-- ---------------------------------------------- -->
        <v-label class="font-weight-medium mb-2 ml-2 mt-5">{{
          $t("chatgpt.config.proxyUrl")
        }}</v-label>
        <v-text-field
          color="primary"
          variant="outlined"
          v-model="chatGPTStore.proxyUrl"
          class="px-2 py-1"
          :placeholder="$t('chatgpt.config.proxyUrlPlaceholder')"
          prepend-inner-icon="mdi-web"
          autofocus
          clearable
          hide-details
        >
        </v-text-field>

        <!-- ---------------------------------------------- -->
        <!-- Model -->
        <!-- ---------------------------------------------- -->
        <v-label class="font-weight-medium mb-2 ml-2 mt-5">{{
          $t("chatgpt.config.model")
        }}</v-label>
        <v-card variant="outlined" class="pa-2">
  <v-row dense>
    <v-col>
      <v-btn
        :variant="chatGPTStore.model === 'gpt-4o' ? 'flat' : 'text'"
        color="primary"
        size="large"
        @click="chatGPTStore.updateModel('gpt-4o')"
        block 
      >
        <Icon icon="hugeicons:chat-gpt" class="mr-1" />GPT-4o
      </v-btn>
    </v-col>

    <v-col>
      <v-btn
        :variant="chatGPTStore.model === 'deepseek-v3' ? 'flat' : 'text'"
        color="primary"
        size="large"
        @click="chatGPTStore.updateModel('deepseek-v3')"
        block
      >
        <Icon icon="arcticons:deepseek" class="mr-1" />deepseek-v3
      </v-btn>
    </v-col>

    <v-col>
      <v-btn
        :variant="chatGPTStore.model === 'gemini-2.5-pro' ? 'flat' : 'text'"
        color="primary"
        size="large"
        @click="chatGPTStore.updateModel('gemini-2.5-pro')"
        block
      >
        <Icon icon="material-icon-theme:gemini-ai" class="mr-1" />Gemini2.5pro
      </v-btn>
    </v-col>
  </v-row>
</v-card>
        <!-- ---------------------------------------------- -->
        <!-- Language -->
        <!-- ---------------------------------------------- -->
        <v-label class="font-weight-medium mb-2 ml-2 mt-5">{{
          $t("chatgpt.config.role")
        }}</v-label>

        <v-select
          class="ml-2"
          v-model="chatGPTStore.propmpt"
          :items="promptList"
          item-title="act"
          item-value="prompt"
          label="Select"
          single-line
        ></v-select>

        <!-- ---------------------------------------------- -->
        <!-- prompts -->
        <!-- ---------------------------------------------- -->
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="close">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss"></style>
