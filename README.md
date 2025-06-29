# AI CLI Chat (n8n Edition)

แชทบอทอัจฉริยะบน Command Line ที่ให้คุณสามารถสั่งรันคำสั่งในเครื่องได้โดยตรง ขับเคลื่อนด้วย AI ผ่าน Workflow ของ n8n ที่คุณปรับแต่งเองได้

โปรเจกต์นี้จะเปลี่ยนเทอร์มินัลของคุณให้กลายเป็นผู้ช่วยส่วนตัว ที่คุณสามารถพูดคุย, สั่งงาน, และให้ช่วยเขียนคำสั่ง shell ที่ซับซ้อนได้ง่ายๆ

## 🚀 How it Works

การทำงานของแชทบอทนี้มีขั้นตอนง่ายๆ ดังนี้:

`คุณ (Terminal)` ↔️ `CLI Script (chatloop.js)` ↔️ `n8n Webhook` ↔️ `AI Model (OpenAI, Gemini, etc.)`

1.  คุณพิมพ์ข้อความในเทอร์มินัล
2.  สคริปต์ `chatloop.js` ส่งข้อความของคุณไปยัง n8n Webhook
3.  n8n Workflow ประมวลผลข้อความด้วย AI Model ที่คุณเลือก
4.  AI ตอบกลับมา และสคริปต์จะแสดงผลลัพธ์ในเทอร์มินัลของคุณ
5.  หาก AI ต้องการรันคำสั่ง, สคริปต์จะขออนุญาตจากคุณก่อนเสมอ

## ✨ Features

*   **Interactive Chat:** พูดคุยกับ AI ได้ต่อเนื่องบนเทอร์มินัลของคุณ
*   **System Command Execution:** AI สามารถวิเคราะห์และร้องขอให้รันคำสั่ง shell (เช่น `ls -la`, `cat file.txt`) เพื่อช่วยคุณทำงานได้
*   **n8n Integration:** เชื่อมต่อกับ AI Workflow ที่คุณสร้างขึ้นเองบน n8n ได้อย่างง่ายดาย
*   **Natural Language Confirmation:** ยืนยันการรันคำสั่งด้วยภาษาพูดที่เป็นธรรมชาติ (เช่น "ได้เลย", "ok", "y")
*   **Slash Commands:** มีคำสั่งพิเศษช่วยให้ใช้งานสะดวกขึ้น (`/help`, `/clear`, `/exit`, `/debug`)
*   **Debug Mode:** โหมดสำหรับนักพัฒนาเพื่อดูการทำงานเบื้องหลัง

## 🎬 ตัวอย่างการใช้งาน (วิดีโอ)

[!AI CLI Chat Demo](https://youtu.be/GHUQ3Oyn-rM)

*คลิกที่ภาพเพื่อดูวิดีโอสาธิตการใช้งานบน YouTube*

## ⚙️ Prerequisites

*   Node.js (v20.19.1 หรือสูงกว่า)
*   `npm` (มาพร้อมกับ Node.js)
*   n8n instance ที่ทำงานอยู่ (ไม่ว่าจะเป็นบน Cloud, Self-hosted, หรือ Desktop)

## 🛠️ Installation and Setup

### ขั้นตอนที่ 1: Clone the Repository

```bash
git clone <your-repository-url>
cd ai_cli_chat
```

### ขั้นตอนที่ 2: Install Dependencies

```bash
npm install
```

### ขั้นตอนที่ 3: ตั้งค่า n8n Workflow

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

### ขั้นตอนที่ 4: Create Configuration File

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
# - สำหรับ n8n Cloud หรือ Self-hosted ที่มี SSL: true
# - สำหรับ n8n Desktop หรือ Local instance ที่ไม่มี SSL: false
USE_HTTPS=true

# Basic Auth credentials ที่ตั้งไว้ใน Webhook (รูปแบบ: username:password)
AI_AUTH=your_username:your_password

# เปิด/ปิดโหมดดีบัก (true/false)
DEBUG_MODE=false
```

## ใช้งาน (Usage)

1.  **ทำให้สคริปต์สามารถรันได้ (Executable):**
    ```bash
    chmod +x chatloop.js
    ```

2.  **เริ่มแชท:**
    ```bash
    ./chatloop.js
    ```

### ตัวอย่างการสนทนา

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

## 🐞 Debugging

หากต้องการดู log การทำงานเบื้องหลัง ให้เปิดโหมดดีบักในไฟล์ `.env`:
```ini
DEBUG_MODE=true
```