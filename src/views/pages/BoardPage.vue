<template>
  <v-container>
    <!-- 简单的在线用户显示 -->
    <v-card class="mb-4 ">
      <v-img
        :aspect-ratio="1"
        class="bg-white"
        src="https://biomedinfo.oss-cn-beijing.aliyuncs.com/user-uploads/4b7857b1-63cc-48b2-a420-bc85d07d1302_AppBarBackground1.png"
        max-height="100px"
        cover
      >
      <div class="d-flex align-center mt-5 ml-2 mr-2 text-white">
        <v-icon icon="mdi-account-group" color="white" class="mr-2"></v-icon>
        <span class="text-subtitle-2 mr-3">在线:</span>
        <v-chip-group>
          <v-chip
            v-for="user in onlineUsers"
            :key="user.id"
            size="small"
            color="white"
            label
          >
            {{ user.name }}
          </v-chip>
        </v-chip-group>
        <v-spacer></v-spacer>
        <v-btn
          color="white"
          prepend-icon="mdi-database"
          variant="outlined"
          @click="pasteFromDataCenter"
        >
          从数据中心粘贴
        </v-btn>
            <v-btn
              color="white"
              prepend-icon="mdi-lightbulb-import-outline"
              variant="outlined"
              @click="importFromInspiration"
              class="mr-2 ml-2 "
            >
              从灵感板导入 ({{ inspirationStore.items.length }})
            </v-btn>
      </div>
    </v-img>
      
    </v-card>

    <!-- board column -->
    <v-row style="min-width: 800px">
      <v-col
        cols="3"
        v-for="(column, colIndex) in columns"
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

        <!-- 关键修改：使用 :list 而不是 v-model -->
        <draggable
          :list="column.cards"
          :group="'task'"
          :animation="200"
          ghost-class="ghost"
          class="list-group"
          @change="(evt) => handleDragChange(evt, colIndex)"
          item-key="id"
          handle=".drag-handle"
        >
          <template #item="{ element }">
            <div>
            <board-card
              :key="`card-${element.id}`"
              :card="element"
              class="board-item my-2 pa-2 drag-handle"
              @edit="showEdit(element)"
              @delete="showDelete(element)"
              @showPdf="showPdfPreview"
            />
            </div>
          </template>
        </draggable>
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
      <v-card-text>确定要删除这张卡片吗？</v-card-text>
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
        <v-card-text class="pa-0" style="height: 500px;">
          <iframe 
              v-if="currentPdf?.url"
              :src="`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(currentPdf.url)}`"
              width="100%" 
              height="100%"
              style="border: none;"
            />
          <div v-else class="d-flex align-center justify-center fill-height">
            <div class="text-center">
              <v-icon icon="mdi-file-pdf-box" size="64" color="red"></v-icon>
              <div class="mt-2">PDF预览</div>
              <div class="text-caption text-grey">{{ currentPdf?.name }}</div>
            </div>
          </div>
        </v-card-text>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
// 正确的导入方式 for Vue 3 + Vuedraggable 4
import draggable from 'vuedraggable'
import BoardCard from "@/components/BoardCard.vue"
import { ref, onMounted, nextTick } from 'vue'
import { useInspirationStore } from "@/stores/inspirationStore"
//消息条
import { useSnackbarStore } from "@/stores/snackbarStore";
//取消挂载
import { onUnmounted } from 'vue';
const snackbarStore = useSnackbarStore();
// 在现有的 ref 定义附近添加
const inspirationStore = useInspirationStore()

// board states
const states = ref(["TODO", "INPROGRESS", "TESTING", "DONE"])

// 数据
const columns = ref([])
const onlineUsers = ref([
  { id: 1, name: "张三" },
  { id: 2, name: "李四" },
])

// WebSocket相关
let websocket = null
const currentUserId = ref('user_' + Math.random().toString(36).substr(2, 9))
const isWebSocketConnected = ref(false)


//灵感板
const getTypeIcon = (type) => {
  const icons = {
    herb: 'mdi-leaf',
    paper: 'mdi-file-document',
    chart: 'mdi-chart-scatter-plot',
    text: 'mdi-text',
    video: 'mdi-play-circle'
  }
  return icons[type] || 'mdi-lightbulb'
}
const importFromInspiration = () => {
  const inspirationItems = inspirationStore.items
  
  if (inspirationItems.length === 0) {
    snackbarStore.showErrorMessage("灵感板暂无内容");
    return
  }

  const todoColumn = columns.value.find(col => col.key === 'TODO')
  if (!todoColumn) return

  let importCount = 0
  
  inspirationItems.forEach(item => {
    const newCard = {
      id: generateId(),
      title: `[${getTypeLabel(item.type)}] ${item.title}`, // 用文字标签而不是图标
      description: item.content + (item.subtitle ? `\n\n${item.subtitle}` : ''),
      order: importCount,
      // 添加元数据，方便后续识别
      metadata: {
        fromInspiration: true,
        inspirationId: item.id,
        inspirationType: item.type,
        inspirationIcon: getTypeIcon(item.type)
      }
    }

    // 如果有图片，添加图片
    if (item.image && item.image.trim()) {
      newCard.imageUrl = item.image
    }

    todoColumn.cards.unshift(newCard)
    importCount++
  })

  // 更新所有卡片的order
  todoColumn.cards.forEach((card, index) => {
    card.order = index
  })
   snackbarStore.showSuccessMessage(`成功导入 ${importCount} 个灵感项目到 TODO 列`);
  
    // 【新增】发送WebSocket通知
  sendBoardOperation('import_inspiration')
}

