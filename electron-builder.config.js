export default {
	appId: 'com.example.todoapp',
	productName: 'Todo App',
	electronDownload: {
		mirror: 'https://npmmirror.com/mirrors/electron/',
	},
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
	],
	extraResources: [
		{
			from: 'node_modules/dotenv',
			to: 'node_modules/dotenv',
		},
	],
	mac: {
		icon: 'build/icon.icns',
		target: ['dmg', 'zip'],
		category: 'public.app-category.productivity',
		darkModeSupport: true,
		hardenedRuntime: true,
		gatekeeperAssess: false,
		entitlements: 'build/entitlements.mac.plist',
		entitlementsInherit: 'build/entitlements.mac.plist',
	},
	dmg: {
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
		sign: false,
		signAndEditExecutable: false,
		icon: null,
		target: [
			{
				target: 'portable',
				arch: ['x64'],
			},
		],
	},
	nsis: {
		oneClick: false,
		allowToChangeInstallationDirectory: true,
		createDesktopShortcut: true,
		createStartMenuShortcut: true,
		shortcutName: 'Todo App',
	},
	linux: {
		icon: 'build/icon.png',
		target: ['AppImage', 'deb', 'snap'],
		category: 'Utility',
		maintainer: 'Todo App Team',
		synopsis: 'A modern todo application',
	},
	publish: {
		provider: 'github',
		releaseType: 'release',
		private: false,
		publishAutoUpdate: true,
	},
	asar: true,
	asarUnpack: ['**/*.{node,dll}', '**/node_modules/sharp/**/*', 'dist/**/*'],
}
