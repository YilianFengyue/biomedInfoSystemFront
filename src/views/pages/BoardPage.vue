<template>
  <v-container>
    <!-- 简单的在线用户显示 -->
    <v-card class="mb-4 pa-3">
      <div class="d-flex align-center">
        <v-icon icon="mdi-account-group" color="primary" class="mr-2"></v-icon>
        <span class="text-subtitle-2 mr-3">在线:</span>
        <v-chip-group>
          <v-chip
            v-for="user in onlineUsers"
            :key="user.id"
            size="small"
            color="primary"
          >
            {{ user.name }}
          </v-chip>
        </v-chip-group>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-database"
          variant="outlined"
          @click="pasteFromDataCenter"
        >
          从数据中心粘贴
        </v-btn>
      </div>
    </v-card>

    <!-- board column -->
    <v-row style="min-width: 800px">
      <v-col
        cols="3"
        v-for="column in columns"
        :key="column.key"
        class="pa-4 flex-fill"
      >
        <div class="d-flex align-center">
          <h5 class="font-weight-bold">{{ column.key }}</h5>
          <v-spacer></v-spacer>
          <!-- add new card button -->
          <v-btn
            variant="text"
            rounded
            icon="mdi-plus"
            size="small"
            color="primary"
            class="mr-n3"
            @click="column.isAddVisible = !column.isAddVisible"
          >
          </v-btn>
        </div>

        <!-- add new card form -->
        <v-card v-show="column.isAddVisible" class="pa-5 my-2">
          <v-text-field
            color="primary"
            v-model="column.addTitle"
            label="Title"
            variant="underlined"
            hideDetails
            placeholder="Input title for this card"
            autofocus
            @keyup.enter="addCard(column)"
            @keyup.esc="column.isAddVisible = false"
          ></v-text-field>

          <!-- 文件上传 -->
          <v-file-input
            v-model="column.addFile"
            label="添加图片或PDF (可选)"
            variant="underlined"
            accept="image/*,.pdf"
            hide-details
            class="mt-2"
            clearable
          ></v-file-input>

          <div class="mt-3 d-flex flex-md-row flex-column">
            <v-btn
              class="flex-fill ma-1"
              size="small"
              @click="column.isAddVisible = !column.isAddVisible"
              >Cancel</v-btn
            >
            <v-btn
              class="flex-fill ma-1"
              size="small"
              color="primary"
              @click="addCard(column)"
              >Add</v-btn
            >
          </div>
        </v-card>

        <!-- draggable cards -->
        <vue-draggable
          v-model="column.cards"
          v-bind="dragOptions"
          class="list-group"
          @change="column.callback"
          itemKey="id"
        >
          <template #item="{ element, index }">
            <board-card
              :key="index"
              :card="element"
              class="board-item my-2 pa-2"
              @edit="showEdit(element)"
              @delete="showDelete(element)"
              @showPdf="showPdfPreview"
            />
          </template>
        </vue-draggable>
      </v-col>
    </v-row>
  </v-container>

  <!-- edit card dialog -->
  <v-dialog persistent v-model="editDialog" width="600">
    <v-card>
      <v-card-title class="pa-4 d-flex align-center">
        <span class="flex-fill">Edit Card</span>
        <v-btn
          variant="text"
          rounded
          icon="mdi-close"
          size="small"
          color="primary"
          class="mr-n3"
          @click="editDialog = false"
        >
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <div class="pa-4">
        <v-text-field
          class="py-2 px-1"
          color="primary"
          v-model="title"
          label="Title"
          variant="plain"
          hideDetails
          placeholder="Title"
          autofocus
          @keyup.enter="saveCard"
        ></v-text-field>
        <v-divider></v-divider>
        <v-textarea
          v-model="description"
          class="px-2 py-1"
          variant="plain"
          placeholder="Description"
          hide-details
        ></v-textarea>

        <!-- 文件上传编辑 -->
        <v-divider class="my-3"></v-divider>
        <v-file-input
          v-model="editFile"
          label="更换图片或PDF"
          variant="outlined"
          accept="image/*,.pdf"
          hide-details
          clearable
        ></v-file-input>
      </div>
      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-btn variant="outlined" @click="editDialog = false">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="saveCard">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- delete card dialog -->
  <v-dialog v-model="deleteDialog" max-width="300">
    <v-card>
      <v-card-title class="text-headline">Delete</v-card-title>
      <v-card-text>DeleteDescription</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="plain" color="primary" @click="deleteDialog = false"
          >Cancel</v-btn
        >
        <v-btn variant="flat" color="error" @click="deleteCard()">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- PDF预览对话框 -->
  <v-dialog v-model="pdfDialog" max-width="800" max-height="600">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="flex-fill">{{ currentPdf?.name }}</span>
        <v-btn icon="mdi-close" variant="text" @click="pdfDialog = false"></v-btn>
      </v-card-title>
      <v-card-text class="pa-0" style="height: 500px;">
        <div class="d-flex align-center justify-center fill-height">
          <div class="text-center">
            <v-icon icon="mdi-file-pdf-box" size="64" color="red"></v-icon>
            <div class="mt-2">PDF预览组件</div>
            <div class="text-caption text-grey">{{ currentPdf?.name }}</div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import VueDraggable from "vuedraggable";
