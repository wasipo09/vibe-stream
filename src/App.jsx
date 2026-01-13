import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare, Gamepad2, Volume2, VolumeX, DollarSign, Clock, Trash2, Users, Settings, X, Database, Zap, Trophy, Brain } from 'lucide-react';
import OpenAI from 'openai';
import { db, createNewViewer } from './db'; 

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

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

// --- COMPONENT: VIEWER SOUL CARD ---
const ViewerProfileCard = ({ viewer, position }) => {
    if (!viewer) return null;
    const currentLevelProgress = viewer.xp % 100;
    return (
        <div className="fixed z-50 bg-gray-900/95 backdrop-blur-md border border-purple-500/30 p-4 rounded-xl shadow-2xl w-64 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-200" style={{ top: position.y + 10, left: position.x + 10 }}>
            <div className="flex items-center gap-3 mb-3 border-b border-gray-700 pb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 border border-gray-600 font-bold ${viewer.color}`}>
                    {viewer.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${viewer.color}`}>{viewer.name}</h3>
                    <div className="text-xs text-gray-400 flex items-center gap-1"><span className="bg-gray-800 px-1 rounded border border-gray-600">{viewer.type}</span></div>
                </div>
            </div>
            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1 text-gray-300"><span className="font-bold">Level {viewer.level}</span><span>{currentLevelProgress} / 100 XP</span></div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden"><div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500" style={{ width: `${currentLevelProgress}%` }}></div></div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-300 border border-gray-700">
                    <div className="flex items-center gap-1 text-purple-300 font-bold mb-1"><Zap size={10} /> SOUL / VIBE</div>
                    <p className="italic opacity-80 leading-relaxed">"{viewer.persona.prompts}"</p>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: STREAM SUMMARY MODAL ---
const StreamSummary = ({ stats, newMemory, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>
                <h2 className="text-3xl font-bold text-white mb-1">STREAM OFFLINE</h2>
                
                {/* NEW MEMORY SECTION */}
                {newMemory && (
                    <div className="my-6 bg-purple-900/30 border border-purple-500/50 p-4 rounded-xl animate-bounce-in">
                        <div className="flex items-center justify-center gap-2 text-purple-300 font-bold text-sm mb-2">
                            <Brain size={16} /> NEW CORE MEMORY UNLOCKED
                        </div>
                        <p className="text-white italic text-lg">"{newMemory}"</p>
                        <div className="text-gray-500 text-xs mt-2">Chat will remember this forever.</div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <div className="text-green-400 text-xs uppercase font-bold mb-1">Earnings</div>
                        <div className="text-2xl font-mono text-green-400">${stats.money.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <div className="text-blue-400 text-xs uppercase font-bold mb-1">Messages</div>
                        <div className="text-2xl font-mono text-blue-400">{stats.msgCount}</div>
                    </div>
                </div>
                <button onClick={onClose} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition">CLOSE SUMMARY</button>
            </div>
        </div>
    );
};

const StreamSimulator = () => {
  const [isLive, setIsLive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [chat, setChat] = useState([]);
  const [inputLang, setInputLang] = useState('en');
  const [gameContext, setGameContext] = useState("Just Chatting");
  const [enableTTS, setEnableTTS] = useState(false);
  const [latestDonation, setLatestDonation] = useState(null);
  const [uptime, setUptime] = useState(0);
  const [viewerCount, setViewerCount] = useState(1240);
  const [showSettings, setShowSettings] = useState(false);
  
  // Stats & Lore
  const [showSummary, setShowSummary] = useState(false);
  const [sessionStats, setSessionStats] = useState({ duration: 0, money: 0, msgCount: 0, mvp: null });
  const [sessionMemory, setSessionMemory] = useState(null);
  
  // Memory Banks
  const sessionTranscriptRef = useRef([]); // Stores what you said THIS session
  const activeLoreRef = useRef([]); // Stores loaded memories from DB

  const [viewers, setViewers] = useState([]); 
  const viewersRef = useRef([]); 
  const [dbStatus, setDbStatus] = useState("loading");
  const [hoveredViewer, setHoveredViewer] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [settings, setSettings] = useState({
      toxicity: 20,       
      chatSpeed: 1000,    
      baseDonation: 1, 
      creativity: 0.8     
  });

  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const lastActivityRef = useRef(Date.now()); 
  const isProcessingRef = useRef(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const initDB = async () => {
        try {
            const count = await db.viewers.count();
            if (count === 0) {
                const newViewers = Array.from({ length: 6 }).map(() => createNewViewer(settings.toxicity));
                await db.viewers.bulkAdd(newViewers);
            }
            const loadedViewers = await db.viewers.toArray();
            setViewers(loadedViewers);
            viewersRef.current = loadedViewers; 
            
            // LOAD LORE (Randomly pick 2 memories to keep context fresh but not heavy)
            const loreCount = await db.lore.count();
            if (loreCount > 0) {
                const allLore = await db.lore.toArray();
                const randomLore = allLore.sort(() => 0.5 - Math.random()).slice(0, 2);
                activeLoreRef.current = randomLore.map(l => l.text);
                console.log("Loaded Memories:", activeLoreRef.current);
            }

            setDbStatus("ready");
        } catch (error) {
            console.error("DB Error:", error);
            setDbStatus("error");
        }
    };
    initDB();
  }, []);

  const awardXP = async (viewerName) => {
      const viewer = viewersRef.current.find(v => v.name === viewerName);
      if (!viewer) return;
      const newXP = viewer.xp + 10;
      const newLevel = Math.floor(newXP / 100) + 1; 
      const updatedViewer = { ...viewer, xp: newXP, level: newLevel };
      viewersRef.current = viewersRef.current.map(v => v.name === viewerName ? updatedViewer : v);
      setViewers(prev => prev.map(v => v.name === viewerName ? updatedViewer : v));
      await db.viewers.update(viewer.id, { xp: newXP, level: newLevel });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

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
        if (!isLive || isProcessingRef.current) return;
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity > 15000) {
            if (Math.random() > 0.4) return; 
            triggerDeadAirChat();
            lastActivityRef.current = Date.now(); 
        }
    }, 5000); 
    return () => clearInterval(heartbeat);
  }, [isLive, gameContext]); 

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

  const generateStreamMemory = async () => {
    if (sessionTranscriptRef.current.length === 0) return null;
    
    try {
        // Pick random 10 lines to save cost/tokens
        const snippet = sessionTranscriptRef.current.slice(-15).join(" ");
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "Analyze this streamer transcript. Extract ONE funny or weird fact about them (e.g. 'Streamer hates spiders'). Return strictly JSON: { fact: '...' }" },
                { role: "user", content: snippet }
            ],
            model: "gpt-4o-mini"
        });
        const res = JSON.parse(completion.choices[0].message.content);
        if (res.fact) {
            await db.lore.add({ text: res.fact, date: new Date().toISOString() });
            return res.fact;
        }
    } catch (e) { console.error("Memory Gen Error", e); }
    return null;
  };

  const toggleStream = async () => {
    if (isLive) {
      // STOPPING STREAM
      recognitionRef.current.stop();
      setIsLive(false);
      
      addSystemMessage("Saving Memories... Please wait.");
      const memory = await generateStreamMemory();
      setSessionMemory(memory);
      
      setShowSummary(true);

    } else {
      // STARTING STREAM
      recognitionRef.current.start();
      setIsLive(true);
      lastActivityRef.current = Date.now(); 
      setChat([]); 
      
      // Load Lore for this session
      const loreMsg = activeLoreRef.current.length > 0 ? `(Loaded ${activeLoreRef.current.length} Memories)` : "";
      addSystemMessage(`🔴 STREAM STARTED ${loreMsg}`);
      
      sessionTranscriptRef.current = [];
      setSessionStats({ duration: 0, money: 0, msgCount: 0, mvp: null });
    }
  };

  const rollForDonation = (userSpeech) => {
    let chance = settings.baseDonation / 100;
    const lowerSpeech = userSpeech.toLowerCase();
    const engagementTriggers = ["yes", "no", "because", "i think", "thank you", "actually", "well"];
    if (engagementTriggers.some(trigger => lowerSpeech.startsWith(trigger))) {
        chance += 0.20; 
    }
    const roll = Math.random();
    if (roll < chance) {
        const amounts = ["5.00", "10.00", "20.00", "50.00", "4.20", "69.00"];
        return amounts[Math.floor(Math.random() * amounts.length)];
    }
    return null;
  };

  const processSpeechToAI = async (text) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    // SAVE TRANSCRIPT FOR MEMORY
    sessionTranscriptRef.current.push(text);

    try {
      if (viewersRef.current.length === 0) throw new Error("No viewers loaded");
      
      const activeViewers = viewersRef.current.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      // INJECT LORE INTO SYSTEM PROMPT
      const loreContext = activeLoreRef.current.length > 0 
        ? `KNOWN FACTS / LORE: ${JSON.stringify(activeLoreRef.current)}. Refer to these sometimes!`
        : "";

      const systemPrompt = `
        ROLE: Twitch Chat Simulator. 
        USER: Streamer. AI: Audience.
        CONTEXT: Playing "${gameContext}".
        ${loreContext}
        RULES: 
        1. Generate 3 distinct messages.
        2. Speak TO streamer.
        3. If Context/Lore is weird, make fun of it.
      `;
      
      await callOpenAI(systemPrompt, activeViewers, text, true); 

    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      isProcessingRef.current = false;
      setTranscript(""); 
      lastActivityRef.current = Date.now();
    }
  };

  const triggerDeadAirChat = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      if (viewersRef.current.length === 0) return;
      const count = Math.random() > 0.5 ? 1 : 2;
      const activeViewers = viewersRef.current.sort(() => 0.5 - Math.random()).slice(0, count);
      const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
      
      // Dead air can also reference lore
      const loreContext = activeLoreRef.current.length > 0 
        ? `OR gossip about this: ${activeLoreRef.current[0]}`
        : "";

      const systemPrompt = `ROLE: Twitch Chat Sim. SCENARIO: Streamer silent (15s+). TASK: Chat about "${randomTopic}" ${loreContext}. NO DONATIONS.`;
      await callOpenAI(systemPrompt, activeViewers, "Streamer is silent...", false); 
    } catch (error) { console.error(error); } finally { isProcessingRef.current = false; }
  };

  const callOpenAI = async (systemInstruction, currentActiveViewers, userText, allowDonations) => {
    const userPrompt = `Input: "${userText}" Personas: ${JSON.stringify(currentActiveViewers.map(v => ({ name: v.name, persona: v.persona.prompts })))} RETURN JSON ARRAY: [{ "user": "EXACT_NAME", "text": "msg" }]`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }],
      model: "gpt-4o-mini",
      temperature: settings.creativity, 
    });

    const rawContent = completion.choices[0].message.content;
    const jsonMatch = rawContent.match(/\[.*\]/s) || rawContent.match(/\{.*\}/s);
    if (!jsonMatch) return;
    
    let parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) parsed = [parsed];
    
    let donationAmount = null;
    if (allowDonations) {
        donationAmount = rollForDonation(userText);
    }

    parsed.forEach((msg, i) => {
      const randomJitter = Math.floor(Math.random() * 500); 
      const delay = (i * settings.chatSpeed) + randomJitter;

      setTimeout(() => {
        const viewer = viewersRef.current.find(v => v.name === msg.user) || currentActiveViewers[0];
        if (viewer) {
            awardXP(viewer.name);
            setSessionStats(prev => ({ ...prev, msgCount: prev.msgCount + 1 }));
            if (donationAmount && i === 0) {
                msg.donation = "$" + donationAmount; 
                setSessionStats(prev => ({ ...prev, money: prev.money + parseFloat(donationAmount) }));
                playDonationSound();
                setLatestDonation({ user: msg.user, amount: msg.donation, text: msg.text });
            }
            setChat(prev => [...prev, { ...msg, color: viewer.color || "text-gray-400", level: viewer.level || 1, originalViewer: viewer }]);
        }
      }, delay); 
    });
  };

  const addSystemMessage = (text) => {
    setChat(prev => [...prev, { user: "SYSTEM", text, color: "text-gray-500", isSystem: true }]);
  };

  const resetWorld = async () => {
    if(confirm("Are you sure? This will delete all viewer memories and levels.")) {
        await db.viewers.clear();
        await db.lore.clear(); // Clear lore too
        window.location.reload();
    }
  };

  const handleMouseEnter = (viewer, e) => {
      setHoveredViewer(viewer);
      setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* OVERLAYS */}
      {hoveredViewer && <ViewerProfileCard viewer={hoveredViewer} position={mousePos} />}
      {showSummary && <StreamSummary stats={sessionStats} newMemory={sessionMemory} onClose={() => setShowSummary(false)} />}

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
                    <div className="flex items-center gap-2">
                        {isLive ? (
                            <div className="flex items-end gap-1 h-3">
                                <div className="w-1 bg-green-400 rounded-full animate-[bounce_0.8s_infinite] h-full"></div>
                                <div className="w-1 bg-green-400 rounded-full animate-[bounce_1.2s_infinite] h-2/3"></div>
                                <div className="w-1 bg-green-400 rounded-full animate-[bounce_1.0s_infinite] h-full"></div>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-400 font-mono">OFFLINE</span>
                        )}
                        {isLive && <span className="text-xs text-green-400 font-mono">{formatTime(uptime)}</span>}
                        {dbStatus === "ready" && <span className="text-xs bg-green-900 text-green-300 px-1 rounded border border-green-700">DB SAVED</span>}
                        {/* SHOW LOADED MEMORIES BADGE */}
                        {activeLoreRef.current.length > 0 && <span className="text-xs bg-purple-900 text-purple-300 px-1 rounded border border-purple-700 flex items-center gap-1"><Brain size={8}/> {activeLoreRef.current.length} MEMORIES</span>}
                    </div>
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
            </div>
        </div>

        {/* SETTINGS */}
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
                        <input type="range" min="0" max="100" value={settings.toxicity} onChange={(e) => setSettings({...settings, toxicity: parseInt(e.target.value)})} className="w-full accent-red-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                         <button onClick={resetWorld} className="mt-4 w-full flex items-center justify-center gap-2 bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-200 py-2 rounded-lg text-xs font-bold transition">
                            <Database size={14} /> RESET WORLD
                         </button>
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
        {/* CAMERA */}
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
                     <span className="text-gray-500 text-xs font-mono flex items-center gap-1"><Clock size={10}/> AUTO-CHAT</span>
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

        {/* CHAT */}
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
                                <span className="text-[10px] bg-gray-700 text-gray-300 px-1 rounded mr-2 font-mono">
                                    Lvl {msg.level || 1}
                                </span>
                                <span 
                                    className={`font-bold ${msg.color} cursor-pointer hover:underline relative`}
                                    onMouseEnter={(e) => handleMouseEnter(msg.originalViewer, e)}
                                    onMouseLeave={() => setHoveredViewer(null)}
                                >
                                    {msg.user}
                                </span>
                                {msg.donation && <span className="ml-2 text-xs bg-green-600 text-white px-1 rounded">{msg.donation}</span>}
                                <span className="text-gray-400 mx-1">:</span>
                                <span className={msg.donation ? "text-green-200 font-bold" : "text-gray-200"}>{msg.text}</span>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={chatEndRef} />
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