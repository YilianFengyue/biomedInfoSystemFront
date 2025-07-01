// electron/main.js

const { app, BrowserWindow } = require('electron');
const path = require('path');

// 判断是否处于开发环境
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 预加载脚本，推荐使用，用于在渲染进程中安全地暴露 Node.js API
      // 注意：需要您创建一个 preload.js 文件
      preload: path.join(__dirname, 'preload.js'),
      // 出于安全考虑，推荐将 contextIsolation 保持为 true
      contextIsolation: true,
      // 在开发模式下可以启用 nodeIntegration，但发布时建议关闭
      nodeIntegration: false,
    }
  });

  // 根据环境加载不同的 URL
  if (isDev) {
    // 生产环境下，加载打包后的 index.html 文件
    // 关键！这里的路径必须和您用 asar list 看到的路径匹配
    // __dirname 指向 /electron 目录，所以我们需要再拼接上 'dist/index.html'
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    // 自动打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境下，加载打包后的 index.html 文件
    // 根据您之前的日志，Vite 将文件打包到了 electron/dist/ 目录下
    // __dirname 指向当前文件所在的目录 (即 electron/)
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// 当 Electron 完成初始化后，创建窗口
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 除了 macOS 外，当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});