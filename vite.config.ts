import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	base: process.env.ELECTRON ? './' : '/todo/',
	define: {
		'process.env': {},
	},
	build: {
		outDir: 'dist',
		assetsDir: '.',
		emptyOutDir: true,
	},
})
