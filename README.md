# 🎙️ Vibe Stream: The AI Chat Simulator

**Vibe Stream** is a React-based "Stream Simulator" that generates a fake, hyper-realistic live audience. Using the OpenAI API and browser-native Speech Recognition, the chat listens to your voice, reacts to your gameplay context, and even starts drama when you go silent.

![Version](https://img.shields.io/badge/version-1.3-success)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Vite%20%7C%20GPT--4o--mini-blue)

## ✨ Key Features

* **🗣️ Real-Time Interaction:** Speak into your mic, and 6 distinct AI personas (Trolls, Fans, Newbies) react instantly.
* **🧠 Powered by GPT-4o-mini:** Upgraded from GPT-3.5 for smarter, faster, and more persona-consistent responses.
* **🎛️ God Mode (Settings):** Click the gear icon to tune the simulation in real-time:
    * **Toxicity:** 0% (Cozy) to 100% (Roast Session).
    * **Speed:** 200ms (Hype Train) to 3000ms (Chill).
    * **Creativity:** Adjust how chaotic the AI hallucinations are.
* **🤫 Dead Air Engine (Realism Update):** If you stay silent for >15 seconds, the chat might awkwardly stay silent too, or 1-2 viewers might start a random side conversation. No more robotic spam.
* **💰 Smart Donations:** The app gamifies engagement. If you answer viewers' questions, your chance of receiving a donation spikes. (Donation math is strictly controlled by JavaScript, not AI hallucinations).
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
    * **Don't Freeze:** If you stop talking for 15s, the "Auto-Chat" kicks in.

---

## 📜 Changelog

### v1.3 (Current) - The "Realism" Polish
* **Engine:** Upgraded to **GPT-4o-mini** for better instruction following and speed.
* **Dead Air:** Added randomization. Dead air chat doesn't always trigger, and fewer people talk, making silences feel more natural.
* **UX:** Fixed scroll-to-bottom glitch.
* **Stability:** Added Ref-locking to prevent duplicate API calls when speaking quickly.

### v1.0 - The God Mode Update
* **Settings Panel:** Added UI to control Toxicity, Chat Speed, Donation Chance, and AI Creativity.
* **Strict Logic:** Moved donation probability math to strict JavaScript logic.

### v0.9 - The "Engagement" Update
* **Smart Donations:** Donation probability is dynamic based on user engagement.
* **Chaos Dead Air:** Chat discusses random topics during silence.

---

## 🔮 Roadmap (The "dreality" Project)
* [ ] **Persistence:** Local Database to remember viewers (Level up system).
* [ ] **Vision:** AI sees your screen and reacts to gameplay visuals.
* [ ] **Social Graph:** Viewers form relationships with each other.

---

*Built with ❤️ by wasipo09*