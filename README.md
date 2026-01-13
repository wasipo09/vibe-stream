# 🎙️ Vibe Stream: The AI Chat Simulator

**Vibe Stream** is a React-based "Stream Simulator" that generates a fake, hyper-realistic live audience. Using the OpenAI API and browser-native Speech Recognition, the chat listens to your voice, reacts to your gameplay context, and even starts drama when you go silent.

![Version](https://img.shields.io/badge/version-0.9-blueviolet)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Vite%20%7C%20OpenAI-blue)

## ✨ Key Features

* **🗣️ Real-Time Interaction:** Speak into your mic, and 6 distinct AI personas (Trolls, Fans, Newbies) react instantly.
* **🤫 Dead Air Engine (Chaos Mode):** If you stay silent for >15 seconds, the chat gets bored and starts talking amongst themselves (about anime, food, or school) to break the silence.
* **💰 Smart Donations:** The app gamifies engagement. If you answer viewers' questions or speak in long sentences, you have a 30% chance to earn a "Donation" with a sound effect.
* **🎮 Context Awareness:** Tell the AI what you are playing (e.g., "Elden Ring", "Just Chatting"), and they will comment relevantly.
* **🔊 Text-to-Speech (TTS):** Toggle TTS to hear your chat read their messages out loud.
* **🌍 Multilingual Input:** Supports English 🇺🇸, Japanese 🇯🇵, and Thai 🇹🇭 voice input.

---

## 🚀 Installation Guide

### Prerequisites
1.  **Node.js** (v16 or higher) installed.
2.  An **OpenAI API Key** (You can get one at [platform.openai.com](https://platform.openai.com)).

### Step-by-Step Setup

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/stream-sim.git](https://github.com/YOUR_USERNAME/stream-sim.git)
    cd stream-sim
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key (Important!)**
    Create a file named `.env` in the root directory. Paste your key inside:
    ```env
    VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```
    Open the link shown in the terminal (usually `http://localhost:5173`).

---

## 🎮 How to Play

1.  **Set Context:** In the input box next to the gamepad icon, type what you are doing (e.g., *"Speedrunning Minecraft"*).
2.  **Choose Voice:** Select your spoken language (English, Thai, etc.) from the dropdown.
3.  **Go Live:** Click the big purple **GO LIVE** button.
4.  **Engage:**
    * **Speak:** Say "Welcome to the stream!" or respond to chatters.
    * **Earn:** If you answer a viewer's question (starting with "Yes", "Because", etc.), you trigger a higher donation chance.
    * **Don't Freeze:** If you stop talking for 15s, the "Auto-Chat" kicks in and viewers might start ignoring you.

---

## 📜 Changelog

### v0.9 (Current) - The "Engagement" Update
* **Smart Donations:** Donation probability is now dynamic. 1% base chance → 30% chance if you engage/answer questions.
* **Chaos Dead Air:** When silent, chat now discusses random topics (food, school, other streamers) instead of just asking "Are you AFK?".

### v0.8 - The "Dead Air" Update
* **Heartbeat Engine:** Added a background timer to detect silence.
* **Auto-Chat:** AI automatically generates viewer conversation during silence.
* **Safety Lock:** Input language selector is disabled while live.

### v0.7 - Context & Sound
* **Game Context:** Added input field to guide AI hallucination.
* **Sound Engine:** Added synthesized "Ding" sound for donations (no assets required).
* **TTS:** Added Text-to-Speech toggle.

### v0.1 - v0.6 - The MVP
* Basic Speech-to-Text integration.
* OpenAI Persona generation (Fans, Trolls, Mods).
* Multilingual support.

---

## 🔮 Roadmap (The "SAO" Project)
* [ ] **Persistence:** Local Database to remember viewers (Level up system).
* [ ] **Vision:** AI sees your screen and reacts to gameplay visuals.
* [ ] **Social Graph:** Viewers form relationships with each other.

---

*Built with ❤️ by [Your Name]*