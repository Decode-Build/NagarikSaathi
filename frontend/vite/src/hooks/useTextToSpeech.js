import { useState, useRef, useEffect, useCallback } from 'react';

// Retain a module-level reference so Chromium doesn't garbage collect utterances mid-speech
let globalUtterances = [];

export function useTextToSpeech({ apiBase = '/api', showToast = () => {} } = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentId, setCurrentId] = useState(null);

  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Preload browser voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    return () => {
      stop();
    };
  }, []);

  const cleanSpeechText = (rawText) => {
    if (!rawText) return '';
    return String(rawText)
      .replace(/[*_#`~>]/g, '') // strip markdown markers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // strip markdown links
      .replace(/https?:\/\/\S+/g, '') // strip URLs
      .replace(/\{.*?\}|\[.*?\]/g, '') // strip JSON structures
      .replace(/•|\-/g, ' ') // clean bullets
      .replace(/\s+/g, ' ') // normalize spaces
      .trim();
  };

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    globalUtterances = [];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
      audioRef.current = null;
    }

    setIsPlaying(false);
    setCurrentText('');
    setCurrentId(null);
  }, []);

  const playFallbackAudio = (cleanText, isHindi) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const lang = isHindi ? 'hi' : 'en';
      const audioUrl = `${apiBase}/audio/tts?text=${encodeURIComponent(cleanText.slice(0, 200))}&lang=${lang}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentId(null);
      };

      audio.onerror = (e) => {
        console.warn("Fallback audio failed:", e);
        setIsPlaying(false);
        setCurrentId(null);
      };

      audio.play().catch(err => {
        console.warn("Audio autoplay blocked or failed:", err);
        setIsPlaying(false);
        setCurrentId(null);
      });
    } catch (e) {
      console.warn("Could not start fallback audio:", e);
      setIsPlaying(false);
      setCurrentId(null);
    }
  };

  const speak = useCallback((text, id = null) => {
    if (!text) return;

    // Toggle: if already playing this exact id/text, stop it
    if (isPlayingRef.current && (id === currentId || text === currentText)) {
      stop();
      return;
    }

    stop(); // cancel previous speech
    const cleanText = cleanSpeechText(text);
    if (!cleanText) return;

    const isHindi = /[\u0900-\u097F]/.test(cleanText);
    const targetLang = isHindi ? 'hi-IN' : 'en-IN';

    setIsPlaying(true);
    isPlayingRef.current = true;
    setCurrentText(text);
    if (id) setCurrentId(id);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      playFallbackAudio(cleanText, isHindi);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Split into sentences for zero-freeze chunking
      const sentenceDelimiters = isHindi ? /[।\n.!?]+/ : /[.\n!?]+/;
      const sentences = cleanText
        .split(sentenceDelimiters)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (sentences.length === 0) {
        sentences.push(cleanText);
      }

      const voices = window.speechSynthesis.getVoices() || [];
      let matchedVoice = null;

      if (isHindi) {
        matchedVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.replace('_', '-') === 'hi-IN')
          || voices.find(v => v.lang.toLowerCase().startsWith('hi'))
          || voices.find(v => (v.name || '').toLowerCase().includes('hindi') || (v.name || '').includes('हिन्दी') || (v.name || '').toLowerCase().includes('swara') || (v.name || '').toLowerCase().includes('kalpana'))
          || voices.find(v => v.lang.startsWith('hi'));
      } else {
        matchedVoice = voices.find(v => v.lang === 'en-IN' || v.lang.replace('_', '-') === 'en-IN')
          || voices.find(v => (v.name || '').toLowerCase().includes('india') || (v.name || '').toLowerCase().includes('natural'))
          || voices.find(v => v.lang.startsWith('en'))
          || voices[0];
      }

      // If in Hindi mode and browser has absolutely no Hindi voice installed, use server TTS fallback
      if (isHindi && !matchedVoice) {
        console.log("No Hindi browser voice found, using high-quality Server Audio fallback.");
        playFallbackAudio(cleanText, true);
        return;
      }

      let currentIndex = 0;

      const speakNextChunk = () => {
        if (!isPlayingRef.current || currentIndex >= sentences.length) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          setCurrentId(null);
          return;
        }

        const chunk = sentences[currentIndex++];
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = targetLang;
        if (matchedVoice) utterance.voice = matchedVoice;
        utterance.rate = isHindi ? 0.92 : 0.95;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          speakNextChunk();
        };

        utterance.onerror = (event) => {
          console.warn("SpeechSynthesis error:", event);
          if (currentIndex === 1) {
            // First chunk failed, try server TTS fallback
            playFallbackAudio(cleanText, isHindi);
          } else {
            speakNextChunk();
          }
        };

        // Retain reference to prevent GC killing speech mid-sentence
        globalUtterances.push(utterance);
        if (globalUtterances.length > 20) globalUtterances.shift();

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
      };

      speakNextChunk();

    } catch (err) {
      console.error("Speech playback error:", err);
      playFallbackAudio(cleanText, isHindi);
    }
  }, [apiBase, currentId, currentText, stop]);

  return {
    speak,
    stop,
    isPlaying,
    currentId,
    currentText
  };
}
