<!--
* @Component:
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts">
import { createTranscriptionApi } from "@/api/aiApi";
import { useChatGPTStore } from "@/stores/chatGPTStore";
import CopyBtn from "@/components/common/CopyBtn.vue";
import { useDisplay } from "vuetify";
import { read } from "@/utils/aiUtils";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useSpeechStore } from "@/stores/speechStore";
import { Icon } from "@iconify/vue";
const speechStore = useSpeechStore();
const snackbarStore = useSnackbarStore();
const chatGPTStore = useChatGPTStore();
const langs = [
  {
    code: "en",
    name: "English",
    label: "English",
  },
  {
    code: "zh-CN",
    name: "Chinese Simplified",
    label: "中文(简体)",
  },
  {
    code: "zh-TW",
    name: "Chinese Traditional",
    label: "中文(繁體)",
  },
  {
    code: "ja",
    name: "Japanese",
    label: "日本語",
  },
  {
    code: "ko",
    name: "Korean",
    label: "한국어",
  },
  {
    code: "fr",
    name: "French",
    label: "Français",
  },
  {
    code: "de",
    name: "German",
    label: "Deutsch",
  },
  {
    code: "es",
    name: "Spanish",
    label: "Español",
  },
];

const currentLang = ref({
  code: "en",
  name: "English",
  label: "English",
});
const setLang = (lang: any) => {
  currentLang.value = lang;
};

const baseContent = ref("");
const targetContent = ref("");

const prompt = computed(() => {
  return `Translate into ${currentLang.value.name}`;
  //   return `I want you to act as an ${currentLangName.value} translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in ${currentLang.value.name}. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level ${currentLang.value.name} words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations."`;
});

