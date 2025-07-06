<script setup lang="ts">
//Token

import { useDisplay } from "vuetify";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import ToolbarNotifications from "./ToolbarNotifications.vue";
import ToolbarUser from "./ToolbarUser.vue";
import ThemeToggle from "./ThemeToggle.vue";
// 1. 导入 LanguageSwitcher 组件
import LanguageSwitcher from "./LanguageSwitcher.vue";
//search
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFixCardStore } from '@/stores/fixCardStore' 
//导入Iconify
import { Icon } from "@iconify/vue";
const fixCardStore = useFixCardStore() 

const toggleFixCard = () => {
  fixCardStore.toggleFixCard()
}

const searchQuery = ref(''); 
const router = useRouter(); 

const searchProduct = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/product', query: { search: searchQuery.value } });
  }
};
const { mdAndUp } = useDisplay();
const customizeTheme = useCustomizeThemeStore();

const variants = ['tonal']
const color = ref('indigo')

</script>

<template>
  <v-app-bar :density="mdAndUp ? 'default' : 'compact'"  image="/images/AppBarBackGround.png">
    <div class="px-2 d-flex align-center justify-space-between w-100">
      <v-app-bar-nav-icon
        @click="customizeTheme.mainSidebar = !customizeTheme.mainSidebar"
      ></v-app-bar-nav-icon>
      <div>
        <v-text-field
          v-if="mdAndUp"
          class="ml-2"
          style="width: 400px"
          color="primary"
          variant="solo"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          hide-details
          placeholder="Search"
          v-model="searchQuery"
          @keyup.enter="searchProduct"
        ></v-text-field>
      </div>
      <v-spacer></v-spacer>

      <v-divider vertical thickness="2" inset class="ml-5 mr-1"></v-divider>
      <ToolbarNotifications />
      <v-btn icon >
        <v-icon><Icon icon="ic:outline-account-balance-wallet" /></v-icon>
      </v-btn>

      <div class="d-flex">
        <LanguageSwitcher />
        <ThemeToggle />
        <ToolbarUser />
      </div>
    </div>
  </v-app-bar>
</template>

<style scoped lang="scss"></style>