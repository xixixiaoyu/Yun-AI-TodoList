import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'coverage/**/*.js',
      'coverage/**/*.html',
      'coverage/**/*.css',
      'release/**',
      '*.min.js',
      'public/**',
      '.husky/**',
      '**/prettify.js',
      '**/sorter.js',
      '**/block-navigation.js'
    ]
  },

  js.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        // Vue I18n globals
        __VUE_I18N_LEGACY_API__: 'readonly',
        __VUE_I18N_FULL_INSTALL__: 'readonly',
        __INTLIFY_PROD_DEVTOOLS__: 'readonly',

        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',

        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        AbortController: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',

        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MessageEvent: 'readonly',
        MediaQueryListEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        EventTarget: 'readonly',

        Notification: 'readonly',
        SpeechRecognition: 'readonly',
        webkitSpeechRecognition: 'readonly',
        SpeechRecognitionResultList: 'readonly',

        RouteLocationNormalized: 'readonly',
        NavigationGuardNext: 'readonly',

        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',

        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',

        // Web APIs
        Worker: 'readonly',
        ResizeObserver: 'readonly',
        FormData: 'readonly',

        // Auto-imported Vue APIs
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onBeforeMount: 'readonly',
        onBeforeUnmount: 'readonly',
        onUpdated: 'readonly',
        onBeforeUpdate: 'readonly',
        onActivated: 'readonly',
        onDeactivated: 'readonly',
        onErrorCaptured: 'readonly',
        nextTick: 'readonly',
        provide: 'readonly',
        inject: 'readonly',
        defineComponent: 'readonly',
        defineAsyncComponent: 'readonly',
        createApp: 'readonly',
        h: 'readonly',
        toRef: 'readonly',
        toRefs: 'readonly',
        unref: 'readonly',
        isRef: 'readonly',
        isReactive: 'readonly',
        isReadonly: 'readonly',
        isProxy: 'readonly',
        markRaw: 'readonly',
        shallowRef: 'readonly',
        shallowReactive: 'readonly',
        shallowReadonly: 'readonly',
        readonly: 'readonly',
        customRef: 'readonly',
        triggerRef: 'readonly',
        toRaw: 'readonly',
        effectScope: 'readonly',
        getCurrentScope: 'readonly',
        onScopeDispose: 'readonly',
        getCurrentInstance: 'readonly',
        useAttrs: 'readonly',
        useSlots: 'readonly',
        useCssModule: 'readonly',
        useCssVars: 'readonly',

        // Vue Router APIs
        useRouter: 'readonly',
        useRoute: 'readonly',
        onBeforeRouteLeave: 'readonly',
        onBeforeRouteUpdate: 'readonly',

        // Vue I18n APIs
        useI18n: 'readonly',

        // VueUse APIs (commonly used ones)
        useWindowSize: 'readonly',
        useMouse: 'readonly',
        useLocalStorage: 'readonly',
        useSessionStorage: 'readonly',
        useClipboard: 'readonly',
        useEventListener: 'readonly',
        useDark: 'readonly',
        useColorMode: 'readonly',
        useToggle: 'readonly',
        useCounter: 'readonly',
        useDebounce: 'readonly',
        useDebounceFn: 'readonly',
        useThrottle: 'readonly',
        useThrottleFn: 'readonly',
        useInterval: 'readonly',
        useTimeout: 'readonly',
        useNow: 'readonly',
        useTimestamp: 'readonly',
        useMounted: 'readonly',
        useElementSize: 'readonly',
        useElementVisibility: 'readonly',
        useIntersectionObserver: 'readonly',
        useResizeObserver: 'readonly',
        useMutationObserver: 'readonly',
        useMediaQuery: 'readonly',
        useBreakpoints: 'readonly',
        useOnline: 'readonly',
        useNetwork: 'readonly',
        useFetch: 'readonly',
        useAsyncState: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error'
    }
  },

  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      },
      globals: {
        // Vue I18n globals
        __VUE_I18N_LEGACY_API__: 'readonly',
        __VUE_I18N_FULL_INSTALL__: 'readonly',
        __INTLIFY_PROD_DEVTOOLS__: 'readonly',

        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',

        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        AbortController: 'readonly',
        TextDecoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',

        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MessageEvent: 'readonly',
        MediaQueryListEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        EventTarget: 'readonly',

        Notification: 'readonly',
        SpeechRecognition: 'readonly',
        webkitSpeechRecognition: 'readonly',
        SpeechRecognitionResultList: 'readonly',

        RouteLocationNormalized: 'readonly',
        NavigationGuardNext: 'readonly',

        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',

        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',

        // Web APIs
        Worker: 'readonly',
        ResizeObserver: 'readonly',

        // Auto-imported Vue APIs
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onBeforeMount: 'readonly',
        onBeforeUnmount: 'readonly',
        onUpdated: 'readonly',
        onBeforeUpdate: 'readonly',
        onActivated: 'readonly',
        onDeactivated: 'readonly',
        onErrorCaptured: 'readonly',
        nextTick: 'readonly',
        provide: 'readonly',
        inject: 'readonly',
        defineComponent: 'readonly',
        defineAsyncComponent: 'readonly',
        h: 'readonly',
        toRef: 'readonly',
        toRefs: 'readonly',
        unref: 'readonly',
        isRef: 'readonly',
        isReactive: 'readonly',
        isReadonly: 'readonly',
        isProxy: 'readonly',
        markRaw: 'readonly',
        shallowRef: 'readonly',
        shallowReactive: 'readonly',
        shallowReadonly: 'readonly',
        readonly: 'readonly',
        customRef: 'readonly',
        triggerRef: 'readonly',
        toRaw: 'readonly',
        effectScope: 'readonly',
        getCurrentScope: 'readonly',
        onScopeDispose: 'readonly',
        getCurrentInstance: 'readonly',
        useAttrs: 'readonly',
        useSlots: 'readonly',
        useCssModule: 'readonly',
        useCssVars: 'readonly',

        // Vue Router APIs
        useRouter: 'readonly',
        useRoute: 'readonly',
        onBeforeRouteLeave: 'readonly',
        onBeforeRouteUpdate: 'readonly',

        // Vue I18n APIs
        useI18n: 'readonly',

        // VueUse APIs (commonly used ones)
        useWindowSize: 'readonly',
        useMouse: 'readonly',
        useLocalStorage: 'readonly',
        useSessionStorage: 'readonly',
        useClipboard: 'readonly',
        useEventListener: 'readonly',
        useDark: 'readonly',
        useColorMode: 'readonly',
        useToggle: 'readonly',
        useCounter: 'readonly',
        useDebounce: 'readonly',
        useDebounceFn: 'readonly',
        useThrottle: 'readonly',
        useThrottleFn: 'readonly',
        useInterval: 'readonly',
        useTimeout: 'readonly',
        useNow: 'readonly',
        useTimestamp: 'readonly',
        useMounted: 'readonly',
        useElementSize: 'readonly',
        useElementVisibility: 'readonly',
        useIntersectionObserver: 'readonly',
        useResizeObserver: 'readonly',
        useMutationObserver: 'readonly',
        useMediaQuery: 'readonly',
        useBreakpoints: 'readonly',
        useOnline: 'readonly',
        useNetwork: 'readonly',
        useFetch: 'readonly',
        useAsyncState: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      vue
    },
    rules: {
      'vue/no-v-html': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',

      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error'
    }
  },

  {
    files: ['**/workers/**/*.ts', '**/worker*.ts', 'src/workers/**/*.ts'],
    languageOptions: {
      globals: {
        self: 'readonly',
        importScripts: 'readonly',
        postMessage: 'readonly',
        onmessage: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    }
  },

  {
    files: ['*.config.js', '*.config.ts', 'vite.config.ts', 'vitest.config.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  },

  {
    files: [
      'electron/**/*.js',
      'scripts/**/*.js',
      'scripts/**/*.mjs',
      '*.config.js',
      '*.config.mjs'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',

        electron: 'readonly',

        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  },

  {
    files: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js', 'src/test/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        test: 'readonly',
        suite: 'readonly',

        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        AbortController: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',

        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // 在测试中允许使用 any
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-console': 'off',
      'no-undef': 'off'
    }
  },

  {
    files: ['*.d.ts'],
    languageOptions: {
      globals: {
        NotificationOptions: 'readonly',
        Notification: 'readonly',

        Window: 'readonly',
        Document: 'readonly',
        Element: 'readonly',
        Event: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off'
    }
  },

  prettier
]
