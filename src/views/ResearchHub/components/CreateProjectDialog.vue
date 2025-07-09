<!--
* @Component: 创建课题对话框
* @Description: 教师创建新的科研课题
-->
<script setup lang="ts">
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useResearchStore } from "../researchStore";

const dialog = ref(false);
const loading = ref(false);
const formRef = ref();

const snackbarStore = useSnackbarStore();
const researchStore = useResearchStore();

const projectForm = reactive({
  projectName: '',
  projectType: '',
  fundingSource: '',
  fundingAmount: undefined,
  startDate: '',
  endDate: '',
  abstractText: '',
  keywords: '',
  researchField: ''
});

const projectTypes = [
  '国家自然科学基金',
  '国家社会科学基金',
  '教育部人文社科基金',
  '省部级科研项目',
  '重庆市科技计划',
  '企业合作',
  '校级科研项目'
];

const researchFields = [
  '中医药网络药理学',
  '中药资源学',
  '中医信息学',
  '中医临床研究',
  '中医基础理论',
  '中药化学',
  '中药药理学'
];

const rules = {
  required: (value: any) => !!value || '此项为必填项',
  amount: (value: any) => value >= 0 || '金额必须大于0',
  date: (value: string) => {
    const date = new Date(value);
    return !isNaN(date.getTime()) || '请输入有效日期';
  }
};

const handleSubmit = async () => {
  // 验证表单
  const { valid } = await formRef.value?.validate();
  if (!valid) return;
  
  loading.value = true;
  try {
    await researchStore.createProject(projectForm);
    snackbarStore.showSuccessMessage('课题创建成功');
    dialog.value = false;
    resetForm();
    // 刷新课题列表
    await researchStore.fetchProjects();
  } catch (error: any) {
    // 错误已在axios拦截器中处理
    console.error('Failed to create project:', error);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.keys(projectForm).forEach(key => {
    (projectForm as any)[key] = '';
  });
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" persistent>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        color="primary"
        block
        size="large"
        elevation="2"
        class="mb-4"
        prepend-icon="mdi-plus"
      >
        创建新课题
      </v-btn>
    </template>

    <v-card>
      <v-toolbar
      image="/images/AppBarBackGround.png"
      dark flat>
        <v-toolbar-title>
          <v-icon start>mdi-folder-plus</v-icon>
          创建科研课题
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="dialog = false"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="projectForm.projectName"
                label="课题名称"
                placeholder="请输入课题名称"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-text"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="projectForm.projectType"
                :items="projectTypes"
                label="课题类型"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-shape"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="projectForm.researchField"
                :items="researchFields"
                label="研究领域"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-flask"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="projectForm.fundingSource"
                label="资金来源"
                placeholder="如：国家自然科学基金委"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-bank"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="projectForm.fundingAmount"
                label="资金金额（元）"
                type="number"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.amount]"
                prepend-inner-icon="mdi-currency-cny"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="projectForm.startDate"
                label="开始日期"
                type="date"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.date]"
                prepend-inner-icon="mdi-calendar-start"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="projectForm.endDate"
                label="结束日期"
                type="date"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required, rules.date]"
                prepend-inner-icon="mdi-calendar-end"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="projectForm.abstractText"
                label="课题摘要"
                placeholder="请简要描述课题的研究背景、目标和意义"
                variant="outlined"
                density="comfortable"
                rows="4"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-text-box"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="projectForm.keywords"
                label="关键词"
                placeholder="请输入关键词，用逗号分隔"
                variant="outlined"
                density="comfortable"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-tag-multiple"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="dialog = false"
          :disabled="loading"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleSubmit"
          :loading="loading"
          prepend-icon="mdi-check"
        >
          创建课题
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">


:deep(.v-text-field) {
  .v-field {
    transition: all 0.3s;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>