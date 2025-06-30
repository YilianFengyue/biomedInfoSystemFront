<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import navItems from "@/configs/navigation";

const route = useRoute();
const { menu } = navItems;

const isLinkActive = (link: string) => {
  // Check if the current route path matches the link
  return route.path === link;
};
</script>

<template>
  <v-list nav>
    <template v-for="(item, i) in menu" :key="i">
      <v-list-subheader v-if="item.text">{{ item.text }}</v-list-subheader>

      <template v-for="(child, j) in item.items" :key="j">
        <v-list-item
          :to="child.link"
          :prepend-icon="child.icon"
          :title="child.text"
          :active="isLinkActive(child.link)"
          rounded="lg"
          class="mb-1"
        >
        </v-list-item>
      </template>
    </template>
  </v-list>
</template>