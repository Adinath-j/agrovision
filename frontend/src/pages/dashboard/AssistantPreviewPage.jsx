import React, { useState, useEffect, useRef } from 'react';
import { 
  BotMessageSquare, 
  Send, 
  User, 
  Languages, 
  Sparkles, 
  ShieldAlert, 
  MapPin, 
  PlusCircle, 
  History, 
  HelpCircle,
  RefreshCw,
  Sprout,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AssistantPreviewPage() {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  
  const [sessions, setSessions] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      sender: 'ASSISTANT',
      content: 'Namaste! I am your AGROVISION AI Agronomist. I have loaded your farm parcel profile, soil test benchmarks, and local weather alerts. How can I assist your cultivation today?',
      created_at: 'Just now'
    }
  ]);
  
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "What is the optimal sowing window for Soybean in my district?",
    "How should I split urea and potash for my soil type?",
    "How do I prevent fungal rust lesions on crop leaves?",
    "Which APMC mandi currently offers the best price?"
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech Recognition (STT) State
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');
  const recognitionRef = useRef(null);

  // Text-to-Speech (TTS) State
  const [speakingIdx, setSpeakingIdx] = useState(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Map app language code to BCP-47 locale
  const getBcp47Locale = (lang) => {
    switch (lang) {
      case 'hi':
        return 'hi-IN';
      case 'mr':
        return 'mr-IN';
      default:
        return 'en-IN';
    }
  };

  // Toggle Voice Input (Speech Recognition)
  const toggleListening = () => {
    setRecognitionError('');
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getBcp47Locale(language);
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setRecognitionError(`Speech recognition: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setRecognitionError('Microphone access denied or unavailable.');
      setIsListening(false);
    }
  };

  // Text to Speech playback
  const handleToggleSpeak = (idx, text) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech audio is not supported in this browser.');
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingIdx(idx);

    // Clean markdown asterisks and hashtags for natural speech
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getBcp47Locale(language);
    utterance.rate = 0.95;

    // Pick best regional voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetLang = getBcp47Locale(language);
    const regionalVoice = voices.find((v) => v.lang === targetLang || v.lang.startsWith(language));
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }

    utterance.onend = () => {
      setSpeakingIdx(null);
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback ended with state:', e);
      setSpeakingIdx(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Load user farms & past chat sessions
  useEffect(() => {
    api.get('/api/farms/records/')
      .then((res) => {
        const list = res.data.results || res.data || [];
        setFarms(list);
        if (list.length > 0) setSelectedFarmId(list[0].id);
      })
      .catch((err) => console.error(err));

    loadSessions();
  }, []);

  const loadSessions = () => {
    api.get('/api/assistant/history/')
      .then((res) => {
        setSessions(res.data.sessions || []);
      })
      .catch((err) => console.error(err));
  };

  const handleSelectSession = (convId) => {
    setLoading(true);
    setCurrentConvId(convId);
    api.get(`/api/assistant/conversations/${convId}/`)
      .then((res) => {
        setMessages(res.data.messages || []);
        if (res.data.language) setLanguage(res.data.language);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleNewSession = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingIdx(null);
    setCurrentConvId(null);
    setMessages([
      {
        sender: 'ASSISTANT',
        content: language === 'hi' 
          ? 'नमस्ते! मैं आपका एग्रोविज़न कृषि सलाहकार हूँ। मैं आपके खेत, मिट्टी और मौसम के अनुसार सटीक सलाह देने के लिए तैयार हूँ।'
          : language === 'mr'
          ? 'नमस्कार! मी आपला ॲग्रोव्हिजन कृषी सल्लागार आहे. आपल्या शेतातील माती, हवामान व पिकांनुसार मार्गदर्शन करण्यासाठी मी सज्ज आहे.'
          : 'Namaste! I am your AGROVISION AI Agronomist. Ready to advise on your crop cultivation, soil health, and weather risks.',
        created_at: 'Just now'
      }
    ]);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    setInputText('');
    setMessages((prev) => [
      ...prev,
      { sender: 'FARMER', content: text, created_at: 'Just now' }
    ]);
    setLoading(true);

    try {
      const res = await api.post('/api/assistant/chat/', {
        message: text,
        language: language,
        farm_id: selectedFarmId,
        conversation_id: currentConvId
      });

      setCurrentConvId(res.data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'ASSISTANT', 
          content: res.data.response,
          context: res.data.context_summary,
          created_at: 'Just now'
        }
      ]);

      if (res.data.suggested_prompts) {
        setSuggestedPrompts(res.data.suggested_prompts);
      }
      loadSessions();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'ASSISTANT', 
          content: 'Unable to connect to advisory service. Please verify your connection.',
          created_at: 'Just now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Multilingual Voice & Chat Agronomist
            </span>
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Grounded Context Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#174C32] mt-1.5 flex items-center gap-2.5">
            <BotMessageSquare className="w-7 h-7 text-[#2E8B57]" />
            AI Farming Assistant
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Scientifically validated agronomic decision support with real-time Speech-to-Text & Text-to-Speech in English, Hindi (हिंदी), and Marathi (मराठी)
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {/* Farm selector */}
          {farms.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.farm_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Language Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => {
                setLanguage('en');
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setSpeakingIdx(null);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === 'en' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setLanguage('hi');
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setSpeakingIdx(null);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === 'hi' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => {
                setLanguage('mr');
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setSpeakingIdx(null);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                language === 'mr' ? 'bg-[#174C32] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Interface Dual Layout: Sidebar (1 Col) & Chat Stream (3 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[680px]">
        {/* Past Sessions Sidebar (1 Col) */}
        <div className="hidden lg:flex flex-col bg-white rounded-3xl p-4 border border-gray-200 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <History className="w-4 h-4 text-emerald-700" />
              <span>Advisory Threads</span>
            </div>
            <button
              onClick={handleNewSession}
              className="p-1 text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Start New Thread"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <button
              onClick={handleNewSession}
              className="w-full text-left p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>+ New Agronomic Query</span>
            </button>

            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`w-full text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                  currentConvId === s.id
                    ? 'bg-[#174C32] text-white border-[#174C32] shadow-2xs'
                    : 'bg-gray-50/70 border-gray-100 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="font-bold truncate">{s.title}</div>
                <div className={`text-[10px] mt-1 flex justify-between ${
                  currentConvId === s.id ? 'text-emerald-200' : 'text-gray-400'
                }`}>
                  <span>{s.updated_at}</span>
                  <span className="uppercase">{s.language}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center">
            ICAR Guidelines Aligned
          </div>
        </div>

        {/* Chat Stream (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-200 shadow-2xs flex flex-col overflow-hidden">
          {/* Chat Header Status */}
          <div className="p-4 bg-emerald-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
                <BotMessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  AGROVISION AI Agronomist
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-emerald-300/80">
                  Voice Mode: Active ({getBcp47Locale(language)}) &bull; Language: {language.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={handleNewSession}
              className="lg:hidden text-xs bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg"
            >
              + New
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#F8FAF7]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${m.sender === 'FARMER' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    m.sender === 'FARMER'
                      ? 'bg-[#174C32] text-white shadow-xs'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {m.sender === 'FARMER' ? <User className="w-4 h-4" /> : <BotMessageSquare className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-2xl p-4 rounded-3xl text-xs leading-relaxed space-y-2 whitespace-pre-line shadow-2xs ${
                    m.sender === 'FARMER'
                      ? 'bg-[#174C32] text-white rounded-tr-xs'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">{m.content}</div>
                    
                    {/* Feature B: Text-to-Speech Playback Speaker Button */}
                    {m.sender === 'ASSISTANT' && (
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(idx, m.content)}
                        className={`p-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                          speakingIdx === idx
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300 animate-pulse'
                            : 'bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700'
                        }`}
                        title={speakingIdx === idx ? 'Stop Audio' : 'Listen to Audio'}
                      >
                        {speakingIdx === idx ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {m.context && (
                    <div className="pt-2 mt-2 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-400">
                      <span>Parcel: <strong>{m.context.farm}</strong></span>
                      <span>District: <strong>{m.context.district}</strong></span>
                      <span>Latest: <strong>{m.context.latest_yield}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl w-fit border border-emerald-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                <span>AI Agronomist is reviewing soil benchmarks & weather conditions...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Listening Status Banner (Feature B) */}
          {isListening && (
            <div className="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center justify-between text-xs text-red-700 animate-pulse">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600 animate-ping" />
                <span className="font-bold">
                  Listening to voice input ({getBcp47Locale(language)})... Please speak clearly.
                </span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] font-bold text-red-800 hover:underline cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {recognitionError && (
            <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 text-[11px] text-amber-800 flex items-center justify-between">
              <span>{recognitionError}</span>
              <button onClick={() => setRecognitionError('')} className="font-bold hover:underline">Dismiss</button>
            </div>
          )}

          {/* Suggested Prompts Pills */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
              Suggested:
            </span>
            {suggestedPrompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 px-3 py-1.5 rounded-full border border-gray-200 shadow-2xs transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar with Feature B: Voice Input Mic Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-white border-t border-gray-200 flex items-center gap-2.5"
          >
            {/* Feature B: Web Speech API STT Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white border-red-600 shadow-md ring-3 ring-red-200 animate-bounce'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
              title={isListening ? 'Stop Recording' : `Speak in ${getBcp47Locale(language)}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to speech... Speak now...'
                  : language === 'hi' 
                  ? 'बोलकर या लिखकर अपनी खेती से जुड़ा कोई भी प्रश्न पूछें...'
                  : language === 'mr'
                  ? 'बोलून किंवा टाईप करून आपला शेतीविषयक प्रश्न विचारा...'
                  : "Type or speak your agronomic query..."
              }
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/40 text-xs font-medium focus:outline-hidden focus:border-emerald-600 focus:bg-white"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-[#174C32] hover:bg-[#123825] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}