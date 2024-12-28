import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	base: process.env.ELECTRON ? './' : '/todo/',
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		port: 3000,
		open: false,
		cors: true,
		host: true,
	},
	build: {
		outDir: 'dist',
		assetsDir: '.',
		emptyOutDir: true,
		sourcemap: false,
		chunkSizeWarningLimit: 1500,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['vue', 'vue-router', 'vue-i18n'],
					chart: ['chart.js', 'chartjs-chart-matrix'],
					d3: ['d3'],
				},
			},
		},
	},
	optimizeDeps: {
		include: ['vue', 'vue-router', 'vue-i18n', '@vueuse/core'],
	},
	define: {
		'process.env': {},
	},
})
