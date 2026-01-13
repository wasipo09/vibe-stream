import Dexie from 'dexie';

export const db = new Dexie('VibeStreamDB');

// Define the Schema (Like an Excel sheet structure)
db.version(1).stores({
  viewers: '++id, name, level, xp, type' // id is auto-incremented
});

// --- HELPER: Random Generator (Moved here) ---
const NAMES = ["xX_Slayer", "Mochi_San", "Somchai_99", "Glitch_Boi", "Kawaii_Dev", "Bangkok_Wolf", "Retro_Fan", "NoobMaster", "Stream_Sniper", "Cozy_Bear", "Anon_77", "Kira_Kira"];

export const createNewViewer = (toxicityLevel) => {
    // Determine type based on toxicity setting
    // Random roll (0-100). If roll < toxicity, make them a Troll.
    const isTroll = (Math.random() * 100) < toxicityLevel;
    
    const basePersona = isTroll 
        ? { type: "Troll", prompts: "Toxic, sarcastic, rude, makes fun of gameplay, uses 'L', 'KEKW'" }
        : { type: "Fan", prompts: "Supportive, uses emojis, calls streamer 'you', asks questions." };

    const colorList = isTroll 
        ? ["text-red-500", "text-orange-500"] 
        : ["text-blue-400", "text-green-400", "text-purple-400", "text-yellow-400"];

    return {
        name: NAMES[Math.floor(Math.random() * NAMES.length)] + Math.floor(Math.random() * 999),
        type: isTroll ? "Troll" : "Fan",
        persona: basePersona,
        color: colorList[Math.floor(Math.random() * colorList.length)],
        level: 1,
        xp: 0,
        joined: new Date().toISOString()
    };
};