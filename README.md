# AI CLI Chat (n8n Edition)

**English | ภาษาไทย**

An intelligent chatbot on the Command Line that allows you to execute local machine commands directly, powered by a customizable AI workflow on n8n. This project transforms your terminal into a personal assistant, enabling you to chat, issue commands, and get help writing complex shell commands with ease.

---

## 🇬🇧 English Version

### 🚀 How it Works

The chatbot operates with a simple flow:

`You (Terminal)` ↔️ `CLI Script (chatloop.js)` ↔️ `n8n Webhook` ↔️ `AI Model (OpenAI, Gemini, etc.)`

1.  You type a message in your terminal.
2.  The `chatloop.js` script sends your message to an n8n Webhook.
3.  The n8n Workflow processes the message with your chosen AI Model.
4.  The AI responds, and the script displays the output in your terminal.
5.  If the AI wants to run a command, the script will always ask for your permission first.

### ✨ Features

*   **Interactive Chat:** Engage in continuous conversations with the AI right from your terminal.
*   **System Command Execution:** The AI can analyze requests and ask to run shell commands (e.g., `ls -la`, `cat file.txt`) to assist you.
*   **n8n Integration:** Easily connect to your custom-built AI workflows on n8n.
*   **Natural Language Confirmation:** Approve command execution using natural language (e.g., "yes", "ok", "y").
*   **Slash Commands:** Convenient special commands like `/help`, `/clear`, and `/exit`.
*   **Debug Mode:** A developer mode to view detailed background operations.

### 🎬 Demo Video

