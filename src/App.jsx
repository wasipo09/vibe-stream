import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageSquare, AlertCircle, Gamepad2, Volume2, VolumeX, DollarSign, Clock, Sparkles, Trash2, Users } from 'lucide-react';
import OpenAI from 'openai';

// 🔒 SECURE KEY LOADING
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

const INPUT_LANGUAGES = {
  en: { label: "English", code: "en-US", flag: "🇺🇸" },
  ja: { label: "Japanese", code: "ja-JP", flag: "🇯🇵" },
  th: { label: "Thai", code: "th-TH", flag: "🇹🇭" }
};

const NAMES = ["xX_Slayer", "Mochi_San", "Somchai_99", "Glitch_Boi", "Kawaii_Dev", "Bangkok_Wolf", "Retro_Fan", "NoobMaster", "Stream_Sniper", "Cozy_Bear"];

const RANDOM_TOPICS = [
    "arguing about pizza toppings",
    "asking if anyone saw the latest anime episode",
    "complaining about school/work",
    "talking about another famous streamer",
    "discussing the game meta",
    "planning a meetup",
    "typing random copypasta"
];

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
    } catch (e) { console.error(e); }
};

const generateViewers = (count) => {
  const archetypes = [
    { type: "Fan", prompts: "Very supportive. Refers to the streamer as 'you' or 'streamer'. Uses emojis." },
    { type: "Troll", prompts: "Critical, sarcastic. Makes fun of the streamer's gameplay." },
    { type: "Newbie", prompts: "Confused. Asks questions ABOUT the game or the stream." },
    { type: "Hype", prompts: "Excited. Reacts to big moments. Uses caps." }
  ];
  const colors = ["text-red-400", "text-blue-400", "text-green-400", "text-purple-400", "text-yellow-400", "text-pink-400"];

  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    name: NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random() * 100),
    color: colors[Math.floor(Math.random() * colors.length)],
    persona: archetypes[Math.floor(Math.random() * archetypes.length)]
  }));
};

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const StreamSimulator = () => {
  const [isLive, setIsLive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chat, setChat] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputLang, setInputLang] = useState('en');
  const [gameContext, setGameContext] = useState("Just Chatting");
  const [enableTTS, setEnableTTS] = useState(false);
  const [latestDonation, setLatestDonation] = useState(null);
  const [uptime, setUptime] = useState(0);
  const [viewerCount, setViewerCount] = useState(1240);

  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const viewersRef = useRef([]); 
  const lastActivityRef = useRef(Date.now()); 

  useEffect(() => {
    viewersRef.current = generateViewers(6);
  }, []);

  useEffect(() => {
    let interval;
    if (isLive) {
        interval = setInterval(() => {
            setUptime(prev => prev + 1);
            setViewerCount(prev => Math.max(0, prev + (Math.floor(Math.random() * 11) - 5)));
        }, 1000);
    } else {
        setUptime(0);
        setViewerCount(1240); 
    }
    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    const heartbeat = setInterval(() => {
        if (!isLive || isProcessing) return;
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity > 15000) {
            triggerDeadAirChat();
            lastActivityRef.current = Date.now(); 
        }
    }, 5000); 
    return () => clearInterval(heartbeat);
  }, [isLive, isProcessing, gameContext]); 

  useEffect(() => {
    if (chat.length > 0 && enableTTS) {
        const lastMsg = chat[chat.length - 1];
        if (!lastMsg.isSystem && !lastMsg.spoken) {
            const utterance = new SpeechSynthesisUtterance(`${lastMsg.user} says ${lastMsg.text}`);
            utterance.rate = 1.1;
            utterance.volume = 0.5;
            window.speechSynthesis.speak(utterance);
            lastMsg.spoken = true;
        }
    }
  }, [chat, enableTTS]);

  useEffect(() => {
    if (latestDonation) {
        const timer = setTimeout(() => setLatestDonation(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [latestDonation]);

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
        lastActivityRef.current = Date.now(); 

        clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
            if (currentTranscript.trim().length > 1) { 
                processSpeechToAI(currentTranscript); 
            }
        }, 1500);
      };
    }
  }, [inputLang]); 

  const toggleStream = () => {
    if (isLive) {
      recognitionRef.current.stop();
      setIsLive(false);
    } else {
      recognitionRef.current.start();
      setIsLive(true);
      lastActivityRef.current = Date.now(); 
      setChat([]); 
      addSystemMessage("🔴 STREAM STARTED");
    }
  };

  const calculateDonationChance = (userSpeech) => {
    const lowerSpeech = userSpeech.toLowerCase();
    let chance = 0.01; 
    const engagementTriggers = ["yes", "no", "because", "i think", "thank you", "actually", "well"];
    if (engagementTriggers.some(trigger => lowerSpeech.startsWith(trigger))) {
        chance = 0.30; 
    }
    if (userSpeech.length > 50) chance += 0.10;
    return chance;
  };

  // --- STRICTER PROMPTS HERE ---
  const processSpeechToAI = async (text) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const activeViewers = viewersRef.current.sort(() => 0.5 - Math.random()).slice(0, 3);
      const donationProb = calculateDonationChance(text);

      const systemPrompt = `
        ROLE: You are the backend for a Twitch Chat Simulation.
        SCENARIO: The USER input is the STREAMER speaking.
        YOUR JOB: Generate 2-3 viewer chat messages reacting to the streamer.
        
        RULES:
        1. YOU ARE THE AUDIENCE. You are NOT the streamer.
        2. Speak TO the streamer (use "you", "he", "she", or "streamer").
        3. Keep messages short, informal, internet-slang style.
        4. Context: Streamer is playing "${gameContext}".
        
        DONATIONS:
        - Chance: ${donationProb} (0-1).
        - If donating, add "donation": "$20" to object.
      `;
      
      await callOpenAI(systemPrompt, activeViewers, text);

    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsProcessing(false);
      setTranscript(""); 
      lastActivityRef.current = Date.now();
    }
  };

  const triggerDeadAirChat = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const activeViewers = viewersRef.current.sort(() => 0.5 - Math.random()).slice(0, 2); 
      const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
      
      const systemPrompt = `
        ROLE: Twitch Chat Simulator.
        SCENARIO: The streamer has been silent for 15+ seconds.
        YOUR JOB: Generate viewer chatter.
        
        RULES:
        1. Discuss this topic: "${randomTopic}".
        2. Or ask "Is the streamer AFK?".
        3. Do NOT pretend to be the streamer. Talk TO each other or ABOUT the streamer.
        4. NO DONATIONS.
      `;
      
      await callOpenAI(systemPrompt, activeViewers, "Streamer is silent...");
    } catch (error) { console.error(error); } finally { setIsProcessing(false); }
  };

  const callOpenAI = async (systemInstruction, viewers, userText) => {
    const userPrompt = `
      Streamer Said/Status: "${userText}"
      
      Generate responses for:
      ${JSON.stringify(viewers.map(v => ({ name: v.name, persona: v.persona.prompts })))}
      
      RETURN JSON ARRAY: [{ "user": "name", "text": "message", "donation": "$5" (optional) }]
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }],
      model: "gpt-3.5-turbo",
    });

    const rawContent = completion.choices[0].message.content;
    const jsonMatch = rawContent.match(/\[.*\]/s) || rawContent.match(/\{.*\}/s);
    if (!jsonMatch) return;
    
    const messages = JSON.parse(jsonMatch[0]);
    (Array.isArray(messages) ? messages : []).forEach((msg, i) => {
      setTimeout(() => {
        const viewer = viewersRef.current.find(v => v.name === msg.user) || viewersRef.current[0];
        if (msg.donation) {
            playDonationSound();
            setLatestDonation({ user: msg.user, amount: msg.donation, text: msg.text });
        }
        setChat(prev => [...prev, { ...msg, color: viewer.color }]);
        scrollToBottom();
      }, i * 1200);
    });
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
      
      {latestDonation && (
        <div className="absolute top-20 z-50 animate-bounce-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1 rounded-xl shadow-2xl border-2 border-yellow-300">
                <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-4 min-w-[300px]">
                    <div className="bg-green-500 p-3 rounded-full text-white animate-pulse"><DollarSign size={32} /></div>
                    <div>
                        <div className="text-green-400 font-bold text-xl">{latestDonation.user} donated {latestDonation.amount}!</div>
                        <div className="text-white text-sm italic">"{latestDonation.text}"</div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="w-full max-w-4xl mb-6 space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <div>
                    <h1 className="text-xl font-bold tracking-wider leading-none">VIBE STREAM</h1>
                    <span className="text-xs text-gray-400 font-mono">{isLive ? formatTime(uptime) : "OFFLINE"}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-300">
                    <Users size={18} className="text-blue-400" />
                    <span className="font-mono font-bold text-lg">{viewerCount.toLocaleString()}</span>
                </div>
                <div className="h-6 w-px bg-gray-600"></div>
                <button onClick={() => setEnableTTS(!enableTTS)} className={`p-2 rounded-lg border transition-all ${enableTTS ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
                    {enableTTS ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                </button>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className={`flex items-center gap-2 bg-gray-900 p-2 rounded-lg border ${isLive ? 'border-gray-800 opacity-50' : 'border-gray-700'}`}>
                <Mic size={16} className="text-purple-400" />
                <select 
                    value={inputLang}
                    onChange={(e) => setInputLang(e.target.value)}
                    disabled={isLive} 
                    className="bg-gray-900 text-sm border-none rounded text-gray-200 outline-none cursor-pointer disabled:cursor-not-allowed"
                >
                    {Object.keys(INPUT_LANGUAGES).map(key => (
                        <option key={key} value={key}>{INPUT_LANGUAGES[key].flag} Voice</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
                <Gamepad2 size={16} className="text-blue-400" />
                <input 
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
                    placeholder="What are you playing?"
                    value={gameContext}
                    onChange={(e) => setGameContext(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
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
              <div className="z-10 text-center space-y-4 w-3/4">
                <div className="flex justify-between absolute top-4 left-4 right-4">
                     <span className="text-gray-500 text-xs font-mono flex items-center gap-1"><Clock size={10}/> AUTO-CHAT ACTIVE</span>
                     <div className="animate-pulse text-red-500 font-mono text-xs">● REC</div>
                </div>
                <div className="bg-gray-900/80 p-4 rounded-lg backdrop-blur-sm border border-gray-700 min-h-[100px] flex items-center justify-center">
                    <p className="text-lg italic text-gray-300">
                        {transcript || <span className="text-gray-600 animate-pulse">...</span>}
                    </p>
                </div>
                <button onClick={toggleStream} className="bg-red-600/80 hover:bg-red-500 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 mx-auto">
                  <MicOff size={16} /> END STREAM
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-full shadow-2xl overflow-hidden relative">
            <div className="bg-gray-800 p-3 border-b border-gray-700 font-bold text-sm flex items-center justify-between">
                <span>CHAT</span>
                <div className="flex gap-2">
                    <button onClick={() => setChat([])} className="text-gray-500 hover:text-red-400 transition" title="Clear Chat">
                        <Trash2 size={14}/>
                    </button>
                </div>
            </div>
            <div id="chat-box" className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                {chat.length === 0 && <div className="text-gray-600 text-center text-sm mt-10">Chat is quiet...</div>}
                {chat.map((msg, idx) => (
                    <div key={idx} className={`text-sm break-words animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {msg.isSystem ? (
                            <span className="italic font-mono text-xs text-gray-500">{msg.text}</span>
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
            <div className="p-3 bg-gray-800 border-t border-gray-700">
                <input disabled placeholder="Chat is read-only" className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-500 cursor-not-allowed"/>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StreamSimulator;