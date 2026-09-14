type SpeechResultCallback = (text: string) => void;
type SpeechErrorCallback = (error: string) => void;

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

class SpeechService {
  private recognition: SpeechRecognitionInstance | null = null;
  private isSupported = false;

  constructor() {
    const speechWindow = window as unknown as SpeechWindow;

    const SpeechRecognitionAPI =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.lang = "pt-BR";
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.isSupported = true;
    }
  }

  public supported(): boolean {
    return this.isSupported;
  }

  public startListening(
    onResult: SpeechResultCallback,
    onError?: SpeechErrorCallback
  ): void {
    if (!this.recognition) {
      onError?.("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError?.(event.error);
    };

    this.recognition.start();
  }

  public stopListening(): void {
    this.recognition?.stop();
  }

  public speak(text: string): void {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();