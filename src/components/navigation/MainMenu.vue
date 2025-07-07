<script setup lang="ts">
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
// 1. 导入 useI18n，这是实现翻译的关键
import { useI18n } from 'vue-i18n';

// 2. 获取 t 函数，我们将在模板中使用它
const { t } = useI18n();

const customizeTheme = useCustomizeThemeStore();

const props = defineProps({
  // Data
  menu: {
    type: Array<any>,
    default: () => [],
  },
});
</script>
<template>
  <v-list class="menu-list" nav dense color="primary">
    <template v-for="menuArea in props.menu" :key="menuArea.key">
      <div
        v-if="!customizeTheme.miniSidebar && (menuArea.key || menuArea.text)"
        class="pa-1 mt-2 text-overline"
      >
        {{ t(menuArea.text) }}
      </div>
      <template v-if="menuArea.items">
        <template v-for="menuItem in menuArea.items" :key="menuItem.key">
          <v-list-item
            v-if="!menuItem.items"
            :to="menuItem.link"
            :prepend-icon="menuItem.icon || 'mdi-circle-medium'"
            :active-class="`active-nav-${customizeTheme.primaryColor.colorName}`"
            density="compact"
          >
            <v-list-item-title v-text="t(menuItem.text)"></v-list-item-title>
          </v-list-item>
          
          <v-list-group v-else :value="menuItem.items">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="menuItem.icon || 'mdi-circle-medium'"
                :title="t(menuItem.text)"
              >
              </v-list-item>
            </template>
            <v-list-item
              v-for="subMenuItem in menuItem.items"
              :key="subMenuItem.key"
              :prepend-icon="subMenuItem.icon || 'mdi-circle-medium'"
              :title="t(subMenuItem.text)"
              :to="subMenuItem.link"
              density="compact"
            ></v-list-item>
          </v-list-group>
        </template>
      </template>
    </template>
  </v-list>
</template>

<style scoped>
.v-list-group .v-list-item {
  padding-left: 8px !important;
}
/* 其他样式保持不变... */
.active-nav-grey {
 
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #3a456c, #a4abbb);
}

.active-nav-purple {
 
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #e82893, #954bcb);
}

.active-nav-info {
  
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #487afa, #3fc7f3);
}

.active-nav-success {
  
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #45b95b, #96dd4c);
}

.active-nav-warning {
  
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #f0635d, #edc252);
}

.active-nav-error {
  
  border-image-slice: 1;
  border-image-source: linear-gradient(to bottom, #ea373a, #f07285);
}
</style>