import BoardCard from "@/components/BoardCard.vue";

const dragOptions = computed(() => {
  return {
    animation: 200,
    group: "task",
    disabled: false,
    ghostClass: "ghost",
    handle: ".drag-handle", // 关键：只有拖拽手柄可以拖拽
  };
});

// board states
const states = ref(["TODO", "INPROGRESS", "TESTING", "DONE"]);
const cards = ref([
  {
    id: 1,
    title: "fix: 💭 channel label on chat app",
    description: "we need it bolder",
    order: 1,
    state: "TODO",
  },
  {
    id: 2,
    title: "feature: new emojis on board 🤘",
    description: "we need it for reasons 🤤",
    order: 0,
    state: "TODO",
    imageUrl: "https://i.pinimg.com/1200x/f8/e5/45/f8e54532af278bf453cc4825659905cc.jpg",
  },
  {
    id: 3,
    title: "feature: add stripe account on signup",
    description: "",
    order: 1,
    state: "TESTING",
    pdfInfo: { name: "设计文档.pdf", url: "/api/files/123.pdf" },
  },
  {
    id: 4,
    title: "refactor: scroll 📜 directive on big pages",
    description: "remember to check the scroll",
    order: 0,
    state: "INPROGRESS",
  },
  {
    id: 5,
    title: "feature: add big cards on dashboard",
    description: "everyone loves cards",
    order: 3,
    state: "TODO",
  },
  {
    id: 6,
    title: "feature: add big cards on dashboard",
    description: "everyone loves cards",
    order: 3,
    state: "TESTING",
  },
  {
    id: 7,
    title: "feature: add big cards on dashboard",
    description: "everyone loves cards",
    order: 3,
    state: "DONE",
  },
]);

const columns = ref([]);
const onlineUsers = ref([
  { id: 1, name: "张三" },
  { id: 2, name: "李四" },
]);

// 对话框状态
const editDialog = ref(false);
const deleteDialog = ref(false);
const pdfDialog = ref(false);
const cardToEdit = ref(null);
const cardToDelete = ref(null);
const currentPdf = ref(null);
const title = ref("");
const description = ref("");
const editFile = ref(null);

onMounted(() => {
  initColumns();
  parseCards(cards.value);
});

// Init
const initColumns = () => {
  states.value.forEach((state, index) => {
    columns.value.push({
      key: state,
      cards: [],
      isAddVisible: false,
      addTitle: "",
      addFile: null,
      callback: (e) => changeState(e, index),
    });
  });
};

