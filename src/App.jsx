import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageSquare, AlertCircle, Gamepad2, Volume2, VolumeX, DollarSign, Settings } from 'lucide-react';
import OpenAI from 'openai';

// ---------------------------------------------------------
// 🔒 SECURE KEY LOADING
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
// ---------------------------------------------------------

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

// --- CONFIG ---
const INPUT_LANGUAGES = {
  en: { label: "English", code: "en-US", flag: "🇺🇸" },
  ja: { label: "Japanese", code: "ja-JP", flag: "🇯🇵" },
  th: { label: "Thai", code: "th-TH", flag: "🇹🇭" }
};

const NAMES = ["xX_Slayer", "Mochi_San", "Somchai_99", "Glitch_Boi", "Kawaii_Dev", "Bangkok_Wolf", "Retro_Fan", "NoobMaster", "Stream_Sniper", "Cozy_Bear"];

// --- SOUND ENGINE (Synthesizer) ---
// Generates a "Ding" sound without needing external files
const playDonationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio Playback Error", e);
    }
};

const generateViewers = (count) => {
  const archetypes = [
    { type: "Fan", prompts: "supportive, loves the streamer" },
    { type: "Troll", prompts: "sarcastic, rude, uses 'L', 'KEKW'" },
    { type: "Newbie", prompts: "confused, asks dumb questions" },
    { type: "Hype", prompts: "SHOUTING, EXCITED, CAPSLOCK" }
  ];
  const colors = ["text-red-400", "text-blue-400", "text-green-400", "text-purple-400", "text-yellow-400", "text-pink-400"];

  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    name: NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random() * 100),
    color: colors[Math.floor(Math.random() * colors.length)],
    persona: archetypes[Math.floor(Math.random() * archetypes.length)]
  }));
};

