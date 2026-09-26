import { useCallback, useEffect, useRef, useState } from 'react';

type PhoneAiSpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type PhoneAiSpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: PhoneAiSpeechRecognitionAlternative;
};

type PhoneAiSpeechRecognitionResultList = {
  length: number;
  [index: number]: PhoneAiSpeechRecognitionResult;
};

type PhoneAiSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: PhoneAiSpeechRecognitionResultList;
};

type PhoneAiSpeechRecognitionErrorEvent = Event & {
  error: string;
  message?: string;
};

type PhoneAiSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: PhoneAiSpeechRecognitionEvent) => void) | null;
  onerror: ((event: PhoneAiSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type PhoneAiSpeechRecognitionConstructor = new () => PhoneAiSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: PhoneAiSpeechRecognitionConstructor;
    webkitSpeechRecognition?: PhoneAiSpeechRecognitionConstructor;
  }
}

type UseSpeechRecognitionOptions = {
  onTranscript: (transcript: string) => void;
  onError: (message: string) => void;
};

function getRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function getPreferredLanguage() {
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  const normalizedLanguages = languages.map((language) =>
    language.toLowerCase(),
  );

  if (normalizedLanguages.some((language) => language.startsWith('as'))) {
    return 'as-IN';
  }
  if (normalizedLanguages.some((language) => language.startsWith('hi'))) {
    return 'hi-IN';
  }

  // en-IN works well for English and Hinglish on Android browsers.
  return 'en-IN';
}

function getRecognitionErrorMessage(errorCode: string) {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission was denied. Allow access, then try again.';
    case 'no-speech':
      return 'No speech was detected. Tap the microphone to try again.';
    case 'audio-capture':
      return 'No microphone was found. Check your device settings.';
    case 'network':
      return 'Voice input needs a network connection. You can type instead.';
    default:
      return 'Voice input is unavailable right now. You can type instead.';
  }
}

export function useSpeechRecognition({
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<PhoneAiSpeechRecognition | null>(null);
  const isStartingRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onError, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (isStartingRef.current || recognitionRef.current) return;

    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      onErrorRef.current(
        'Voice input is not supported in this browser. You can type instead.',
      );
      return;
    }

    isStartingRef.current = true;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      isStartingRef.current = false;
      const errorName = error instanceof DOMException ? error.name : '';
      if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
        onErrorRef.current(
          'Microphone permission was denied. Allow access, then try again.',
        );
      } else {
        onErrorRef.current(
          'Microphone access is unavailable right now. You can type instead.',
        );
      }
      return;
    }

    const recognition = new Recognition();
    isStartingRef.current = false;
    recognition.lang = getPreferredLanguage();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? '';
      }
      if (transcript.trim()) {
        onTranscriptRef.current(transcript.trim());
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === 'aborted') return;
      onErrorRef.current(getRecognitionErrorMessage(event.error));
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      onErrorRef.current(
        'Voice input could not start. You can type your message instead.',
      );
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    void startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isListening,
    toggleListening,
    stopListening,
  };
}