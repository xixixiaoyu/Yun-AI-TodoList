export interface SpeechRecognitionEvent extends Event {
	readonly results: SpeechRecognitionResultList
	readonly resultIndex: number
}

export interface SpeechRecognitionErrorEvent extends Event {
	readonly error: string
	readonly message?: string
}

export interface SpeechRecognition extends EventTarget {
	continuous: boolean
	interimResults: boolean
	lang: string
	maxAlternatives: number
	onstart: ((this: SpeechRecognition, ev: Event) => any) | null
	onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
	onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
	onend: ((this: SpeechRecognition, ev: Event) => any) | null
	start(): void
	stop(): void
	abort(): void
}

interface Window {
	SpeechRecognition: {
		new (): SpeechRecognition
	}
	webkitSpeechRecognition: {
		new (): SpeechRecognition
	}
}

export {}
