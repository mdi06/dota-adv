import React, { useState, useEffect, useRef } from 'react';
import { Mic, Activity, KeyRound } from 'lucide-react';
import { parseVoiceCommand } from '../utils/voiceCommands';

const VoiceDrafting = ({ heroes, onCommandParsed }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const latestHeroesRef = useRef(heroes);
  const latestCallbackRef = useRef(onCommandParsed);

  useEffect(() => {
    latestHeroesRef.current = heroes;
    latestCallbackRef.current = onCommandParsed;
  });

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
    setTranscript('Microphone off.');
  };

  const startListening = async () => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
      setApiKeyMissing(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true', [
        'token',
        apiKey,
      ]);

      socketRef.current = socket;

      socket.onopen = () => {
        setIsListening(true);
        setTranscript('Listening for commands... (e.g. "Enemy picked Axe")');

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data);
          }
        });

        mediaRecorder.start(250);
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const t = received.channel?.alternatives[0]?.transcript;
        if (t) {
          if (received.is_final) {
            const parsed = parseVoiceCommand(t, latestHeroesRef.current);
            if (parsed) {
              latestCallbackRef.current(parsed.team, parsed.hero);
              setTranscript(`[Success] Slotted ${parsed.hero.localized_name} into ${parsed.team}`);
              stopListening();
            } else {
              setTranscript(`[Unknown] Heard: "${t}"`);
            }
          } else {
            setTranscript(`Hearing: ${t}...`);
          }
        }
      };

      socket.onclose = () => {
        setIsListening(false);
      };

      socket.onerror = (error) => {
        console.error("Deepgram WebSocket Error", error);
        setTranscript('[Error] Deepgram connection failed.');
        stopListening();
      };

    } catch (err) {
      console.error("Microphone Error", err);
      setTranscript('[Error] Cannot access microphone.');
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (apiKeyMissing) {
    return (
      <div className="flex items-center gap-2 p-3 border border-gray-700 bg-[#1a1a1a] text-gray-400 text-sm mb-6">
        <KeyRound size={16} /> 
        <span>Missing VITE_DEEPGRAM_API_KEY in .env</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 p-3 mb-6 border transition-colors ${isListening ? 'border-radiant bg-radiant/10' : 'border-gray-800 bg-[#1a1a1a]'}`}>
      <button 
        className={`flex items-center gap-2 px-4 py-2 border font-bold text-xs uppercase tracking-wider transition-colors ${isListening ? 'border-radiant text-radiant bg-radiant/20' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}`} 
        onClick={toggleListening}
        title="Toggle Voice Auto-Draft"
      >
        {isListening ? <Activity size={16} className="animate-pulse" /> : <Mic size={16} />}
        <span>{isListening ? 'Listening' : 'Start Auto-Draft'}</span>
      </button>
      {transcript && <div className="text-sm font-mono text-gray-400 italic">{transcript}</div>}
    </div>
  );
};

export default VoiceDrafting;
