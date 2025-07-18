<script setup lang="ts">
import { useTheme } from "vuetify";
import { useCustomizeThemeStore } from "@/stores/customizeTheme";
import { Icon } from "@iconify/vue";
interface Color {
  colorId: number;
  colorName: string;
  colorValue: string;
}
const customizeTheme = useCustomizeThemeStore();
const theme = useTheme();
const themeDrawer = ref(false);
const currentColor = ref<Color>({
  colorId: 1,
  colorName: "purple",
  colorValue: "#705CF6",
});
const primaryColors = ref([
  {
    colorId: 1,
    colorName: "purple",
    colorValue: "#705CF6",
  },
  {
    colorId: 2,
    colorName: "grey",
    colorValue: "#344767",
  },
  {
    colorId: 3,
    colorName: "info",
    colorValue: "#17C1E8",
  },
  {
    colorId: 4,
    colorName: "success",
    colorValue: "#558B2F",
  },
  {
    colorId: 5,
    colorName: "warning",
    colorValue: "#F2825A",
  },
  {
    colorId: 6,
    colorName: "error",
    colorValue: "#EA0606",
  },
]);

onMounted(() => updatePrimaryColor(customizeTheme.primaryColor));

watch(currentColor, (newVal) => {
  updatePrimaryColor(newVal);
});

const updatePrimaryColor = (newColor: Color) => {
  theme.themes.value.light.colors.primary = newColor.colorValue;
  theme.themes.value.dark.colors.primary = newColor.colorValue;
  customizeTheme.setPrimaryColor(newColor);
  currentColor.value = newColor;
};
</script>

<template>
  <div>
    <div class="drawer-button" @click="themeDrawer = true">
      <v-icon class="text-white">mdi-cog-outline</v-icon>
    </div>

    <v-navigation-drawer
      v-model="themeDrawer"
      location="right"
      temporary
      width="300"
      class="theme-drawer"
    >
      <div class="pa-5">
        <div class="top-area">
          <div class="d-flex align-center">
            <b>UI Configurator</b>
            <v-spacer></v-spacer>
          </div>
          <div>See our dashboard options.</div>
        </div>

        <hr class="my-6" />

        <div class="theme-area">
          <b>Global Theme Mode</b>
          <div class="px-3 pt-3" v-if="customizeTheme.darkTheme">
            <v-btn
              @click="customizeTheme.darkTheme = !customizeTheme.darkTheme"
              icon
              color="grey-darken-4"
              class="text-white"
            >
              <Icon width="30" icon="line-md:moon-filled-loop" />
            </v-btn>
            <span class="ml-5">Dark Mode</span>
          </div>
        </div>
        <hr class="my-6" />

        <div class="primary-color-area">
          <b>Primary Colors</b>
          <v-item-group
            class="mt-3"
            v-model="currentColor"
            selected-class="elevation-12"
            mandatory
          >
            <v-item
              v-for="color in primaryColors"
              :key="color.colorId"
              :value="color"
              v-slot="{ isSelected, toggle }"
            >
              <v-btn
                @click="toggle"
                class="text-white mr-1"
                icon
                size="30"
                :color="color.colorValue"
              >
                <Icon width="22" v-if="isSelected" icon="line-md:confirm" />
              </v-btn>
            </v-item>
          </v-item-group>
        </div>
        <hr class="my-6" />
        <div class="">
          <b>MiniSideBar</b>
        </div>
        <hr class="mb-6" />
        <div>
          <v-btn color="" class="gradient info" block size="large"
            >Contact Me</v-btn
          >
        </div>
        <div class="ml-5 mt-5 d-flex align-center">
          <v-icon color="primary" class="mr-6">mdi-email-outline</v-icon>
          <a href="mailto:yjkbako@gmail.com">yjkbako@gmail.com</a>
        </div>
        <div>
          <img src="@/assets/wechat.jpg" alt="" />
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<style lang="scss" scoped>
.drawer-button {
  position: fixed;
  background-color: #705cf6;
  top: 340px;
  right: -45px;
  z-index: 999;
  padding: 0.5rem 1rem;
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
  box-shadow: 1px 1px 9px #705cf6;
  transition: all 0.5s;
  cursor: pointer;
  &:hover {
    box-shadow: 1px 1px 18px #705cf6;
    right: 0px;
    transition: all 0.5s;
  }

  .v-icon {
    font-size: 1.3rem;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}

hr {
  background-image: linear-gradient(
    90deg,
    transparent,
    rgba(0, 0, 0, 0.4),
    transparent
  ) !important;
  background-color: transparent;
  opacity: 0.25;
  border: none;
  height: 1px;
}
</style>
