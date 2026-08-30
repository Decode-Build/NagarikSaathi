import { useState, useEffect, useCallback } from 'react';

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = (lang: 'en' | 'hi' = 'en') => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

        recognitionInstance.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setText(currentTranscript);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: any) => {
          // Log as warning rather than error so Next.js doesn't show full-screen overlays in dev mode
          console.warn('Speech recognition error:', event.error);
          setError(event.error);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } else {
        console.warn('Speech recognition not supported in this browser.');
      }
    }
  }, []);

  // Update language dynamically when lang changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [lang, recognition]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        setError(null);
        setText(''); // Reset text state when starting new mic capture
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Failed to start speech recognition:', e);
        setError('failed-to-start');
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Failed to stop speech recognition:', e);
      }
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return {
    text,
    setText,
    isListening,
    error,
    startListening,
    stopListening,
    hasSupport: !!recognition
  };
};
