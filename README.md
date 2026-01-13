# 🎙️ Vibe Stream: The AI Chat Simulator

**Vibe Stream** is a React-based "Stream Simulator" that generates a fake, hyper-realistic live audience. Using the OpenAI API and browser-native Speech Recognition, the chat listens to your voice, reacts to your gameplay context, and even starts drama when you go silent.

![Version](https://img.shields.io/badge/version-2.1-purple)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Vite%20%7C%20DexieDB%20%7C%20GPT--4o--mini-blue)

## ✨ Key Features

* **🧠 Persistence (New!):** Viewers now have a "Soul". They live in your browser's local database. If you close the tab and come back tomorrow, the *same* viewers (Mochi_San, Slayer, etc.) will be there to welcome you back.
* **📈 RPG Leveling:** Viewers gain **XP** for every message they send. Watch them grow from Level 1 Noobs to Level 50 Veterans.
* **🃏 Soul Cards:** **Hover** over any username in chat to see their stats, level progress, and their hidden personality prompt (e.g., "Secretly loves anime").
* **🗣️ Real-Time Interaction:** Speak into your mic, and AI personas react instantly using **GPT-4o-mini**.
* **🎛️ God Mode (Settings):** Tune the simulation in real-time:
    * **Toxicity:** 0% (Cozy) to 100% (Roast Session).
    * **Speed:** Chat delay control.
    * **Reset World:** A "Nuke" button to wipe the database and generate a fresh audience.
* **🤫 Dead Air Engine:** If you stay silent for >15 seconds, the chat awkwardly goes silent or starts side conversations.
* **💰 Smart Donations:** Answering questions increases engagement, triggering donation rolls (pure math probability, not AI hallucinations).

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

2.  **Install Dependencies** (Includes Database)
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
2.  **The "Soul" Check:** You will see `DB CONNECTED` at the top. This means your viewers are being loaded from the hard drive, not generated randomly.
3.  **Level Up:** Talk to your chat. As they respond, notice their Level (Lvl 1) badge. Keep streaming to level them up.
4.  **Check Stats:** Hover your mouse over a name to see their "Soul Card".
5.  **Reset:** Want a new audience? Click the **Gear Icon ⚙️** -> **RESET WORLD**. This wipes the save file and refreshes the page.

---

## 📜 Changelog

### v2.1 (Current) - The "Soul" Update
* **Persistence:** Integrated `Dexie.js` (IndexedDB) to save viewers permanently.
* **RPG Mechanics:** Added XP and Leveling system.
* **UI:** Added "Soul Cards" (Hover popups) showing viewer stats and hidden personas.
* **Admin:** Added "Reset World" button to settings.

### v1.3 - The Intelligence Update
* **Engine:** Upgraded to **GPT-4o-mini**.
* **Realism:** Improved Dead Air randomization and fixed scroll glitches.

### v1.0 - The God Mode Update
* **Settings:** Toxicity, Speed, and Donation sliders.

---

*Built with ❤️ by wasipo09*