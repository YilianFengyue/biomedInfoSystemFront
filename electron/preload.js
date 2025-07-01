const { contextBridge } = require("electron");

const NODE_ENV = process.env.VITE_USER_NODE_ENV;
console.log("预加载脚本，运行环境", NODE_ENV, process);

contextBridge.exposeInMainWorld("myAPI", {
  mytext: "这是暴露的变量"
});