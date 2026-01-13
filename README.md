# 🎙️ Vibe Stream: The AI Chat Simulator

**Vibe Stream** is a React-based "Stream Simulator" that generates a fake, hyper-realistic live audience. Using the OpenAI API and browser-native Speech Recognition, the chat listens to your voice, reacts to your gameplay context, and builds a long-term memory of your history.

![Version](https://img.shields.io/badge/version-2.3-purple)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Vite%20%7C%20DexieDB%20%7C%20GPT--4o--mini-blue)

## ✨ Key Features

* **🧠 The Lore System (New!):** The chat has **Long-Term Memory**. If you admit to liking pineapple on pizza in Stream #1, they will roast you for it in Stream #5.
    * **Auto-Summarization:** When you end a stream, the AI analyzes your transcript and saves a "Core Memory" to the database.
    * **Context Injection:** Future streams load these memories so the chat stays relevant.
* **💾 Persistence:** Viewers live in your browser's local database. Mochi_San will be there tomorrow with the same XP and level.
* **📈 RPG Leveling:** Viewers gain **XP** for chatting. Watch them grow from Level 1 to Level 50.
* **🃏 Soul Cards:** **Hover** over any username to see their stats, level, and hidden persona.
* **🎛️ God Mode:** Tune the simulation (Toxicity, Speed, Reset World) in real-time.
* **📊 Stream Reports:** Get a summary of your earnings, MVP viewer, and new memories unlocked after every session.
* **💰 Smart Donations:** Answering questions triggers donation rolls based on mathematical probability.

---

## 🚀 Installation Guide

### Prerequisites
1.  **Node.js** (v16 or higher).
2.  An **OpenAI API Key** ([platform.openai.com](https://platform.openai.com)).

### Step-by-Step Setup

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/wasipo09/vibe-stream.git](https://github.com/wasipo09/vibe-stream.git)
    cd vibe-stream
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Create a `.env` file in the root:
    ```env
    VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```

---

## 🎮 How to Play

1.  **Go Live:** Click the purple button.
2.  **Create Lore:** Say something controversial or funny (e.g., *"I think I'm the best gamer alive"*).
3.  **End Stream:** Click the Red Button.
4.  **Unlock Memory:** Watch the Summary Modal. A purple box will appear: **"Core Memory Unlocked: Streamer thinks they are a god."**
5.  **Next Session:** Start a new stream. Look for the **[ 1 MEMORIES ]** badge. The chat will now reference that memory.

---

## 📜 Changelog

### v2.3 (Current) - The "Evolution" Update
* **Lore System:** Implemented Global Stream Memory.
* **Auto-Summarization:** AI generates facts from transcripts upon stream end.
* **Context Injection:** Previous memories are fed into the chat context for continuity.
* **Stream Summary:** UI updated to show "New Memories" alongside stats.

### v2.1 - The "Soul" Update
* **Persistence:** Integrated `Dexie.js` to save viewers.
* **RPG Mechanics:** XP and Leveling system.
* **Soul Cards:** Hover UI for viewer stats.

### v1.3 - The Intelligence Update
* **Engine:** Upgraded to **GPT-4o-mini**.
* **Realism:** Improved Dead Air randomization.

---

*Built with ❤️ by wasipo09*