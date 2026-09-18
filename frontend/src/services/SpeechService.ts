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
  private vozEscolhida: SpeechSynthesisVoice | null = null;
  private nomeVozPreferida = "Microsoft Maria - Portuguese (Brazil)";

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

    if (window.speechSynthesis) {
      this.carregarVoz();
      // As vozes às vezes só ficam disponíveis depois desse evento disparar
      window.speechSynthesis.onvoiceschanged = () => this.carregarVoz();
    }
  }

  private carregarVoz(): void {
    const vozes = window.speechSynthesis.getVoices();
    this.vozEscolhida =
      vozes.find((v) => v.name === this.nomeVozPreferida) ||
      vozes.find((v) => v.lang.startsWith("pt") && /female|mulher|maria|luciana|helena/i.test(v.name)) ||
      vozes.find((v) => v.lang.startsWith("pt")) ||
      null;
  }

  public listarVozesPortugues(): SpeechSynthesisVoice[] {
    return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("pt"));
  }

  public definirVoz(nome: string): void {
    this.nomeVozPreferida = nome;
    this.carregarVoz();
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
    if (this.vozEscolhida) {
      utterance.voice = this.vozEscolhida;
    }
    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();