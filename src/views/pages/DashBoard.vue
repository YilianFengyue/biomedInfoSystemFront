<script setup lang="ts">
import Hero1 from '~/src/components/dashboard/Hero1.vue';
import Footer1 from '~/src/components/footer/Footer1.vue';
</script>
<template>
  <div class="pa-5 ">
    <!-- ---------------------------------------------- -->
    <!---First Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="flex-0" dense>
      <v-col cols="12" xl="4" style="min-height:600px">
        <Hero1></Hero1>
      </v-col>
      <v-col cols="12" md="6" xl="4">
        <!-- Activity Card -->
        <v-card class="card-shadow" height="420">
          <activity-card></activity-card>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" xl="4">
        <!-- Trafiic Card-->
        <v-card class="card-shadow h-full" height="420">
          <sources-card></sources-card>
        </v-card>
      </v-col>
    </v-row>
    <!-- ---------------------------------------------- -->
    <!---Second Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="card-shadow flex-grow-0" dense>
      <v-col cols="12" xl="6">
        <!-- Table Card-->
        <v-card class="card-shadow" height="420">
          <table-card></table-card>
        </v-card>
      </v-col>
      <v-col cols="12" xl="6">
        <Footer1></Footer1>
      </v-col>
    </v-row>
    
  </div>
  
</template>
<style lang="scss" scoped></style>
