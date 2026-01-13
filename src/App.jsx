import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Users, MessageSquare, AlertCircle } from 'lucide-react';
import OpenAI from 'openai';

// ---------------------------------------------------------
// 🔒 SECURE KEY LOADING
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing API Key! Check your .env file.");
}
// ---------------------------------------------------------

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

// We only need input languages now
const INPUT_LANGUAGES = {
  en: { label: "English", code: "en-US", flag: "🇺🇸" },
  ja: { label: "Japanese", code: "ja-JP", flag: "🇯🇵" },
  th: { label: "Thai", code: "th-TH", flag: "🇹🇭" }
};

// Helper
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const NAMES = [
    "xX_Slayer", "Mochi_San", "Somchai_99", "Glitch_Boi", "Kawaii_Dev", 
    "Bangkok_Wolf", "Retro_Fan", "NoobMaster", "Stream_Sniper", "Cozy_Bear"
];

const generateViewers = (count) => {
  const archetypes = [
    { type: "Fan", prompts: "supportive, uses emojis, loves the streamer" },
    { type: "Troll", prompts: "sarcastic, rude, uses 'L', 'KEKW'" },
    { type: "Newbie", prompts: "confused, asks dumb questions" },
    { type: "Hype", prompts: "SHOUTING, EXCITED, LOTS OF EXCLAMATION MARKS" }
  ];
  
  const colors = ["text-red-400", "text-blue-400", "text-green-400", "text-purple-400", "text-yellow-400", "text-pink-400"];

  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    name: getRandom(NAMES) + Math.floor(Math.random() * 100),
    color: getRandom(colors),
    persona: getRandom(archetypes)
  }));
};

const StreamSimulator = () => {
  const [isLive, setIsLive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chat, setChat] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputLang, setInputLang] = useState('en'); 

  // Refs
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const viewersRef = useRef([]); 

  useEffect(() => {
    viewersRef.current = generateViewers(6);
  }, []);

  // --- HANDLE INPUT LANGUAGE CHANGE ---
  useEffect(() => {
    if (recognitionRef.current) {
        recognitionRef.current.lang = INPUT_LANGUAGES[inputLang].code;
        // Restart mic if live to apply changes
        if (isLive) {
            recognitionRef.current.stop();
            setTimeout(() => recognitionRef.current.start(), 200);
        }
    }
  }, [inputLang]);

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

      recognitionRef.current.onerror = (event) => console.error("Mic Error:", event);
    }
  }, []); 

  const toggleStream = () => {
    if (isLive) {
      recognitionRef.current.stop();
      setIsLive(false);
    } else {
      recognitionRef.current.start();
      setIsLive(true);
      setChat([]); // Optional: Clear chat on start
      addSystemMessage("🔴 STREAM STARTED");
    }
  };

  // --- SIMPLIFIED BRAIN ---
  const processSpeechToAI = async (text) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const currentViewers = viewersRef.current;
    
    try {
      const activeViewers = currentViewers.sort(() => 0.5 - Math.random()).slice(0, 3);

      // Simple prompt: Just react to what was said.
      const systemPrompt = `
        You are a Twitch Chat Simulator.
        The user is a streamer. 
        You are roleplaying as the viewers.
        React naturally to what the streamer says.
      `;

      const userPrompt = `
        Streamer said: "${text}"
        
        Generate 3 responses from these personas:
        ${JSON.stringify(activeViewers.map(v => ({ name: v.name, persona: v.persona.prompts })))}
        
        RETURN JSON ARRAY ONLY:
        [
          { "user": "name", "text": "message" },
          { "user": "name", "text": "message" }
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
      
      if (!jsonMatch) throw new Error("Invalid JSON from AI");
      
      const parsed = JSON.parse(jsonMatch[0]);
      const messages = Array.isArray(parsed) ? parsed : (parsed.messages || parsed.chat || []);

      messages.forEach((msg, i) => {
        setTimeout(() => {
          const viewer = currentViewers.find(v => v.name === msg.user) || currentViewers[0];
          setChat(prev => [...prev, { ...msg, color: viewer.color }]);
          scrollToBottom();
        }, i * 800);
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
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* HEADER */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700 gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <h1 className="text-xl font-bold tracking-wider">VIBE STREAM v0.6</h1>
        </div>

        {/* INPUT LANGUAGE SELECTOR */}
        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
            <Mic size={16} className="text-purple-400" />
            <span className="text-xs text-gray-500 uppercase mr-1">Voice:</span>
            <select 
                value={inputLang}
                onChange={(e) => setInputLang(e.target.value)}
                className="bg-gray-800 text-sm border-none rounded text-gray-200 p-1 cursor-pointer outline-none hover:bg-gray-700 transition"
            >
                {Object.keys(INPUT_LANGUAGES).map(key => (
                    <option key={key} value={key}>{INPUT_LANGUAGES[key].flag} {INPUT_LANGUAGES[key].label}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* CAMERA */}
        <div className="md:col-span-2 bg-black rounded-xl border border-gray-800 relative flex flex-col items-center justify-center overflow-hidden">
          {!isLive ? (
            <div className="text-center text-gray-500">
              <p className="mb-4">Stream is offline</p>
              <button onClick={toggleStream} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto transition-transform active:scale-95">
                <Mic size={20} /> GO LIVE
              </button>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 opacity-50"></div>
              <div className="z-10 text-center space-y-4 w-3/4">
                <div className="animate-pulse text-red-500 font-mono text-xs absolute top-4 right-4">● REC</div>
                <div className="bg-gray-900/80 p-4 rounded-lg backdrop-blur-sm border border-gray-700 min-h-[100px] flex items-center justify-center">
                    <p className="text-lg italic text-gray-300">
                        {transcript || <span className="text-gray-600">Listening...</span>}
                    </p>
                </div>
                <button onClick={toggleStream} className="bg-red-600/80 hover:bg-red-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 mx-auto">
                  <MicOff size={16} /> END STREAM
                </button>
              </div>
            </>
          )}
        </div>

        {/* CHAT */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-full shadow-2xl overflow-hidden">
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
                            <>
                                <span className={`font-bold ${msg.color} cursor-pointer hover:underline`}>{msg.user}: </span>
                                <span className="text-gray-200">{msg.text}</span>
                            </>
                        )}
                    </div>
                ))}
            </div>
            <div className="p-3 bg-gray-800 border-t border-gray-700">
                <input disabled placeholder="Chat is read-only" className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-500 cursor-not-allowed"/>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StreamSimulator;