const parseCards = (cards) => {
  if (!cards) return columns.value.map((column) => (column.cards = []));
  columns.value.forEach((column) => {
    column.cards = cards
      .filter((card) => card.state === column.key)
      .sort((a, b) => (a.order < b.order ? -1 : 0));
  });
};

// Add
const addCard = async (column) => {
  const { addTitle, key, addFile } = column;
  if (!addTitle) return;
  
  let newCard = {
    id: "_" + Math.random().toString(36).substring(2, 11),
    state: key,
    title: addTitle,
    description: "",
    order: -1,
  };

  // 处理文件上传
  if (addFile && addFile.type) {
    if (addFile.type.startsWith('image/')) {
      newCard.imageUrl = await uploadFile(addFile);
    } else if (addFile.type === 'application/pdf') {
      newCard.pdfInfo = {
        name: addFile.name,
        url: await uploadFile(addFile)
      };
    }
  }

  column.cards.unshift(newCard);
  column.addTitle = "";
  column.addFile = null;
  column.isAddVisible = false;
};

const changeState = (e, colIndex) => {
  if (e.added || e.moved) {
    const column = columns.value[colIndex];
    const state = column.key;
    for (let i = 0; i < column.cards.length; i++) {
      column.cards[i].order = i;
      column.cards[i].state = state;
    }
  }
};

// Edit
const showEdit = (card) => {
  cardToEdit.value = card;
  title.value = card.title;
  description.value = card.description;
  editDialog.value = true;
};

const saveCard = async () => {
  let targetCard = cards.value.find((card) => card.id === cardToEdit.value.id);
  if (!targetCard) {
    for (const column of columns.value) {
      targetCard = column.cards.find((card) => card.id === cardToEdit.value.id);
      if (targetCard) break;
    }
  }
  
  if (targetCard) {
    targetCard.title = title.value;
    targetCard.description = description.value;
    
    if (editFile.value && editFile.value.type) {
      if (editFile.value.type.startsWith('image/')) {
        targetCard.imageUrl = await uploadFile(editFile.value);
        delete targetCard.pdfInfo;
      } else if (editFile.value.type === 'application/pdf') {
        targetCard.pdfInfo = {
          name: editFile.value.name,
          url: await uploadFile(editFile.value)
        };
        delete targetCard.imageUrl;
      }
    }
    
    editDialog.value = false;
    editFile.value = null;
  }
};

// Delete
const showDelete = (card) => {
  cardToDelete.value = card;
  deleteDialog.value = true;
};

const deleteCard = () => {
  deleteDialog.value = false;
  const cardIndex = cards.value.findIndex((card) => card.id === cardToDelete.value.id);
  if (cardIndex !== -1) {
    cards.value.splice(cardIndex, 1);
  }
  for (const column of columns.value) {
    const colCardIndex = column.cards.findIndex((card) => card.id === cardToDelete.value.id);
    if (colCardIndex !== -1) {
      column.cards.splice(colCardIndex, 1);
      break;
    }
  }
};

// PDF预览
const showPdfPreview = (pdfInfo) => {
  currentPdf.value = pdfInfo;
  pdfDialog.value = true;
};

// 从数据中心粘贴
const pasteFromDataCenter = () => {
  const todoColumn = columns.value.find(col => col.key === 'TODO');
  if (todoColumn) {
    const newCard = {
      id: "_" + Math.random().toString(36).substring(2, 11),
      state: 'TODO',
      title: `数据中心导入 - ${new Date().toLocaleString()}`,
      description: "从数据中心导入的观测数据",
      order: -1,
    };
    todoColumn.cards.unshift(newCard);
  }
};

// 文件上传
const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error('文件上传失败:', error);
    return file.type.startsWith('image/') ? URL.createObjectURL(file) : '/placeholder.pdf';
  }
};

watch(cards.value, (newCards) => {
  parseCards(newCards);
});
</script>

<style lang="scss" scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.board-item {
  transition: transform 0.2s;
  &:hover {
    transition: transform 0.2s;
    transform: translateY(-3px);
  }
}

.list-group {
  min-height: 100%;
}
</style>