const isLoading = ref(false);
const translate = async () => {
  if (baseContent.value === "") {
    snackbarStore.showErrorMessage("请输入要翻译的内容");
    return;
  }

  // if (!chatGPTStore.getApiKey) {
  //   snackbarStore.showErrorMessage("请先输入API KEY");
  //   return;
  // }
  isLoading.value = true;
  try {
    const completion = await fetch(
      `${chatGPTStore.proxyUrl}/v1/chat/completions`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chatGPTStore.getApiKey}`,
        },
        method: "POST",
        body: JSON.stringify({
          // 🔥 修复：使用新的消息格式
          messages: [
            { 
              role: "user", 
              content: [{ type: 'text', text: prompt.value }] 
            },
            { 
              role: "user", 
              content: [{ type: 'text', text: baseContent.value }] 
            },
          ],
          model: chatGPTStore.model,
          stream: true,
        }),
      }
    );

    // Handle errors
    if (!completion.ok) {
      const errorData = await completion.json();
      snackbarStore.showErrorMessage(errorData.error.message);
      isLoading.value = false;
      return;
    }

    // Create a reader
    const reader = completion.body?.getReader();
    if (!reader) {
      snackbarStore.showErrorMessage("Cannot read the stream.");
      isLoading.value = false;
      return;
    }

    // Clear the target content
    targetContent.value = "";

    // 🔥 修复：创建临时数组适配read函数
    const tempMessages = ref([{
      role: "assistant" as const,
      content: [{ type: "text" as const, text: "" }]
    }]);

    // Read the stream
    await read(reader, tempMessages);

    // 🔥 修复：将结果同步到targetContent
    if (tempMessages.value[0]) {
      targetContent.value = tempMessages.value[0].content[0]?.text || "";
    }

  } catch (error) {
    snackbarStore.showErrorMessage(error.message);
  } finally {
    isLoading.value = false; // 🔥 确保finally中设置加载状态
  }
};

const isBaseContentEmpty = ref(false);
const recorder = ref<any>();
const isRecording = ref(false);

const startRecording = async () => {
  // 获取用户媒体权限，视频的话参数{audio: true, video: true}
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      // 创建媒体流
      recorder.value = new MediaRecorder(stream);
      const audioChunks = <any>[];
      // 录音开始
      recorder.value.start();
      isRecording.value = true;
      // 录音数据
      recorder.value.ondataavailable = (e: any) => {
        audioChunks.push(e.data);
      };
      // 录音结束
      recorder.value.onstop = async (e: any) => {
        const blob = new Blob(audioChunks, { type: "audio/wav" });
        const file = new File([blob], "recording.wav", {
          type: "audio/wav",
        });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "whisper-1");
        const res = await createTranscriptionApi(
          formData,
          chatGPTStore.getApiKey
        );
        baseContent.value = res.data.text;
      };
    })
    .catch((error) => {
      snackbarStore.showErrorMessage(error.message);
    });
};

const stopRecording = () => {
  if (recorder.value) {
    recorder.value.stop();
    isRecording.value = false;
  }
};

const record = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const dialog = ref(false);
const { xs } = useDisplay();

const readText = () => {
  if (targetContent.value) {
    // 停止当前朗读
    window.speechSynthesis.cancel();
    
    // 创建朗读实例
    const utterance = new SpeechSynthesisUtterance(targetContent.value);
    
    // 设置语言（根据当前选择的目标语言）
    utterance.lang = currentLang.value.code;
    
    // 设置语速和音调
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // 开始朗读
    window.speechSynthesis.speak(utterance);
  }
};
</script>

<template>
  <v-btn size="50" @click="dialog = !dialog">
    <v-icon size="30">mdi-google-translate</v-icon>
    <v-tooltip
      activator="parent"
      location="left"
      :text="$t('toolbox.translationAssistant.title')"
    ></v-tooltip>
  </v-btn>

  <teleport to="body">
    <transition name="slide-y">
      <v-card
        v-if="dialog"
        class="dialog-bottom d-flex flex-column"
        :width="xs ? '100%' : '600px'"
      >
        <v-card-title>
          <span class="flex-fill">
            <v-avatar size="40">
              <v-img
                src="https://img.icons8.com/color/96/null/translation.png"
              />
            </v-avatar>

            OpenAi {{ $t("toolbox.translationAssistant.title") }}
          </span>

          <v-spacer></v-spacer>
          <v-btn icon @click.stop="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-actions class="px-5">
          <span class="text-body-2"
            >{{ $t("toolbox.translationAssistant.targetLanguage") }}:</span
          >
          <!-- <v-btn-toggle
            v-model="currentLang"
            density="compact"
            variant="outlined"
            color="primary"
            mandatory
          >
            <v-btn
              density="compact"
              size="small"
              v-for="lang in langs"
              :value="lang.code"
            >
              {{ lang.label }}
            </v-btn>
          </v-btn-toggle> -->
          <v-menu location="bottom end" scroll-y>
            <template v-slot:activator="{ props }">
              <v-btn width="108" append-icon="mdi-menu-down" v-bind="props">
                <span class="text-body-2">{{ currentLang.label }}</span>
              </v-btn>
            </template>
            <v-card>
              <div v-for="lang in langs">
                <v-btn block @click="setLang(lang)">{{ lang.label }}</v-btn>
              </div>
            </v-card>
          </v-menu>

          <v-spacer></v-spacer>

          <v-btn
            class="ml-2 text-white"
            :loading="isLoading"
            :disabled="isLoading"
            variant="elevated"
            color="primary"
            @click="translate"
            >{{ $t("toolbox.translationAssistant.translate") }}</v-btn
          >
        </v-card-actions>
        <v-divider />
        <v-card-text>
          <v-row no-gutters justify="center" dense>
            <v-col cols="12">
              <v-card elevation="0">
                <div class="pa-2">
                  <v-textarea
                    v-model="baseContent"
                    hide-details
                    variant="solo"
                    class="elevation-1"
                    color="white"
                    clearable
                    @focus="isBaseContentEmpty = false"
                    :placeholder="
                      $t(
                        'toolbox.translationAssistant.sourceLanguagePlaceholder'
                      )
                    "
                  ></v-textarea>
                </div>
                <v-card-actions class="bg-grey-lighten-4 text-primary">
                  <v-tooltip
                    v-if="!isRecording"
                    location="bottom"
                    :text="$t('toolbox.translationAssistant.speech')"
                  >
                    <template #activator="{ props }">
                      <v-btn @click="record" v-bind="props" icon>
                        <v-icon v-if="isRecording">mdi-microphone</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip
                    location="bottom"
                    :text="$t('toolbox.translationAssistant.stopSpeech')"
                    v-else
                  >
                    <template #activator="{ props }">
                      <v-btn @click="record" v-bind="props" icon>
                        <Icon icon="svg-spinners:bars-scale-fade" />
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <!-- <v-tooltip
                    location="bottom"
                    :text="$t('toolbox.translationAssistant.read')"
                  >
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon
                        ><v-icon>mdi-volume-high</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip> -->
                  <v-spacer></v-spacer>
                  <CopyBtn :text="baseContent" />
                </v-card-actions>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card elevation="0">
                <div class="pa-2">
                  <v-textarea
                    v-model="targetContent"
                    hide-details
                    variant="solo"
                    class="elevation-1"
                    color="primary"
                    clearable
                    :placeholder="
                      $t(
                        'toolbox.translationAssistant.targetLanguagePlaceholder'
                      )
                    "
                  ></v-textarea>
                </div>
                <v-card-actions
                  class="bg-grey-lighten-4 bg-grey-lighten-4 text-primary"
                >
                  <v-tooltip
                    location="bottom"
                    :text="$t('toolbox.translationAssistant.read')"
                  >
                    <template #activator="{ props }">
                      <v-btn @click="readText" v-bind="props" icon
                        ><v-icon>mdi-volume-high</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-spacer></v-spacer>
                  <CopyBtn :text="targetContent" />
                </v-card-actions> </v-card
            ></v-col> </v-row
        ></v-card-text>
        <v-divider />
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
</style>