[!AI CLI Chat Demo](https://youtu.be/GHUQ3Oyn-rM)

*Click the image to watch the demo on YouTube.*

### ⚙️ Prerequisites

*   Node.js (v20.19.1 or higher)
*   `npm` (comes with Node.js)
*   A running n8n instance (Cloud, Self-hosted, or Desktop).

### 🛠️ Installation and Setup

#### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd ai_cli_chat
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Set up the n8n Workflow

> **💡 Tip:** For convenience, you can import the pre-built workflow from the `Workflow_For_N8N/AI_CLI_Chat_Workflow.json` file directly into your n8n instance and skip to Step 4!
>
> If you prefer to build the workflow yourself, follow the steps below.

This project requires a basic n8n workflow with the following structure:

`[Webhook]` → `[AI Node]` → `[Respond to Webhook]`

1.  **Webhook Node (Trigger):**
    *   **Authentication:** `Basic Auth`
    *   **HTTP Method:** `POST`
    *   **Respond:** `When webhook is called`
    *   **Path:** Set your desired path (e.g., `ai-chat`).
    *   Once configured, copy the **Test URL** and **Basic Auth Credentials** for the next step.

2.  **AI Node (e.g., OpenAI, Gemini):**
    *   Connect this node to the Webhook.
    *   Set it to receive the prompt from the Webhook's input using the expression: `{{ $json.body.prompt_msg }}`
    *   Configure the AI's System Prompt or Persona as you wish.

3.  **Respond to Webhook Node:**
    *   Connect this node to the AI Node.
    *   Configure it to send data back in JSON format with a key named `output` and the value being the response from the AI Node.
    *   **Example Expression for OpenAI:** `{{ $('OpenAI').json.choices[0].message.content }}` (This may vary depending on the AI service used).

#### Step 4: Create Configuration File

The `.env` file is used to store configuration settings and secrets (like credentials), allowing the script to connect to your n8n instance without hardcoding them. For security, this file is not tracked by Git.

Copy the example file `.env.example` to a new file named `.env`:

```bash
cp .env.example .env
```

Open the `.env` file and fill in your details:

```ini
# Address of your n8n instance (without http:// or https://)
AI_HOST=your-n8n-instance.com

# Port for n8n (leave blank for standard ports 80/443)
AI_PORT=5678

# Path of your Webhook in n8n (e.g., /webhook/ai-chat)
AI_PATH=/webhook/ai-chat

# Use HTTPS (true) or HTTP (false) for the connection
USE_HTTPS=true

# Basic Auth credentials from the Webhook (format: username:password)
AI_AUTH=your_username:your_password

# Enable/disable debug mode (true/false)
DEBUG_MODE=false
```

### 🚀 Usage

1.  **Make the script executable:**
    ```bash
    chmod +x chatloop.js
    ```

2.  **Start chatting:**
    ```bash
    ./chatloop.js
    ```

#### Example Conversation

```
🤖 Ready to chat! Type /help for commands.
👤: What files are in this directory?
🤖: Sure, let me check for you... [CMD]ls -la[/CMD]

✨ The AI wants to run the command: ls -la
👉 Do you authorize this command?: yes
✅ Command 'ls -la' executed successfully.
... (command output) ...
🤖: This directory contains .env, .env.example, chatloop.js, and package.json. Can I help with anything else? 😊
```

### 🐞 Debugging

To see detailed logs, enable debug mode in your `.env` file:
```ini
DEBUG_MODE=true
```

---

## 🇹🇭 Thai Version (ภาษาไทย)

แชทบอทอัจฉริยะบน Command Line ที่ให้คุณสามารถสั่งรันคำสั่งในเครื่องได้โดยตรง ขับเคลื่อนด้วย AI ผ่าน Workflow ของ n8n ที่คุณปรับแต่งเองได้

### 🚀 หลักการทำงาน (How it Works)

การทำงานของแชทบอทนี้มีขั้นตอนง่ายๆ ดังนี้:

`คุณ (Terminal)` ↔️ `CLI Script (chatloop.js)` ↔️ `n8n Webhook` ↔️ `AI Model (OpenAI, Gemini, etc.)`

1.  คุณพิมพ์ข้อความในเทอร์มินัล
2.  สคริปต์ `chatloop.js` ส่งข้อความของคุณไปยัง n8n Webhook
3.  n8n Workflow ประมวลผลข้อความด้วย AI Model ที่คุณเลือก
4.  AI ตอบกลับมา และสคริปต์จะแสดงผลลัพธ์ในเทอร์มินัลของคุณ
5.  หาก AI ต้องการรันคำสั่ง, สคริปต์จะขออนุญาตจากคุณก่อนเสมอ

### ✨ Features

*   **Interactive Chat:** พูดคุยกับ AI ได้ต่อเนื่องบนเทอร์มินัลของคุณ
*   **System Command Execution:** AI สามารถวิเคราะห์และร้องขอให้รันคำสั่ง shell (เช่น `ls -la`, `cat file.txt`) เพื่อช่วยคุณทำงานได้
*   **n8n Integration:** เชื่อมต่อกับ AI Workflow ที่คุณสร้างขึ้นเองบน n8n ได้อย่างง่ายดาย
*   **Natural Language Confirmation:** ยืนยันการรันคำสั่งด้วยภาษาพูดที่เป็นธรรมชาติ (เช่น "ได้เลย", "ok", "y")
*   **Slash Commands:** มีคำสั่งพิเศษช่วยให้ใช้งานสะดวกขึ้น (`/help`, `/clear`, `/exit`)
*   **Debug Mode:** โหมดสำหรับนักพัฒนาเพื่อดูการทำงานเบื้องหลัง

### 🎬 ตัวอย่างการใช้งาน (วิดีโอ)

[!AI CLI Chat Demo](https://youtu.be/GHUQ3Oyn-rM)

*คลิกที่ภาพเพื่อดูวิดีโอสาธิตการใช้งานบน YouTube*

### ⚙️ สิ่งที่ต้องมี (Prerequisites)

*   Node.js (v20.19.1 หรือสูงกว่า)
*   `npm` (มาพร้อมกับ Node.js)
*   n8n instance ที่ทำงานอยู่ (ไม่ว่าจะเป็นบน Cloud, Self-hosted, หรือ Desktop)

### 🛠️ การติดตั้งและตั้งค่า (Installation and Setup)

#### ขั้นตอนที่ 1: Clone the Repository

```bash
git clone <your-repository-url>
cd ai_cli_chat
```

#### ขั้นตอนที่ 2: Install Dependencies

```bash
npm install
```

#### ขั้นตอนที่ 3: ตั้งค่า n8n Workflow

> **💡 ทิป:** เพื่อความสะดวก คุณสามารถนำเข้า (import) Workflow สำเร็จรูปจากไฟล์ในโฟลเดอร์ `Workflow_For_N8N/AI_CLI_Chat_Workflow.json` เข้าไปใน n8n ของคุณได้เลย แล้วข้ามไปขั้นตอนที่ 4 ได้ทันที!
>
> หากต้องการสร้าง Workflow ด้วยตัวเอง สามารถทำตามขั้นตอนด้านล่างนี้ได้เลย

โปรเจกต์นี้ต้องการ Workflow บน n8n ที่มีโครงสร้างพื้นฐานดังนี้:

`[Webhook]` → `[AI Node]` → `[Respond to Webhook]`

1.  **Webhook Node (Trigger):**
    *   **Authentication:** `Basic Auth`
    *   **HTTP Method:** `POST`
    *   **Respond:** `When webhook is called`
    *   **Path:** ตั้งชื่อ path ที่คุณต้องการ (เช่น `ai-chat`)
    *   เมื่อตั้งค่าเสร็จแล้ว ให้คัดลอก **Test URL** และ **Basic Auth Credentials** มาใช้ในขั้นตอนต่อไป

2.  **AI Node (e.g., OpenAI, Gemini):**
    *   เชื่อมต่อ Node นี้กับ Webhook
    *   ตั้งค่าให้รับ Prompt จาก Input ของ Webhook โดยใช้ Expression: `{{ $json.body.prompt_msg }}`
    *   ตั้งค่า System Prompt หรือ Persona ของ AI ตามที่คุณต้องการ

3.  **Respond to Webhook Node:**
    *   เชื่อมต่อ Node นี้กับ AI Node
    *   ตั้งค่าให้ส่งข้อมูลกลับไปในรูปแบบ JSON โดยมี key ชื่อ `output` และมี value เป็นคำตอบจาก AI Node
    *   **ตัวอย่าง Expression สำหรับ OpenAI:** `{{ $('OpenAI').json.choices[0].message.content }}` (อาจแตกต่างกันไปขึ้นอยู่กับ AI ที่ใช้)

#### ขั้นตอนที่ 4: สร้างไฟล์ตั้งค่า (Create Configuration File)

ไฟล์ `.env` ใช้สำหรับเก็บข้อมูลการตั้งค่าและข้อมูลที่เป็นความลับ (เช่น credentials) เพื่อให้สคริปต์สามารถเชื่อมต่อกับ n8n ของคุณได้อย่างถูกต้อง โดยไม่ต้องแก้ไขโค้ดโดยตรง และเพื่อความปลอดภัย เราจะไม่เก็บไฟล์นี้ไว้ใน Git repository

คัดลอกไฟล์ตัวอย่าง `.env.example` ไปเป็นไฟล์ใหม่ชื่อ `.env`:

```bash
cp .env.example .env
```

เปิดไฟล์ `.env` แล้วกรอกข้อมูล:

```ini
# ที่อยู่ของ n8n instance (ไม่ต้องมี http:// หรือ https://)
AI_HOST=your-n8n-instance.com

# Port ของ n8n (ถ้าใช้ port มาตรฐาน 80/443 ไม่ต้องใส่)
AI_PORT=5678

# Path ของ Webhook ที่ตั้งไว้ใน n8n (เช่น /webhook/ai-chat)
AI_PATH=/webhook/ai-chat

# ใช้ HTTPS (true) หรือ HTTP (false) ในการเชื่อมต่อ
USE_HTTPS=true

# Basic Auth credentials ที่ตั้งไว้ใน Webhook (รูปแบบ: username:password)
AI_AUTH=your_username:your_password

# เปิด/ปิดโหมดดีบัก (true/false)
DEBUG_MODE=false
```

### 🚀 ใช้งาน (Usage)

1.  **ทำให้สคริปต์สามารถรันได้ (Executable):**
    ```bash
    chmod +x chatloop.js
    ```

2.  **เริ่มแชท:**
    ```bash
    ./chatloop.js
    ```

#### ตัวอย่างการสนทนา

```
🤖 พร้อมพูดคุยแล้วจ้า~ พิมพ์ /help ได้เลย
👤: ในนี้มีไฟล์อะไรบ้าง
🤖: ได้เลยค่า เดี๋ยวดูให้นะคะ... [CMD]ls -la[/CMD]

✨ AI ต้องการรันคำสั่ง: ls -la
👉 อนุญาตให้รันคำสั่งนี้มั้ยคะ?: ได้เลย
✅ รันคำสั่ง 'ls -la' เสร็จสิ้น
... (ผลลัพธ์ของคำสั่ง) ...
🤖: ในนี้มีไฟล์ .env, .env.example, chatloop.js, แล้วก็ package.json จ้า มีอะไรให้ช่วยอีกมั้ยคะ 😊
```

### 🐞 Debugging

หากต้องการดู log การทำงานเบื้องหลัง ให้เปิดโหมดดีบักในไฟล์ `.env`:
```ini
DEBUG_MODE=true
```