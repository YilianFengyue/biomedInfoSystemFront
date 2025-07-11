<!--
* @Component:
* @Maintainer: J.K. Yang
* @Description:
-->
<script setup lang="ts"></script>

<template>
  
  <v-card class="my-5" rounded style="min-height: 600px;">
    <v-img
        :aspect-ratio="1"
        class="bg-white"
        src="/public/images/background1.jpg"
        height="600"
        cover
      >
    <v-card-title class="card-title">Main</v-card-title>
    <v-divider></v-divider>
    <div class="text-center pa-10">
      <img class="mx-auto" width="200" src="@/assets/logo2.svg" alt="" />
      <v-card
        color="transparent"
        elevation="0"
        max-width="800"
        class="mx-auto my-10 py-0py-md-12"
      >
        <h1
          style="color: #4a4d6d"
          class="font-weight-black text-h3 text-lg-h2 text-xl-h1"
        >
          欢迎来到中医药信息系统
          <span class="text-primary"></span>
        </h1>
        <h2 class="text-h6 text-secondary mt-4 mx-auto">
          Stack is a Spatial Browser for Mindful Online Living
        </h2>
      </v-card>
      <div class="text-center mb-10">
        <v-btn size="x-large" class="text-white" color="primary"
          >Get Stack</v-btn
        >
      </div>
    </div>
    </v-img>
  </v-card>
</template>

<style scoped lang="scss"></style>
