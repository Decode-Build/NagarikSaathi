"use client";
import { useState, useEffect, useCallback, useRef } from 'react';

// Clean markdown syntax and formatting for speech synthesis
function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url) -> link text
    .replace(/[*_~`#>-]/g, ' ') // markdown symbols
    .replace(/\s+/g, ' ') // multiple spaces
    .trim();
}

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [hasSupport, setHasSupport] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voicesLoadedRef = useRef(false);

  // Load available system voices & listen for asynchronous voice loading
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSupport(true);

      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
          voicesLoadedRef.current = true;
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentText(null);
    }
  }, []);

  const speak = useCallback((text: string, lang?: 'en' | 'hi') => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Stop previous utterance
    window.speechSynthesis.cancel();

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    const isHindiText = Boolean(cleaned.match(/[\u0900-\u097F]/));
    const targetLang = lang || (isHindiText ? 'hi' : 'en');

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clear rural comprehension
    utterance.pitch = 1.0;

    // Pick best matching voice
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let bestVoice: SpeechSynthesisVoice | undefined;

    if (targetLang === 'hi') {
      bestVoice = voices.find(v => 
        v.lang === 'hi-IN' || 
        v.lang.startsWith('hi') || 
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('hemant')
      );
    } else {
      bestVoice = voices.find(v => 
        v.lang === 'en-IN' || 
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('neerja') ||
        v.name.toLowerCase().includes('prabhat')
      ) || voices.find(v => v.lang.startsWith('en'));
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentText(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error/interrupted:', e);
      setIsPlaying(false);
      setCurrentText(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [availableVoices]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    currentText,
    hasSupport,
    availableVoices
  };
}
