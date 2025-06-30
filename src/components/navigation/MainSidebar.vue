<script setup lang="ts">
import { computed } from "vue";
import MainMenu from "@/components/navigation/MainMenu.vue";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import { Icon } from "@iconify/vue";
import { useProfileStore } from "@/stores/profileStore";

// 导入所有可能的导航配置
import navigationAdmin from "@/configs/navigation0";
import navigationStudent from "@/configs/navigation1";
import navigationTeacher from "@/configs/navigation2";

const customizeTheme = useCustomizeThemeStore();
const profileStore = useProfileStore();

// 【核心修改】
// 这个 computed 属性会创建一个对 `profileStore.user` 的响应式依赖。
// 当 `profileStore.user` 从 null 变为一个包含角色信息的对象时，
// `navigation` 会自动重新计算，从而返回正确的菜单配置。
const navigation = computed(() => {
  const role = profileStore.user?.role;
  console.log(`[MainSidebar] 正在为角色计算导航: ${role}`);

  switch (role) {
    case 0:
      console.log("[MainSidebar] 加载管理员导航 (role 0).");
      return navigationAdmin;
    case 1:
      console.log("[MainSidebar] 加载学生导航 (role 1).");
      return navigationStudent;
    case 2:
      console.log("[MainSidebar] 加载教师导航 (role 2).");
      return navigationTeacher;
    default:
      console.log(`[MainSidebar] 角色为 ${role}, 使用默认导航.`);
      // 在用户未登录或角色未知时，返回一个默认导航以避免错误
      return navigationStudent;
  }
});

const openGithubSite = () => {
  window.open("https://github.com/yangjiakai", "_blank");
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

    <main-menu :menu="navigation.menu" />

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
            <div>github.com/yangjiakai</div>
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

<style lang="scss">
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