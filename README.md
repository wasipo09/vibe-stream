# 🎙️ Vibe Stream: The AI Chat Simulator

**Vibe Stream** is a React-based "Stream Simulator" that generates a fake, hyper-realistic live audience. Using the OpenAI API and browser-native Speech Recognition, the chat listens to your voice, reacts to your gameplay context, and even starts drama when you go silent.

![Version](https://img.shields.io/badge/version-1.0-success)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Vite%20%7C%20OpenAI-blue)

## ✨ Key Features

* **🗣️ Real-Time Interaction:** Speak into your mic, and 6 distinct AI personas (Trolls, Fans, Newbies) react instantly.
* **🎛️ God Mode (Settings):** Click the gear icon to tune the simulation in real-time:
    * **Toxicity:** 0% (Cozy) to 100% (Roast Session).
    * **Speed:** 200ms (Hype Train) to 3000ms (Chill).
    * **Creativity:** Adjust how chaotic the AI hallucinations are.
* **🤫 Dead Air Engine (Chaos Mode):** If you stay silent for >15 seconds, the chat gets bored and starts talking amongst themselves (about anime, food, or school) to break the silence.
* **💰 Smart Donations:** The app gamifies engagement. If you answer viewers' questions, your chance of receiving a donation spikes. (Donation math is now strictly controlled by the "Base Donation" slider).
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
    git clone [https://github.com/wasipo09/vibe-stream.git](https://github.com/wasipo09/vibe-stream.git)
    cd vibe-stream
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
2.  **Tune the Vibe:** Click the **Gear Icon ⚙️**. Set **Toxicity** to 80% if you want a challenge, or 10% for a comfy stream.
3.  **Go Live:** Click the big purple **GO LIVE** button.
4.  **Engage:**
    * **Speak:** Say "Welcome to the stream!" or respond to chatters.
    * **Earn:** Answering questions triggers a higher engagement bonus, rolling the dice for a donation.
    * **Don't Freeze:** If you stop talking for 15s, the "Auto-Chat" kicks in and viewers might start ignoring you.

---

## 📜 Changelog

### v1.0 (Current) - The God Mode Update
* **Settings Panel:** Added UI to control Toxicity, Chat Speed, Donation Chance, and AI Creativity in real-time.
* **Strict Logic:** Moved donation probability math from AI hallucinations to strict JavaScript logic (fixing the "infinite money" bug).
* **QoL:** Added Uptime Timer, Live Viewer Count fluctuation, and Clear Chat button.
* **Stability:** Fixed parsing errors where single AI responses broke the chat loop.

### v0.9 - The "Engagement" Update
* **Smart Donations:** Donation probability is dynamic based on user engagement.
* **Chaos Dead Air:** When silent, chat discusses random topics (food, school) instead of just asking "Are you AFK?".

### v0.8 - The "Dead Air" Update
* **Heartbeat Engine:** Added a background timer to detect silence.
* **Auto-Chat:** AI automatically generates viewer conversation during silence.

### v0.7 - Context & Sound
* **Game Context:** Added input field to guide AI hallucination.
* **Sound Engine:** Added synthesized "Ding" sound.

---

## 🔮 Roadmap (The "dreality" Project)
* [ ] **Persistence:** Local Database to remember viewers (Level up system).
* [ ] **Vision:** AI sees your screen and reacts to gameplay visuals.
* [ ] **Social Graph:** Viewers form relationships with each other.

---

*Built with ❤️ by wasipo09*