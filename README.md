# AI CLI Chat (n8n Edition)

แชทบอทบน Command Line ที่สามารถสั่งรันคำสั่งในเครื่องของคุณได้ ขับเคลื่อนด้วย AI ผ่าน Workflow ของ n8n

## ✨ Features

*   **Interactive Chat:** พูดคุยกับ AI ได้ต่อเนื่องบนเทอร์มินัลของคุณ
*   **System Command Execution:** AI สามารถวิเคราะห์และร้องขอให้รันคำสั่ง shell (เช่น `ls -la`, `cat file.txt`) เพื่อช่วยคุณทำงานได้
*   **n8n Integration:** เชื่อมต่อกับ AI Workflow ที่คุณสร้างขึ้นเองบน n8n ได้อย่างง่ายดาย
*   **Natural Language Confirmation:** ยืนยันการรันคำสั่งด้วยภาษาพูดที่เป็นธรรมชาติ (เช่น "ได้เลย", "ok")
*   **Slash Commands:** มีคำสั่งพิเศษช่วยให้ใช้งานสะดวกขึ้น (`/help`, `/clear`, `/exit`)
*   **Debug Mode:** โหมดสำหรับนักพัฒนาเพื่อดูการทำงานเบื้องหลัง

## ⚙️ System Requirements

*   Node.js (แนะนำเวอร์ชัน 16.x ขึ้นไป)
*   `npm` (มาพร้อมกับ Node.js)
*   n8n instance ที่ทำงานอยู่ (ไม่ว่าจะเป็นบน Cloud, Self-hosted, หรือ Desktop)

## 🚀 Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd ai_cli_chat
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a configuration file:**
    คัดลอกไฟล์ `.env.example` ไปเป็น `.env`
    ```bash
    cp .env.example .env
    ```

## 🔧 Configuration

### 1. ตั้งค่า n8n Workflow

โปรเจกต์นี้ต้องการ Workflow บน n8n ที่มีลักษณะดังนี้:

1.  **Webhook Node (Trigger):**
    *   **Authentication:** `Basic Auth`
    *   **HTTP Method:** `POST`
    *   **Respond:** `When webhook is called`
    *   **Path:** ตั้งชื่อ path ที่คุณต้องการ (เช่น `ai-chat`)
    *   เมื่อตั้งค่าเสร็จแล้ว ให้คัดลอก **Test URL** มาใช้ในขั้นตอนต่อไป

2.  **AI Node (e.g., OpenAI, Gemini, etc.):**
    *   เชื่อมต่อ Node นี้กับ Webhook
    *   ตั้งค่าให้รับ Prompt จาก Input ของ Webhook โดยใช้ Expression: `{{ $json.body.prompt_msg }}`
    *   ตั้งค่า System Prompt หรือ Persona ของ AI ตามที่คุณต้องการ

3.  **Respond to Webhook Node:**
    *   เชื่อมต่อ Node นี้กับ AI Node
    *   ตั้งค่าให้ส่งข้อมูลกลับไปในรูปแบบ JSON โดยมี key ชื่อ `output` และมี value เป็นคำตอบจาก AI Node
    *   ตัวอย่าง Expression สำหรับ OpenAI: `{{ $('OpenAI').json.choices[0].message.content }}` (อาจแตกต่างกันไปขึ้นอยู่กับ AI ที่ใช้)

**ตัวอย่าง Workflow:**
`[Webhook]` ---> `[AI Node]` ---> `[Respond to Webhook]`

### 2. ตั้งค่าไฟล์ `.env`

เปิดไฟล์ `.env` แล้วกรอกข้อมูล n8n Webhook ของคุณตามที่ได้จากขั้นตอนก่อนหน้า:

```ini
# ที่อยู่ของ n8n instance (ไม่ต้องมี http://)
AI_HOST=your-n8n-instance.com

# Port ของ n8n (ถ้าใช้ port มาตรฐาน 80/443 ไม่ต้องใส่)
AI_PORT=5678

# Path ของ Webhook ที่ตั้งไว้ในข้อ 1
AI_PATH=/webhook/ai-chat

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