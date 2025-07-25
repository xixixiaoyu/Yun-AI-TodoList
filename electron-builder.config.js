export default {
  appId: 'com.yunmu.yuntodo',
  productName: 'Yun AI Todo',
  copyright: 'Copyright © 2024 yunmu',
  electronDownload: {
    mirror: 'https://npmmirror.com/mirrors/electron/',
    cache: '.cache/electron',
  },

  downloadAlternateFFmpeg: false,
  buildDependenciesFromSource: false,
  nodeGypRebuild: false,
  npmRebuild: false,
  directories: {
    output: 'release/${version}',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'package.json',
    '!node_modules/**/*',
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/.cache/**/*',
    '!src/**/*',
    '!docs/**/*',
    '!scripts/**/*',
    '!*.config.*',
    '!.env*',
    '!.git*',
  ],
  extraResources: [
    {
      from: 'apps/frontend/public/logo.png',
      to: 'logo.png',
    },
  ],
  mac: {
    icon: 'build/icon.icns',
    target: [
      {
        target: 'zip',
        arch: ['x64', 'arm64'],
      },
    ],
    category: 'public.app-category.productivity',
    darkModeSupport: true,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    // 根据环境选择不同的 entitlements 文件
    entitlements:
      process.env.NODE_ENV === 'production'
        ? 'build/entitlements.mac.prod.plist'
        : 'build/entitlements.mac.plist',
    entitlementsInherit:
      process.env.NODE_ENV === 'production'
        ? 'build/entitlements.mac.prod.plist'
        : 'build/entitlements.mac.plist',
    notarize: false,
  },
  dmg: {
    title: '${productName} ${version}',
    icon: 'build/icon.icns',
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 130,
        y: 150,
        type: 'file',
      },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },
  win: {
    signAndEditExecutable: false,
    icon: 'build/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32'],
      },
      {
        target: 'portable',
        arch: ['x64'],
      },
      {
        target: 'zip',
        arch: ['x64'],
      },
    ],
    verifyUpdateCodeSignature: false,
    requestedExecutionLevel: 'asInvoker',
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Yun AI Todo',
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerHeaderIcon: 'build/icon.ico',
    deleteAppDataOnUninstall: false,
    runAfterFinish: true,
    menuCategory: true,
  },
  linux: {
    icon: 'build/icon.png',
    target: [
      {
        target: 'deb',
        arch: ['x64'],
      },
      {
        target: 'rpm',
        arch: ['x64'],
      },
    ],
    category: 'Office',
    maintainer: 'yunmu <1416900346@qq.com>',
    synopsis: 'A modern AI-powered todo application',
    description:
      'Yun AI Todo is a modern, feature-rich todo application with AI integration, built with Vue 3 and Electron.',
    desktop: {
      entry: {
        Name: 'Yun AI Todo',
        Comment: 'A modern AI-powered todo application',
        Keywords: 'todo;task;productivity;ai;',
        StartupWMClass: 'yun-ai-todo',
      },
    },
  },
  publish: {
    provider: 'github',
    owner: 'xixixiaoyu',
    repo: 'todo',
    releaseType: 'release',
    private: false,
    publishAutoUpdate: true,
  },
  compression: 'maximum',
  asar: true,
  asarUnpack: ['**/*.{node,dll}', '**/node_modules/sharp/**/*'],

  // 安全配置
  protocols: [
    {
      name: 'Yun AI Todo',
      schemes: ['yun-ai-todo'],
    },
  ],

  // 性能优化
  removePackageScripts: true,
  removePackageKeywords: true,

  // 额外的文件排除
  extraMetadata: {
    main: 'electron/main.js',
  },
}