const StreamSimulator = () => {
  // State
  const [isLive, setIsLive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chat, setChat] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputLang, setInputLang] = useState('en');
  
  // New Feature State
  const [gameContext, setGameContext] = useState("Just Chatting");
  const [enableTTS, setEnableTTS] = useState(false);
  const [latestDonation, setLatestDonation] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const viewersRef = useRef([]); 

  useEffect(() => {
    viewersRef.current = generateViewers(6);
  }, []);

  // --- TTS HANDLER ---
  useEffect(() => {
    if (chat.length > 0 && enableTTS) {
        const lastMsg = chat[chat.length - 1];
        if (!lastMsg.isSystem && !lastMsg.spoken) {
            const utterance = new SpeechSynthesisUtterance(`${lastMsg.user} says ${lastMsg.text}`);
            utterance.rate = 1.1;
            utterance.volume = 0.5;
            window.speechSynthesis.speak(utterance);
            lastMsg.spoken = true; // Mark as spoken
        }
    }
  }, [chat, enableTTS]);

  // --- DONATION DISPLAY TIMER ---
  useEffect(() => {
    if (latestDonation) {
        const timer = setTimeout(() => setLatestDonation(null), 5000); // Hide after 5s
        return () => clearTimeout(timer);
    }
  }, [latestDonation]);

  // --- SPEECH RECOGNITION SETUP ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = INPUT_LANGUAGES[inputLang].code;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
            if (currentTranscript.trim().length > 1) { 
                processSpeechToAI(currentTranscript); 
            }
        }, 1500);
      };
    }
  }, [inputLang]); 

  // --- START/STOP ---
  const toggleStream = () => {
    if (isLive) {
      recognitionRef.current.stop();
      setIsLive(false);
    } else {
      recognitionRef.current.start();
      setIsLive(true);
      setChat([]); 
      addSystemMessage("🔴 STREAM STARTED - Good Luck!");
    }
  };

  // --- THE BRAIN (v0.7) ---
  const processSpeechToAI = async (text) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const currentViewers = viewersRef.current;
    
    try {
      const activeViewers = currentViewers.sort(() => 0.5 - Math.random()).slice(0, 3);

      const systemPrompt = `
        You are a Twitch Chat Simulator.
        Current Context: The streamer is playing "${gameContext}".
        Task: React to the streamer's speech based on their persona and the game context.
        
        DONATIONS: occasionally (10% chance), one viewer sends a donation. 
        If donating, add "donation": "amount_string" (e.g. "$5.00") to their object.
      `;

      const userPrompt = `
        Streamer said: "${text}"
        
        Generate 2-3 responses from these personas:
        ${JSON.stringify(activeViewers.map(v => ({ name: v.name, persona: v.persona.prompts })))}
        
        RETURN JSON ARRAY ONLY:
        [
          { "user": "name", "text": "message", "donation": "$10" (optional) }
        ]
      `;

      const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt }, 
            { role: "user", content: userPrompt }
        ],
        model: "gpt-3.5-turbo",
      });

      const rawContent = completion.choices[0].message.content;
      const jsonMatch = rawContent.match(/\[.*\]/s) || rawContent.match(/\{.*\}/s);
      
      if (!jsonMatch) throw new Error("Invalid JSON");
      
      const parsed = JSON.parse(jsonMatch[0]);
      const messages = Array.isArray(parsed) ? parsed : (parsed.messages || []);

      messages.forEach((msg, i) => {
        setTimeout(() => {
          const viewer = currentViewers.find(v => v.name === msg.user) || currentViewers[0];
          
          // Check for donation
          if (msg.donation) {
              playDonationSound();
              setLatestDonation({ user: msg.user, amount: msg.donation, text: msg.text });
          }

          setChat(prev => [...prev, { ...msg, color: viewer.color }]);
          scrollToBottom();
        }, i * 1000);
      });

    } catch (error) {
      console.error("AI Error:", error);
      addSystemMessage(`⚠️ ERROR: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setTranscript(""); 
    }
  };

  const addSystemMessage = (text) => {
    setChat(prev => [...prev, { user: "SYSTEM", text, color: "text-gray-500", isSystem: true }]);
  };

  const scrollToBottom = () => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* DONATION OVERLAY (Appears on top) */}
      {latestDonation && (
        <div className="absolute top-20 z-50 animate-bounce-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1 rounded-xl shadow-2xl border-2 border-yellow-300">
                <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-4 min-w-[300px]">
                    <div className="bg-green-500 p-3 rounded-full text-white animate-pulse">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <div className="text-green-400 font-bold text-xl">{latestDonation.user} donated {latestDonation.amount}!</div>
                        <div className="text-white text-sm italic">"{latestDonation.text}"</div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* HEADER & SETTINGS */}
      <div className="w-full max-w-4xl mb-6 space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <h1 className="text-xl font-bold tracking-wider">VIBE STREAM v0.7</h1>
            </div>
            
            {/* NEW: TTS TOGGLE */}
            <button 
                onClick={() => setEnableTTS(!enableTTS)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${enableTTS ? 'bg-purple-600 border-purple-400' : 'bg-gray-700 border-gray-600'} transition-all`}
            >
                {enableTTS ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                <span className="text-xs font-bold">TTS</span>
            </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            {/* Input Language */}
            <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
                <Mic size={16} className="text-purple-400" />
                <select 
                    value={inputLang}
                    onChange={(e) => setInputLang(e.target.value)}
                    className="bg-gray-800 text-sm border-none rounded text-gray-200 outline-none cursor-pointer"
                >
                    {Object.keys(INPUT_LANGUAGES).map(key => (
                        <option key={key} value={key}>{INPUT_LANGUAGES[key].flag} Voice</option>
                    ))}
                </select>
            </div>

            {/* NEW: Game Context Input */}
            <div className="flex-1 flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
                <Gamepad2 size={16} className="text-blue-400" />
                <input 
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
                    placeholder="What are you playing? (e.g. Elden Ring, Coding)"
                    value={gameContext}
                    onChange={(e) => setGameContext(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* CAMERA AREA */}
        <div className="md:col-span-2 bg-black rounded-xl border border-gray-800 relative flex flex-col items-center justify-center overflow-hidden">
          {!isLive ? (
            <div className="text-center text-gray-500">
              <button onClick={toggleStream} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto transition-transform active:scale-95 shadow-lg shadow-purple-900/50">
                <Mic size={20} /> GO LIVE
              </button>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 opacity-50"></div>
              {/* Fake Camera Interface */}
              <div className="z-10 text-center space-y-4 w-3/4">
                <div className="flex justify-between absolute top-4 left-4 right-4">
                     <span className="text-gray-500 text-xs font-mono">{gameContext}</span>
                     <div className="animate-pulse text-red-500 font-mono text-xs">● REC</div>
                </div>
                
                <div className="bg-gray-900/80 p-4 rounded-lg backdrop-blur-sm border border-gray-700 min-h-[100px] flex items-center justify-center">
                    <p className="text-lg italic text-gray-300">
                        {transcript || <span className="text-gray-600 animate-pulse">Listening...</span>}
                    </p>
                </div>
                <button onClick={toggleStream} className="bg-red-600/80 hover:bg-red-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 mx-auto">
                  <MicOff size={16} /> END STREAM
                </button>
              </div>
            </>
          )}
        </div>

        {/* CHAT AREA */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-full shadow-2xl overflow-hidden relative">
            <div className="bg-gray-800 p-3 border-b border-gray-700 font-bold text-sm flex items-center justify-between">
                <span>CHAT</span>
                <MessageSquare size={16} className="text-gray-400"/>
            </div>
            <div id="chat-box" className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                {chat.length === 0 && <div className="text-gray-600 text-center text-sm mt-10">Chat is quiet...</div>}
                {chat.map((msg, idx) => (
                    <div key={idx} className={`text-sm break-words animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {msg.isSystem ? (
                            <span className={`italic font-mono text-xs ${msg.text.includes("ERROR") ? "text-red-400 font-bold" : "text-gray-500"}`}>
                                {msg.text.includes("ERROR") && <AlertCircle size={12} className="inline mr-1"/>}
                                {msg.text}
                            </span>
                        ) : (
                            <div className={`${msg.donation ? 'bg-green-900/20 p-2 rounded border border-green-800' : ''}`}>
                                <span className={`font-bold ${msg.color} cursor-pointer hover:underline`}>{msg.user}</span>
                                {msg.donation && <span className="ml-2 text-xs bg-green-600 text-white px-1 rounded">{msg.donation}</span>}
                                <span className="text-gray-400 mx-1">:</span>
                                <span className={msg.donation ? "text-green-200 font-bold" : "text-gray-200"}>{msg.text}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {/* Fake Input */}
            <div className="p-3 bg-gray-800 border-t border-gray-700">
                <input disabled placeholder="Chat is read-only" className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-500 cursor-not-allowed"/>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StreamSimulator;