// 获取类型对应的文字标签
const getTypeLabel = (type) => {
  const labels = {
    herb: '药材',
    paper: '文献',
    chart: '图表', 
    text: '笔记',
    video: '视频'
  }
  return labels[type] || '灵感'
}
// 对话框状态
const editDialog = ref(false)
const deleteDialog = ref(false)
const pdfDialog = ref(false)
const cardToEdit = ref(null)
const cardToDelete = ref(null)
const currentPdf = ref(null)
const title = ref("")
const description = ref("")
const editFile = ref(null)

// 生成唯一ID的函数
const generateId = () => {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

onMounted(() => {
  initColumns()
  // 延迟初始化数据，确保DOM已经准备好
  nextTick(() => {
    initTestData()
    connectWebSocket()
  })
})

// 初始化列
const initColumns = () => {
  states.value.forEach((state) => {
    columns.value.push({
      key: state,
      cards: [],
      isAddVisible: false,
      addTitle: "",
      addFile: null,
    })
  })
}

// WebSocket连接
const connectWebSocket = () => {
  const roomId = 'board_default'
  
  websocket = new WebSocket(`ws://localhost:81/api/ws?uid=${currentUserId.value}&roomId=${roomId}`)
  
  websocket.onopen = () => {
    console.log('看板WebSocket连接成功')
    isWebSocketConnected.value = true
  }
  
  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  }
  
  websocket.onclose = () => {
    console.log('看板WebSocket连接关闭')
    isWebSocketConnected.value = false
  }
  
  websocket.onerror = (error) => {
    console.error('看板WebSocket错误:', error)
    isWebSocketConnected.value = false
  }
}

// 处理WebSocket消息
const handleWebSocketMessage = (message) => {
  console.log('收到WebSocket消息:', message)
  
  switch (message.type) {
    case 'user_join':
    case 'user_leave':
      if (message.onlineUsers) {
        onlineUsers.value = Array.from(message.onlineUsers).map(id => ({ 
          id, 
          name: id.startsWith('user_') ? id.substring(5, 10) : id 
        }))
      }
      break
    case 'board_operation':
      if (message.data && message.data.columns && message.fromUser !== currentUserId.value) {
        columns.value = message.data.columns
        snackbarStore.showInfoMessage(`用户 ${message.fromUser.substring(5, 10)} 更新了看板`)
      }
      break
    case 'board_sync':
      if (message.data && message.data.columns) {
        columns.value = message.data.columns
      }
      break
  }
}

// 发送看板操作
const sendBoardOperation = (operation) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({
      type: 'board_operation',
      operation: operation,
      data: { columns: columns.value }
    }))
  }
}
// 初始化测试数据
const initTestData = () => {
  const testData = {
    TODO: [
      {
        id: generateId(),
        title: "fix: 💭 channel label on chat app",
        description: "we need it bolder",
        order: 0,
      },
      {
        id: generateId(),
        title: "feature: new emojis on board 🤘",
        description: "we need it for reasons 🤤",
        order: 1,
        imageUrl: "https://i.pinimg.com/1200x/f8/e5/45/f8e54532af278bf453cc4825659905cc.jpg",
      },
      {
        id: generateId(),
        title: "feature: new emojis on board ",
        description: "Good Landscape",
        order: 2,
        imageUrl: "https://i.pinimg.com/736x/e7/4b/04/e74b043adfbc9f212d6d9af45c208851.jpg",
      },
    ],
    INPROGRESS: [
      {
        id: generateId(),
        title: "refactor: scroll 📜 directive on big pages",
        description: "remember to check the scroll",
        order: 0,
      },
    ],
    TESTING: [
      {
        id: generateId(),
        title: "feature: add stripe account on signup",
        description: "",
        order: 0,
        pdfInfo: { name: "设计文档.pdf", url: "https://biomedinfo.oss-cn-beijing.aliyuncs.com/user-uploads/4fbd52a1-ffb1-4124-b606-fa68c2156210_PixivAI 最简部署方案.pdf" },
      },
    ],
    DONE: [
      {
        id: generateId(),
        title: "feature: add big cards on dashboard",
        description: "everyone loves cards",
        order: 0,
      },
    ],
  }

  // 分配数据到各列
  columns.value.forEach(column => {
    if (testData[column.key]) {
      column.cards = testData[column.key]
    }
  })
}

