"use client";
import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [hasSupport, setHasSupport] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSupport(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentText(null);
    }
  }, []);

  const speak = useCallback((text: string, lang: 'en' | 'hi' = 'en') => {
    if (!hasSupport || !text) return;

    // Stop any existing playback
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clear rural understanding
    utterance.pitch = 1.0;

    // Find language-matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => 
      lang === 'hi' ? (v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')) : (v.lang.includes('en-IN') || v.lang.includes('en'))
    );
    if (targetVoice) {
      utterance.voice = targetVoice;
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
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setCurrentText(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [hasSupport]);

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
    hasSupport
  };
}
