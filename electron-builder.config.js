export default {
	appId: 'com.example.todoapp',
	productName: 'Todo App',
	directories: {
		output: 'release/${version}',
		buildResources: 'build',
	},
	files: ['dist/**/*', 'electron/**/*', 'package.json'],
	mac: {
		icon: 'build/icon.icns',
		target: ['dmg', 'zip'],
		category: 'public.app-category.productivity',
		darkModeSupport: true,
		hardenedRuntime: true,
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
	},
	win: {
		icon: 'build/icon.ico',
		target: [
			{
				target: 'nsis',
				arch: ['x64', 'ia32'],
			},
		],
	},
	nsis: {
		oneClick: false,
		allowToChangeInstallationDirectory: true,
		createDesktopShortcut: true,
		createStartMenuShortcut: true,
	},
	linux: {
		icon: 'build/icon.png',
		target: ['AppImage', 'deb'],
		category: 'Utility',
	},
	publish: {
		provider: 'github',
		releaseType: 'release',
	},
	asar: true,
	asarUnpack: ['**/*.{node,dll}'],
}
