module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        productName: 'Todo App',
        appId: 'com.example.todoapp',
        mac: {
          icon: 'build/icon.icns',
        },
        win: {
          icon: 'build/icon.ico',
        },
        linux: {
          icon: 'build/icon.png',
        },
      },
    },
  },
}
