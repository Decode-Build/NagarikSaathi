import { useState, useRef, useEffect, useCallback } from 'react';
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
  const fallbackTimeoutRef = useRef(null);

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
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    
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
  };

  // Audio level visualizer analyzer
  const startVolumeAnalyser = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn("AudioContext visualizer not supported:", e);
    }
  };

  // Send recorded audio to backend Gemini STT
  const processRecordedAudioWithGemini = async (audioBlob) => {
    if (!audioBlob || audioBlob.size === 0) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    showToast(
      voiceLang === 'hi' 
        ? "AI साथी ऑडियो समझ रहा है..." 
        : "AI Saathi is transcribing audio...", 
      "info"
    );

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', voiceLang);

      const res = await axios.post(`${apiBase}/audio/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 25000
      });

      if (res.data && res.data.transcription) {
        const text = res.data.transcription.trim();
        if (text) {
          showToast(
            voiceLang === 'hi' 
              ? `पहचाना गया: "${text}"` 
              : `Recognized: "${text}"`, 
            "success"
          );
          onResult(text);
        } else {
          showToast(
            voiceLang === 'hi' 
              ? "ऑडियो में आवाज़ स्पष्ट नहीं थी।" 
              : "No speech detected in audio.", 
            "error"
          );
        }
      } else if (res.data && res.data.error) {
        showToast(res.data.error, "info");
      } else {
        showToast(
          voiceLang === 'hi' 
            ? "ऑडियो ट्रांसक्रिप्शन उपलब्ध नहीं है। कृपया टाइप करें।" 
            : "Audio transcription unavailable. Please type your question.", 
          "info"
        );
      }
    } catch (err) {
      console.warn("Gemini Audio STT Error:", err.message);
      showToast(
        voiceLang === 'hi' 
          ? "कृपया अपना प्रश्न चैट बॉक्स में टाइप करें।" 
          : "Please type your question in the chat box.", 
        "info"
      );
    } finally {
      setIsProcessing(false);
      setInterimTranscript('');
    }
  };

  // Start MediaRecorder (Engine 2)
  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startVolumeAnalyser(stream);

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
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch(e){}
          audioContextRef.current = null;
        }
        setAudioLevel(0);
        processRecordedAudioWithGemini(audioBlob);
      };

      recorder.start(250); // collect 250ms chunks
      setIsListening(true);
      showToast(
        voiceLang === 'hi' 
          ? "सुन रहा हूँ... हिन्दी में बोलिए (Listening in Hindi...)" 
          : "Listening... Speak now", 
        "success"
      );

      // Auto-stop after 12 seconds if user doesn't press stop
      fallbackTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopListening();
        }
      }, 12000);

    } catch (micErr) {
      console.error("Microphone access denied or error:", micErr);
      setIsListening(false);
      showToast(
        voiceLang === 'hi' 
          ? "माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया माइक्रोफ़ोन की अनुमति दें।" 
          : "Microphone permission denied. Please allow microphone access.", 
        "error"
      );
      onError(micErr);
    }
  };

  // Start SpeechRecognition (Engine 1 with fallback to Engine 2)
  const startListening = () => {
    stopAllAudio();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // If browser doesn't have Web Speech API, directly use MediaRecorder + Gemini
    if (!SpeechRecognition) {
      console.log("Web Speech API not available, using MediaRecorder + Gemini STT.");
      startMediaRecorder();
      return;
    }

    let speechGotResult = false;
    let finalReceivedText = '';

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = voiceLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Start volume analyser for visual wave animation
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream;
          startVolumeAnalyser(stream);
        })
        .catch(err => {
          console.warn("Could not capture stream for visualizer:", err);
        });

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        showToast(
          voiceLang === 'hi' 
            ? "सुन रहा हूँ... हिन्दी में बोलिए" 
            : "Listening... Speak now", 
          "success"
        );
      };

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalReceivedText += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        setInterimTranscript(interim || finalReceivedText);

        if (finalReceivedText) {
          speechGotResult = true;
          const cleaned = finalReceivedText.trim();
          showToast(
            voiceLang === 'hi' 
              ? `पहचाना गया: "${cleaned}"` 
              : `Recognized: "${cleaned}"`, 
            "success"
          );
          onResult(cleaned);
          stopListening();
        }
      };

      recognition.onerror = (event) => {
        console.warn("Web Speech API error:", event.error);
        if (event.error === 'no-speech') {
          showToast(voiceLang === 'hi' ? "कोई आवाज़ नहीं सुनी गई। कृपया फिर से बोलें।" : "No speech detected. Please speak again.", "info");
          stopListening();
          return;
        }
        if (event.error === 'not-allowed') {
          showToast(voiceLang === 'hi' ? "माइक्रोफ़ोन की अनुमति दें।" : "Microphone permission required.", "error");
          stopAllAudio();
          return;
        }
        // Fall back to MediaRecorder only on actual browser recognition engine failure
        if (!speechGotResult && event.error !== 'aborted') {
          console.log("Web Speech API failed, trying MediaRecorder fallback...");
          stopAllAudio();
          startMediaRecorder();
        }
      };

      recognition.onend = () => {
        if (!speechGotResult && !isProcessing) {
          setIsListening(false);
          setAudioLevel(0);
          setInterimTranscript('');
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
          }
        }
      };

      recognition.start();

    } catch (err) {
      console.warn("Error starting Web Speech API, falling back to MediaRecorder:", err);
      startMediaRecorder();
    }
  };

  const stopListening = () => {
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

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
        ? "वॉइस भाषा सेट: हिन्दी (Hindi 🇮🇳)" 
        : "Voice language set: English 🇬🇧", 
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
