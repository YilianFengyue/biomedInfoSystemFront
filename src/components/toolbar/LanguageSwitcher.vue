<!--
* @Component: LanguageSwitcher.vue
* @Maintainer: J.K. Yang
* @Description: 语言切换组件
-->
<script setup lang="ts">
import config from "@/configs";
import { Icon } from "@iconify/vue";
import { useLocale } from "vuetify";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import { useI18n } from "vue-i18n"; // 1. 导入 useI18n

const { current } = useLocale();
const { availableLocales } = config.locales;
const customizeTheme = useCustomizeThemeStore();

// 2. 获取两个 locale 的控制器
const { current: vuetifyLocale } = useLocale(); // 用于 Vuetify 组件
const { locale: i18nLocale } = useI18n();      // 用于您应用中的 $t() 文本

onMounted(() => {
  setLocale(customizeTheme.localCode);
});

const setLocale = (locale: string) => {
  // 3. 同时更新两个 locale
  vuetifyLocale.value = locale; // 更新 Vuetify
  i18nLocale.value = locale;    // 更新您应用的全局语言
  customizeTheme.setLocalCode(locale); // 持久化保存用户的选择
};
</script>
<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props">
        <v-icon color="primary">mdi-translate</v-icon>
      </v-btn>
    </template>
    <v-list nav>
      <v-list-item
        v-for="locale in availableLocales"
        :key="locale.code"
        @click="setLocale(locale.code)"
        density="compact"
        :active="locale.code === current"
      >
        <template v-slot:prepend>
          <Icon :icon="`twemoji:flag-${locale.name}`" class="mr-2" />
        </template>
        <v-list-item-title> {{ locale.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
