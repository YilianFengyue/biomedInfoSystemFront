// electron/main.js (最终调试版，带日志记录)

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs'); // 1. 引入文件系统模块

// --- 日志记录设置 ---
const logDirectory = app.getPath('userData'); // 获取用户数据目录，这是一个安全的可写路径
const logFilePath = path.join(logDirectory, 'backend-log.txt');

// 清空旧日志
fs.writeFileSync(logFilePath, 'Log started at ' + new Date().toString() + '\n\n');

function logToFile(message) {
  console.log(message); // 同时在控制台打印
  fs.appendFileSync(logFilePath, message + '\n'); // 写入到日志文件
}
// --------------------


let backendProcess = null;

function startBackend() {
  if (app.isPackaged) {
    logToFile('App is packaged. Attempting to start backend...');

    const backendPath = path.join(process.resourcesPath, 'backend');
    logToFile(`Backend path resolved to: ${backendPath}`);
    
    const jarFile = path.join(backendPath, 'BiomedInfoSystem-0.0.1-SNAPSHOT.jar');
    logToFile(`JAR file path resolved to: ${jarFile}`);

    const javaExecutable = process.platform === 'win32'
      ? path.join(backendPath, 'jre', 'bin', 'java.exe')
      : path.join(backendPath, 'jre', 'bin', 'java');
    logToFile(`Java executable path resolved to: ${javaExecutable}`);

    try {
      backendProcess = spawn(javaExecutable, ['-jar', jarFile], {
        cwd: backendPath,
        detached: false
      });

      logToFile('Spawn command executed. Process object created.');

      backendProcess.stdout.on('data', (data) => {
        logToFile(`Backend stdout: ${data.toString()}`);
      });

      backendProcess.stderr.on('data', (data) => {
        logToFile(`Backend stderr: ${data.toString()}`);
      });

      backendProcess.on('error', (err) => {
        logToFile(`Spawn ERROR: ${err.toString()}`);
      });

      backendProcess.on('close', (code) => {
        logToFile(`Backend process exited with code ${code}`);
      });

    } catch (error) {
      logToFile(`Failed to execute spawn command: ${error.toString()}`);
    }
  } else {
    logToFile('App is in development mode. Skipping backend start.');
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Vite 打包后的输出目录是 electron/dist
  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  // 判断是否处于开发模式，如果是，则打开开发者工具
  // 注意：'electron-is-dev' 是一个可靠的小型库，但为了减少依赖，我们也可以用 process.env
  // 为了简单起见，我们假设 'npm run electron:dev' 会设置一个环境变量
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// electron/main.js (纯前端客户端版本)

// const { app, BrowserWindow } = require('electron');
// const path = require('path');

// function createWindow() {
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       contextIsolation: true,
//       nodeIntegration: false,
//     }
//   });

//   // 直接加载 Vite 打包好的 index.html
//   mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

//   // 你甚至可以在生产环境中禁用开发者工具
//   // mainWindow.webContents.openDevTools(); 
// }

// app.whenReady().then(() => {
//   createWindow();

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow();
//     }
//   });
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });