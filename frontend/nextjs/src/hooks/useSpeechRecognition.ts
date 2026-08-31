"use client";
import { useState, useEffect, useCallback, useRef } from 'react';

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = (initialLang: 'en' | 'hi' = 'en') => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<'en' | 'hi'>(initialLang);
  const recognitionRef = useRef<any>(null);
  const [hasSupport, setHasSupport] = useState(false);

  // Synchronize internal voice language when external prop changes
  useEffect(() => {
    setVoiceLang(initialLang);
  }, [initialLang]);

  // Initialize or re-configure recognition when voiceLang changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setHasSupport(true);
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = voiceLang === 'hi' ? 'hi-IN' : 'en-IN';

        recognitionInstance.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
          }
          setText(fullTranscript);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.warn('Speech recognition warning/error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied. Please allow microphone access.');
          } else if (event.error === 'no-speech') {
            setError(null); // normal timeout if user paused
          } else {
            setError(event.error);
          }
          setIsListening(false);
        };

        recognitionRef.current = recognitionInstance;
      } else {
        setHasSupport(false);
        console.warn('Speech recognition not supported in this browser.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [voiceLang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        setError(null);
        setText('');
        recognitionRef.current.lang = voiceLang === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.warn('Failed to start speech recognition:', e);
        // If already active, restart
        if (e.name === 'InvalidStateError') {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
              setIsListening(true);
            }, 100);
          } catch (retryErr) {
            console.warn('Retry start failed:', retryErr);
          }
        } else {
          setError('Microphone start error. Click to retry.');
        }
      }
    }
  }, [voiceLang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Failed to stop speech recognition:', e);
      }
      setIsListening(false);
    }
  }, []);

  const toggleVoiceLang = useCallback(() => {
    const nextLang = voiceLang === 'en' ? 'hi' : 'en';
    setVoiceLang(nextLang);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, [voiceLang, isListening]);

  const clearText = useCallback(() => {
    setText('');
    setError(null);
  }, []);

  return {
    text,
    setText,
    clearText,
    isListening,
    error,
    voiceLang,
    setVoiceLang,
    toggleVoiceLang,
    startListening,
    stopListening,
    hasSupport
  };
};
