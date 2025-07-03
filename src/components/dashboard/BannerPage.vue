<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// --- Data for search fields ---
const searchLocation = ref('');
// 明确类型，null 表示未选择，或者可以给一个默认值如 '公寓'
const searchType = ref<string | null>(null);
const searchTypeItems = ['公寓', '别墅', '合租', '整租'];

const router = useRouter();

// --- Search function ---
const performSearch = () => {
  let effectiveSearchCommunity = searchLocation.value || '';
  const queryParams: Record<string, string> = {};

  if (searchType.value) {
    if (['合租', '整租'].includes(searchType.value)) {
      // '合租' 和 '整租' 直接映射到列表页的 rent_type 筛选
      queryParams.rent_type = searchType.value;
    } else if (['公寓', '别墅'].includes(searchType.value)) {
      // '公寓' 和 '别墅' 作为关键词附加到主要搜索文本中
      if (effectiveSearchCommunity) {
        effectiveSearchCommunity += ` ${searchType.value}`;
      } else {
        effectiveSearchCommunity = searchType.value;
      }
    }
  }

  if (effectiveSearchCommunity.trim()) {
    // 假设列表页用 'community' 参数接收位置/关键词搜索
    queryParams.community = effectiveSearchCommunity.trim();
  }

  // 跳转到房源列表页 (假设路由名称为 'HouseList' 或路径为 '/house-list')
  // 请确保你的路由配置中有这个页面
  router.push({
    name: '/houseList', // 或者使用 path: '/house-list',
    query: queryParams
  });
};

// --- ScrollToTop function (if used by another element not shown) ---
const scrollToTop = () => {
  window.scrollTo({ top: 420, behavior: "smooth" });
};

// --- Unused SearchBar import (can be removed if not used) ---
// import SearchBar from "~/src/components/dashboard/SearchBar.vue";
</script>

<template>
  <v-card class="my-5" rounded="lg" flat>
    <v-parallax src="/public/bg1.jpg" height="800" class="mb-5">
      <div class="d-flex flex-column fill-height justify-center align-center source-han">
        <div class="text-center pa-5">
          <v-responsive class="mx-auto" max-width="850px"> 
            <h1 class="text-h3 black text-sm-h2 text-md-h1 font-weight-bold mb-5 text-primary">
              {{ t('menu.main') }}
            </h1>
            <p
              class="text-h6 text-sm-h5 mb-8 text-primary font-weight-bold source-han"
              style="opacity: 0.85;" 
            >
              {{ t('menu.med_search') }}
            </p>
            <div class="text-center">
          <v-btn size="x-large" class="text-white" color="primary"
            >Get Stack</v-btn
          >
        </div>
          </v-responsive>
        </div>
      </div>
    </v-parallax>
  </v-card>
</template>

<style scoped lang="scss">
// 针对视差内部的文字阴影，提高在某些背景下的可读性 (可选)
.text-white h1,
.text-white p {
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

// 确保按钮在不同尺寸下表现良好
.search-button {
  // 在小屏幕上可能不需要 block，或者需要调整其行为
  // Vuetify 的 v-col 已经处理了堆叠，这里的 block 主要是为了填满 md="3" 的宽度
}
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap');

.source-han {
  font-family: 'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif;
  color: #000;
}

</style>