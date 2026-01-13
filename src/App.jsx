import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare, Gamepad2, Volume2, VolumeX, DollarSign, Clock, Trash2, Users, Settings, X } from 'lucide-react';
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

const NAMES = ["xX_Slayer", "Mochi_San", "Somchai_99", "Glitch_Boi", "Kawaii_Dev", "Bangkok_Wolf", "Retro_Fan", "NoobMaster", "Stream_Sniper", "Cozy_Bear", "Anon_77", "Kira_Kira"];

const RANDOM_TOPICS = [
    "arguing about pizza toppings",
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

const generateViewers = (count, toxicityLevel) => {
  const trollCount = Math.floor(count * (toxicityLevel / 100));
  const fanCount = count - trollCount;

  const trolls = Array.from({ length: trollCount }).map((_, i) => ({
    id: `troll_${i}`,
    name: NAMES[Math.floor(Math.random() * NAMES.length)] + "_Troll",
    color: "text-red-500",
    persona: { type: "Troll", prompts: "Toxic, sarcastic, rude, makes fun of gameplay, uses 'L', 'KEKW'" }
  }));

  const fans = Array.from({ length: fanCount }).map((_, i) => ({
    id: `fan_${i}`,
    name: NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random() * 100),
    color: ["text-blue-400", "text-green-400", "text-purple-400", "text-yellow-400"][Math.floor(Math.random() * 4)],
    persona: { type: "Fan", prompts: "Supportive, uses emojis, calls streamer 'you', asks questions." }
  }));

  return [...trolls, ...fans].sort(() => 0.5 - Math.random());
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
  const [showSettings, setShowSettings] = useState(false);

  // --- GOD MODE SETTINGS ---
  const [settings, setSettings] = useState({
      toxicity: 20,       
      chatSpeed: 1000,    
      baseDonation: 1, // Now strictly 1% chance
      creativity: 0.8     
  });

  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const viewersRef = useRef([]); 
  const lastActivityRef = useRef(Date.now()); 

  useEffect(() => {
    viewersRef.current = generateViewers(6, settings.toxicity);
  }, [settings.toxicity]);

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
      addSystemMessage(`🔴 STREAM STARTED (Toxicity: ${settings.toxicity}%)`);
    }
  };

  // --- 🎲 NEW MATH-BASED DONATION SYSTEM ---
  const rollForDonation = (userSpeech) => {
    // 1. Get Base Chance from Settings Slider (e.g. 1% -> 0.01)
    let chance = settings.baseDonation / 100;
    
    // 2. Engagement Bonus
    const lowerSpeech = userSpeech.toLowerCase();
    const engagementTriggers = ["yes", "no", "because", "i think", "thank you", "actually", "well"];
    if (engagementTriggers.some(trigger => lowerSpeech.startsWith(trigger))) {
        chance += 0.20; // Add 20% bonus if engaging
    }
    
    // 3. Roll the Dice
    const roll = Math.random();
    console.log(`Donation Roll: ${roll.toFixed(2)} vs Chance: ${chance.toFixed(2)}`);
    
    if (roll < chance) {
        // Return random amount
        const amounts = ["$5.00", "$10.00", "$20.00", "$50.00", "$4.20", "$69.00"];
        return amounts[Math.floor(Math.random() * amounts.length)];
    }
    return null;
  };

  const processSpeechToAI = async (text) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const activeViewers = viewersRef.current.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      // We do NOT tell AI about donation chance anymore. We just ask for text.
      const systemPrompt = `
        ROLE: Twitch Chat Simulator.
        USER: Streamer. AI: Audience.
        CONTEXT: Playing "${gameContext}".
        
        RULES: 
        1. Generate 3 distinct messages.
        2. Use the EXACT usernames provided.
        3. Speak TO the streamer.
        4. Keep it short and slangy.
      `;
      
      await callOpenAI(systemPrompt, activeViewers, text, true); // true = allow donations check

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
        ROLE: Twitch Chat Sim.
        SCENARIO: Streamer is silent (15s+).
        TASK: Chat with each other about "${randomTopic}".
        NO DONATIONS.
      `;
      await callOpenAI(systemPrompt, activeViewers, "Streamer is silent...", false); // false = no donations
    } catch (error) { console.error(error); } finally { setIsProcessing(false); }
  };

  const callOpenAI = async (systemInstruction, viewers, userText, allowDonations) => {
    const userPrompt = `
      Input: "${userText}"
      Personas: ${JSON.stringify(viewers.map(v => ({ name: v.name, persona: v.persona.prompts })))}
      RETURN JSON ARRAY: [{ "user": "EXACT_NAME", "text": "msg" }]
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }],
      model: "gpt-3.5-turbo",
      temperature: settings.creativity, 
    });

    const rawContent = completion.choices[0].message.content;
    const jsonMatch = rawContent.match(/\[.*\]/s) || rawContent.match(/\{.*\}/s);
    if (!jsonMatch) return;
    
    let parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) parsed = [parsed];
    
    // --- 🎲 INJECT DONATION HERE ---
    // If allowed, roll ONE dice for the whole batch
    let donationAmount = null;
    if (allowDonations) {
        donationAmount = rollForDonation(userText);
    }

    parsed.forEach((msg, i) => {
      setTimeout(() => {
        const viewer = viewersRef.current.find(v => v.name === msg.user) 
                    || viewersRef.current.find(v => msg.user.includes(v.name))
                    || viewersRef.current[i % viewersRef.current.length];

        // If dice rolled a donation, give it to the FIRST message in the batch
        let isDonation = false;
        if (donationAmount && i === 0) {
            isDonation = true;
            msg.donation = donationAmount; // Attach to object
            playDonationSound();
            setLatestDonation({ user: msg.user, amount: donationAmount, text: msg.text });
        }

        setChat(prev => [...prev, { ...msg, color: viewer ? viewer.color : "text-gray-400" }]);
        scrollToBottom();
      }, i * settings.chatSpeed); 
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

            <div className="flex items-center gap-4">
                <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-white transition">
                   <Settings size={20} className={showSettings ? "animate-spin-slow" : ""} />
                </button>
                <div className="h-6 w-px bg-gray-600"></div>
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

        {/* SETTINGS PANEL */}
        {showSettings && (
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wider">Simulation Parameters</h3>
                    <button onClick={() => setShowSettings(false)}><X size={16} className="text-gray-500 hover:text-white"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-red-400">Toxicity (Trolls)</span>
                            <span>{settings.toxicity}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" 
                            value={settings.toxicity} 
                            onChange={(e) => setSettings({...settings, toxicity: parseInt(e.target.value)})}
                            className="w-full accent-red-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-blue-400">Chat Delay</span>
                            <span>{settings.chatSpeed}ms</span>
                        </div>
                        <input 
                            type="range" min="200" max="3000" step="100"
                            value={settings.chatSpeed} 
                            onChange={(e) => setSettings({...settings, chatSpeed: parseInt(e.target.value)})}
                            className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-green-400">Base Donation Chance</span>
                            <span>{settings.baseDonation}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="50" 
                            value={settings.baseDonation} 
                            onChange={(e) => setSettings({...settings, baseDonation: parseInt(e.target.value)})}
                            className="w-full accent-green-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-purple-400">AI Creativity</span>
                            <span>{settings.creativity}</span>
                        </div>
                        <input 
                            type="range" min="0.1" max="1.5" step="0.1"
                            value={settings.creativity} 
                            onChange={(e) => setSettings({...settings, creativity: parseFloat(e.target.value)})}
                            className="w-full accent-purple-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        )}

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