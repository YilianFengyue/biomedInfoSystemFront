<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import MainMenu from "@/components/navigation/MainMenu.vue";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import { Icon } from "@iconify/vue";
import { useProfileStore } from "@/stores/profileStore";

// 导入所有角色的导航配置
import navigationAdmin from "@/configs/navigation0";      // 管理员 (role: 0)
import navigationStudent from "@/configs/navigation1";    // 学生 (role: 1)
import navigationTeacher from "@/configs/navigation2";    // 教师 (role: 2)

const customizeTheme = useCustomizeThemeStore();
const profileStore = useProfileStore();

// 计算属性，用于获取当前用户的角色
const userType = computed(() => profileStore.user?.role);

// 根据用户角色动态选择并返回对应的导航配置
const navigation = computed(() => {
  console.log("Current User Role:", userType.value);
  switch (userType.value) {
    case 0:
      return navigationAdmin;
    case 1:
      return navigationStudent;
    case 2:
      return navigationTeacher;
    default:
      // 如果用户未登录或角色未知，可以返回一个默认的导航（例如学生导航）
      return navigationStudent;
  }
});

const openGithubSite = () => {
  window.open("https://github.com/", "_blank");
};

onMounted(() => {
  scrollToBottom();
});

const scrollToBottom = () => {
  const contentArea = document.querySelector(".v-navigation-drawer__content");
  const activeItem = document.querySelector(
    ".v-list-item--active"
  ) as HTMLElement;

  setTimeout(() => {
    contentArea?.scrollTo({
      top: activeItem?.offsetTop,
    });
  }, 100);
};
</script>

<template>
  <v-navigation-drawer
    border="none"
    elevation="1"
    v-model="customizeTheme.mainSidebar"
    temporary
    id="mainMenu"
  >
    <template v-if="!customizeTheme.miniSidebar" v-slot:prepend>
      <v-card
        style="box-shadow: rgba(0, 0, 0, 0.05) 0px 25px 15px -20px"
        height="100"
        class="logo-card"
      >
        <h1 class="logo-text h-full">
          <img src="@/assets/logo.png" alt="Logo" width="30" height="30" style="margin-right:10px" />
          <span>维诺思</span>
        </h1>
      </v-card>
    </template>

    <main-menu :menu="navigation.menu"></main-menu>

    <template v-if="!customizeTheme.miniSidebar" v-slot:append>
      <v-card
        theme="dark"
        height="225"
        class="pa-3"
        variant="text"
        style="box-shadow: rgba(0, 0, 0, 0.05) 0px -25px 15px -20px"
      >
        <v-card
          class="d-flex flex-column gradient pa-2"
          :class="customizeTheme.primaryColor.colorName"
          height="200"
        >
          <v-card-title>
            <v-btn
              class="mr-2"
              size="40"
              color="white"
              :class="`text-${customizeTheme.primaryColor.colorName}`"
              icon
            >
              <Icon width="30" icon="line-md:github-loop" />
            </v-btn>
            Yang J.K.
          </v-card-title>
          <v-card-subtitle> </v-card-subtitle>
          <v-card-text>
            <div><b>Github:</b></div>
            <div>github.com</div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="white"
              block
              prepend-icon="mdi-thumb-up-outline"
              variant="elevated"
              @click="openGithubSite"
            >
              给我点个赞吧
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-card>
    </template>
  </v-navigation-drawer>
</template>

<style  lang="scss">
.gradient-card {

  background: linear-gradient(
    270deg,
    rgba(var(--v-theme-primary), 0.7) 0,
    rgb(var(--v-theme-primary)) 100%
  );
  box-shadow: 0 2px 6px rgba(var(--v-theme-primary), 0.3);
}

.logo-card {
  .logo-text {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 600;
    color: rgba(var(--v-theme-primary));
  }
}
</style>