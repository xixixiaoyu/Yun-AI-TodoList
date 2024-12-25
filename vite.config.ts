import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	base: '/todo/', // 添加这行，'todo' 是您的仓库名
	define: {
		'process.env': {},
	},
	assetsInclude: ['**/*.mp3'], // 添加这一行
})
