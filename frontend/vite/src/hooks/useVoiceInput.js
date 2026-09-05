import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export function useVoiceInput({ 
  apiBase = '/api',
  defaultLang = 'hi', 
  onResult = () => {},
  onError = () => {},
  showToast = () => {}
}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLang, setVoiceLang] = useState(defaultLang || 'hi'); // 'hi' or 'en'
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const silenceDetectorTimerRef = useRef(null);
  
  // VAD (Voice Activity Detection) tracking refs for MediaRecorder fallback
  const hasSpokenRef = useRef(false);
  const silenceFrameCountRef = useRef(0);

  // Transcript and submission flags
  const transcriptRef = useRef('');
  const hasSubmittedRef = useRef(false);

  // Sync voiceLang if defaultLang changes externally
  useEffect(() => {
    if (defaultLang) {
      setVoiceLang(defaultLang);
    }
  }, [defaultLang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (silenceDetectorTimerRef.current) {
      clearTimeout(silenceDetectorTimerRef.current);
      silenceDetectorTimerRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    setIsListening(false);
    setIsProcessing(false);
    setAudioLevel(0);
    setInterimTranscript('');
    transcriptRef.current = '';
    hasSubmittedRef.current = false;
    hasSpokenRef.current = false;
    silenceFrameCountRef.current = 0;
  };

  // Helper to submit accumulated transcript once
  const submitTranscript = (text) => {
    const cleaned = (text || '').trim();
    if (!cleaned || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    showToast(
      voiceLang === 'hi' 
        ? `पहचाना गया: "${cleaned}"` 
        : `Recognized: "${cleaned}"`, 
      "success"
    );
    onResult(cleaned);
  };

  // Lightweight animated visualizer for Web Speech API (zero hardware conflict)
  const startSpeechVisualizer = () => {
    let tick = 0;
    const animate = () => {
      tick++;
      const base = transcriptRef.current ? 60 : 30;
      const wave = Math.sin(tick * 0.2) * 22 + Math.cos(tick * 0.35) * 12;
      setAudioLevel(Math.max(12, Math.min(95, Math.round(base + wave))));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  // Process recorded audio using backend Gemini Multimodal STT (Engine 2)
  const processRecordedAudioWithGemini = async (audioBlob) => {
    if (!audioBlob || audioBlob.size < 500) {
      setIsProcessing(false);
      showToast(
        voiceLang === 'hi' 
          ? "कोई आवाज़ नहीं सुनी गई। कृपया दोबारा बोलें।" 
          : "No speech detected. Please speak again.", 
        "info"
      );
      return;
    }

    setIsProcessing(true);
    showToast(
      voiceLang === 'hi' 
        ? "AI साथी समझ रहा है..." 
        : "AI Saathi is processing voice...", 
      "info"
    );

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', voiceLang);

      const res = await axios.post(`${apiBase}/audio/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 12000
      });

      if (res.data && res.data.transcription) {
        const text = res.data.transcription.trim();
        if (text) {
          submitTranscript(text);
        } else {
          showToast(
            voiceLang === 'hi' 
              ? "आवाज़ स्पष्ट नहीं थी। कृपया दोबारा बोलें।" 
              : "Voice not clear. Please speak again.", 
            "info"
          );
        }
      } else {
        showToast(
          voiceLang === 'hi' 
            ? "कृपया अपना प्रश्न चैट में टाइप करें।" 
            : "Please type your question in chat.", 
          "info"
        );
      }
    } catch (err) {
      console.warn("Gemini Audio STT Notice:", err.message);
      showToast(
        voiceLang === 'hi' 
          ? "कृपया अपना प्रश्न चैट में टाइप करें।" 
          : "Please type your question in chat.", 
        "info"
      );
    } finally {
      setIsProcessing(false);
      setInterimTranscript('');
      transcriptRef.current = '';
      hasSubmittedRef.current = false;
    }
  };

  // Start MediaRecorder (Engine 2 fallback with instant Voice Activity & Silence Detection)
  const startMediaRecorder = async () => {
    stopAllAudio();
    hasSpokenRef.current = false;
    silenceFrameCountRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } 
      });
      streamRef.current = stream;

      // Audio Analyzer with Real-Time Silence Detection (VAD)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVAD = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);

          // VAD Logic: Detect speech threshold
          if (level > 15) {
            hasSpokenRef.current = true;
            silenceFrameCountRef.current = 0;
          } else if (hasSpokenRef.current) {
            // User has spoken and is now silent
            silenceFrameCountRef.current += 1;
            // 60fps * ~1.0s = ~60 frames of silence
            if (silenceFrameCountRef.current > 55) {
              // Auto-stop immediately on natural pause!
              stopListening();
              return;
            }
          }

          animFrameRef.current = requestAnimationFrame(checkVAD);
        };
        checkVAD();
      }

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch(e){}
          audioContextRef.current = null;
        }
        setAudioLevel(0);
        processRecordedAudioWithGemini(audioBlob);
      };

      recorder.start(100); // collect 100ms chunks for rapid dispatch
      setIsListening(true);
      hasSubmittedRef.current = false;
      transcriptRef.current = '';

      showToast(
        voiceLang === 'hi' 
          ? "सुन रहा हूँ... बोलिए (Listening in Hindi...)" 
          : "Listening... Speak now", 
        "success"
      );

      // Max safety timeout of 6s (stops automatically if user doesn't stop)
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopListening();
        }
      }, 6000);

    } catch (micErr) {
      console.error("Microphone access error:", micErr);
      setIsListening(false);
      showToast(
        voiceLang === 'hi' 
          ? "माइक्रोफ़ोन की अनुमति दें (Please allow microphone access)." 
          : "Please allow microphone permission in browser settings.", 
        "error"
      );
      onError(micErr);
    }
  };

  // Start SpeechRecognition (Engine 1 with rapid sub-second finalization)
  const startListening = () => {
    stopAllAudio();
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch(e){}
    }

    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

    if (!SpeechRecognition) {
      startMediaRecorder();
      return;
    }

    transcriptRef.current = '';
    hasSubmittedRef.current = false;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = voiceLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false; // Fast, instantaneous single utterance
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        startSpeechVisualizer();
        showToast(
          voiceLang === 'hi' 
            ? "सुन रहा हूँ... बोलिए" 
            : "Listening... Speak now", 
          "success"
        );
      };

      recognition.onresult = (event) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        const combined = (finalStr + interimStr).trim();
        if (combined) {
          transcriptRef.current = combined;
          setInterimTranscript(combined);
        }

        // If engine produced a final result, submit immediately without waiting!
        if (finalStr.trim()) {
          const finishedText = (finalStr + interimStr).trim();
          stopListening();
          submitTranscript(finishedText);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Web Speech API event:", event.error);
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          showToast(
            voiceLang === 'hi' 
              ? "कृपया ब्राउज़र में माइक्रोफ़ोन की अनुमति (Allow Mic) दें।" 
              : "Please allow microphone permission in your browser address bar.", 
            "error"
          );
          stopAllAudio();
          return;
        }

        if (event.error === 'no-speech') {
          // If speech was partially buffered, submit it; else fall back
          if (transcriptRef.current.trim()) {
            submitTranscript(transcriptRef.current.trim());
            stopListening();
          } else {
            // Auto fallback to MediaRecorder if web speech heard silence
            startMediaRecorder();
          }
          return;
        }

        // Switch to MediaRecorder on network/audio-capture error
        if (event.error === 'network' || event.error === 'audio-capture' || event.error === 'aborted') {
          if (transcriptRef.current.trim()) {
            submitTranscript(transcriptRef.current.trim());
            stopListening();
          } else {
            startMediaRecorder();
          }
        }
      };

      recognition.onend = () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        setIsListening(false);
        setAudioLevel(0);

        // Instant submit if transcript exists
        if (transcriptRef.current.trim() && !hasSubmittedRef.current) {
          submitTranscript(transcriptRef.current.trim());
        }

        setInterimTranscript('');
      };

      // 6s safety timeout
      autoStopTimerRef.current = setTimeout(() => {
        stopListening();
      }, 6000);

      recognition.start();

    } catch (err) {
      console.warn("Error starting Web Speech API, falling back to MediaRecorder:", err);
      startMediaRecorder();
    }
  };

  const stopListening = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (silenceDetectorTimerRef.current) {
      clearTimeout(silenceDetectorTimerRef.current);
      silenceDetectorTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // If Web Speech API was active
    if (recognitionRef.current) {
      const pendingText = transcriptRef.current.trim();
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;

      if (pendingText && !hasSubmittedRef.current) {
        submitTranscript(pendingText);
      }

      setIsListening(false);
      setAudioLevel(0);
      setInterimTranscript('');
    }

    // If MediaRecorder was active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        setIsListening(false);
        setIsProcessing(true);
        mediaRecorderRef.current.stop();
      } catch (e) {
        setIsProcessing(false);
      }
    } else {
      setIsListening(false);
      setAudioLevel(0);
      setInterimTranscript('');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  const toggleVoiceLang = () => {
    const nextLang = voiceLang === 'hi' ? 'en' : 'hi';
    setVoiceLang(nextLang);
    showToast(
      nextLang === 'hi' 
        ? "वॉइस भाषा: हिन्दी 🇮🇳 (Voice: Hindi)" 
        : "Voice: English 🇬🇧 (वॉइस: इंग्लिश)", 
      "info"
    );
  };

  return {
    isListening,
    isProcessing,
    voiceLang,
    setVoiceLang,
    toggleVoiceLang,
    interimTranscript,
    audioLevel,
    startListening,
    stopListening,
    stopAllAudio
  };
}