// 添加卡片
const addCard = async (column) => {
  const { addTitle, addFile } = column
  if (!addTitle) return
  
  const newCard = {
    id: generateId(),
    title: addTitle,
    description: "",
    order: 0,
  }

  // 处理文件上传
    if (addFile && addFile.length > 0) {
      const file = addFile[0] // v-file-input 返回的是数组，取第一个文件
      console.log('Processing file:', file) // 调试用

      if (file.type.startsWith('image/')) {
        newCard.imageUrl = await uploadFile(file)
      } else if (file.type === 'application/pdf') {
        newCard.pdfInfo = {
          name: file.name,
          url: await uploadFile(file)
        }
      }
    }

  // 添加到列的开头
  column.cards.unshift(newCard)
  
  // 更新所有卡片的order
  column.cards.forEach((card, index) => {
    card.order = index
  })
  
  // 重置表单
  column.addTitle = ""
  column.addFile = null
  column.isAddVisible = false

  // 【新增】发送WebSocket通知
  sendBoardOperation('add_card')
}

// 处理拖拽变化
const handleDragChange = (evt, colIndex) => {
  const column = columns.value[colIndex]
  
  // 更新该列中所有卡片的order
  column.cards.forEach((card, index) => {
    card.order = index
  })
  
  // 如果有新增的元素，记录日志
  if (evt.added) {
    console.log('Card moved to:', column.key)
  }

  // 【新增】发送WebSocket通知
  sendBoardOperation('move_card')
}

// 编辑卡片
const showEdit = (card) => {
  cardToEdit.value = card
  title.value = card.title
  description.value = card.description || ""
  editDialog.value = true
}

const saveCard = async () => {
  if (cardToEdit.value) {
    cardToEdit.value.title = title.value
    cardToEdit.value.description = description.value
    if (editFile.value && editFile.value.length > 0) {
      const file = editFile.value[0] // v-file-input 返回的是数组，取第一个文件
      console.log('Processing edit file:', file) // 调试用
      
      if (file.type.startsWith('image/')) {
        cardToEdit.value.imageUrl = await uploadFile(file)
        delete cardToEdit.value.pdfInfo
      } else if (file.type === 'application/pdf') {
        cardToEdit.value.pdfInfo = {
          name: file.name,
          url: await uploadFile(file)
        }
        delete cardToEdit.value.imageUrl
      }
    }
    
    editDialog.value = false
    editFile.value = null
    // 【新增】发送WebSocket通知
    sendBoardOperation('edit_card')
  }
}

// 删除卡片
const showDelete = (card) => {
  cardToDelete.value = card
  deleteDialog.value = true
}

const deleteCard = () => {
  if (cardToDelete.value) {
    // 在所有列中查找并删除
    columns.value.forEach(column => {
      const index = column.cards.findIndex(c => c.id === cardToDelete.value.id)
      if (index !== -1) {
        column.cards.splice(index, 1)
        // 更新剩余卡片的order
        column.cards.forEach((card, i) => {
          card.order = i
        })
      }
    })

  }
  
  deleteDialog.value = false
  cardToDelete.value = null

  // 【新增】发送WebSocket通知
  sendBoardOperation('delete_card')
}

// PDF预览
const showPdfPreview = (pdfInfo) => {
  currentPdf.value = pdfInfo
  pdfDialog.value = true
}

// 从数据中心粘贴
const pasteFromDataCenter = () => {
  const todoColumn = columns.value.find(col => col.key === 'TODO')
  if (todoColumn) {
    const newCard = {
      id: generateId(),
      title: `数据中心导入 - ${new Date().toLocaleString()}`,
      description: "从数据中心导入的观测数据",
      order: 0,
    }
    
    todoColumn.cards.unshift(newCard)
    
    // 更新order
    todoColumn.cards.forEach((card, index) => {
      card.order = index
    })
  }
}

// 文件上传
const uploadFile = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/oss/upload_general_file', {
      method: 'POST',
      body: formData
    })
    const result = await response.json()
    if (result.code === 20000) {
      return result.data
    } else {
      throw new Error(result.msg || '上传失败')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    // 降级处理
    return file.type.startsWith('image/') ? URL.createObjectURL(file) : '/placeholder.pdf'
  }
}

// 组件销毁时清理WebSocket连接
onUnmounted(() => {
  if (websocket) {
    websocket.close()
  }
})
</script>

<style lang="scss" scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.board-item {
  transition: transform 0.2s;
  user-select: none;
  &:hover {
    transition: transform 0.2s;
    transform: translateY(-3px);
  }
}

.list-group {
  min-height: 100px;
  padding-bottom: 20px;
}

.drag-handle {
  cursor: move;
}
</style>