export default {
	appId: 'com.example.todoapp',
	productName: 'Todo App',
	directories: {
		output: 'release/${version}',
	},
	files: ['dist/**/*', 'electron/**/*'],
	mac: {
		icon: 'build/icon.icns',
		target: ['dmg'],
	},
	win: {
		icon: 'build/icon.ico',
		target: ['nsis'],
	},
	linux: {
		icon: 'build/icon.png',
		target: ['AppImage'],
	},
}
