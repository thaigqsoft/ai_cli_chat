# 🤖 AI CLI Chat

---

## 🇹🇭 ภาษาไทย

### 📝 คำอธิบาย
AI CLI Chat คืออินเทอร์เฟซบรรทัดคำสั่ง (CLI) สำหรับพูดคุยกับ AI อย่างเป็นธรรมชาติ พร้อมความสามารถในการรันคำสั่งบนระบบด้วยการยืนยันจากผู้ใช้ เหมาะสำหรับนักพัฒนา หรือใครก็ตามที่อยากมีผู้ช่วยอัจฉริยะในเทอร์มินัล

---

### 🎬 ตัวอย่างการใช้งาน
[📺 คลิกเพื่อชมวิดีโอสาธิต](https://youtu.be/GHUQ3Oyn-rM)

[![AI CLI Chat Demo](https://img.youtube.com/vi/GHUQ3Oyn-rM/maxresdefault.jpg)](https://youtu.be/GHUQ3Oyn-rM)

---

### ✨ คุณสมบัติเด่น

- 🔁 วนรับ-ส่งข้อความกับ AI อย่างต่อเนื่อง
- 🤝 เชื่อมต่อ AI ผ่าน HTTP API (เช่น n8n workflow)
- 💻 รันคำสั่ง shell ได้ พร้อมระบบขออนุญาต
- 🗣️ ยืนยันด้วยภาษาธรรมชาติ เช่น "โอเค", "ได้เลย"
- ⚡ ใช้ `async/await` จัดการ I/O แบบไม่บล็อก
- 🆔 รองรับ session ID แบบสุ่มหรือกำหนดเอง
- 🌈 แสดงสถานะด้วย loading spinner (`ora`)
- ⌨️ รองรับคำสั่ง `/help`, `/clear`, `/exit`, ฯลฯ
- 🐞 เปิดโหมดดีบั๊กเพื่อดู log แบบละเอียด

---

### ⚙️ หลักการทำงาน

1. โหลดค่าจาก `.env` และสร้าง session ID
2. เริ่มลูปรับ input จากผู้ใช้
3. ส่งข้อความไปยัง AI พร้อม session ID
4. แยกผลลัพธ์:
   - ถ้ามี `[CMD]...[/CMD]`: ขออนุญาตก่อนรัน
   - ถ้าเป็นข้อความ: แสดงผลทันที
5. ใช้ `try...catch` จัดการข้อผิดพลาด

---

### 🚀 การติดตั้งและเริ่มต้นใช้งาน

```bash
git clone <your-repository-url>
cd <repository-directory>
npm install
chmod +x chatloop.js
./chatloop.js
```


# 🤖 AI CLI Chat

A command-line interface (CLI) for natural conversation with an AI, with the ability to execute system commands upon user confirmation.  
Ideal for developers or anyone looking for a smart and interactive terminal assistant. 💡

---

## 🎬 Demo

[📺 Click to watch the demo video](https://youtu.be/GHUQ3Oyn-rM)

[![AI CLI Chat Demo](https://img.youtube.com/vi/GHUQ3Oyn-rM/maxresdefault.jpg)](https://youtu.be/GHUQ3Oyn-rM)

---

## ✨ Features

- 🔁 **Interactive Chat Loop**  
  Continuous message exchange between user and AI

- 🤝 **AI Integration**  
  Connects to AI via HTTP API (e.g., n8n workflow)

- 💻 **System Command Execution**  
  AI can suggest shell commands (e.g., `ls -la`, `cat file.txt`)  
  and requests user permission before executing

- 🗣️ **Natural Language Confirmation**  
  Accepts replies like "yes", "okay", "sure", "go ahead"

- ⚡ **Asynchronous Operations**  
  Uses `async/await` for non-blocking I/O

- 🆔 **Session Management**  
  Generates random or user-defined session IDs to maintain chat context

- 🌈 **User-Friendly Feedback**  
  Displays a loading spinner (`ora`) during AI processing

- ⌨️ **Slash Commands Support**  
  Supports `/help`, `/clear`, `/exit`, and more

- 🐞 **Debug Mode**  
  Enable detailed logs via environment variable

---

## ⚙️ How It Works

1. **Initialization**  
   - Loads config from `.env`  
   - Creates session ID

2. **Main Loop**  
   - Prompts user input in a continuous loop

3. **AI Request**  
   - Sends the user message and session ID to the AI service

4. **Response Parsing**  
   - If response contains `[CMD]...[/CMD]`, asks for user permission before executing  
   - Otherwise, displays the response as-is

5. **Error Handling**  
   - Uses `try...catch` to handle any errors gracefully

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- Git

### Installation

```bash
git clone <your-repository-url>
cd <repository-directory>
npm install
chmod +x chatloop.js
./chatloop.js
```