# 🤖 AI CLI Chat

สคริปต์นี้สร้าง Command-Line Interface (CLI) สำหรับการแชทกับ AI แบบโต้ตอบ ถูกออกแบบมาให้เป็นลูปการสนทนาที่สามารถรัน system command ตามคำแนะนำของ AI ได้ ทำให้เกิดเป็นผู้ช่วยบนเทอร์มินัลที่ทรงพลังและทำงานผ่านการสนทนา

*This script creates an interactive Command-Line Interface (CLI) for chatting with an AI. It's designed as a conversational loop that can execute system commands based on the AI's suggestions, creating a powerful, conversation-driven terminal assistant.*

## 🎬 ตัวอย่างการใช้งาน (Demo)

คลิกที่รูปเพื่อดูวิดีโอ / Click the image to watch the video:

[![AI CLI Chat Demo](https://img.youtube.com/vi/GHUQ3Oyn-rM/maxresdefault.jpg)](https://youtu.be/GHUQ3Oyn-rM)

## ✨ คุณสมบัติเด่น (Features)

-   **Interactive Chat Loop**: วนรับ-ส่งข้อความกับผู้ใช้อย่างต่อเนื่อง<br>*(Continuously loops to send and receive messages with the user.)*
-   **AI Integration**: สื่อสารกับ AI service (เช่น n8n workflow) ผ่าน HTTP API<br>*(Communicates with an AI service, e.g., an n8n workflow, via an HTTP API.)*
-   **System Command Execution**: AI สามารถร้องขอให้รัน shell command ได้ (เช่น `ls -la`, `cat file.txt`) โดยสคริปต์จะดักจับคำร้องขอ, ถามผู้ใช้เพื่อยืนยันความปลอดภัย, รันคำสั่ง, แล้วส่งผลลัพธ์กลับไปให้ AI วิเคราะห์ต่อ<br>*(The AI can request to run shell commands. The script intercepts the request, asks the user for confirmation, executes the command, and sends the result back to the AI for analysis.)*
-   **Natural Language Confirmation**: ผู้ใช้สามารถอนุญาตการรันคำสั่งด้วยภาษาธรรมชาติ (เช่น "yes", "ok", "ได้เลย")<br>*(Users can authorize command execution using natural language, e.g., "yes", "ok", "go ahead".)*
-   **Asynchronous Operations**: ใช้ `async/await` เพื่อจัดการ I/O แบบไม่ปิดกั้น ทั้งการรับ input, การเรียก API, และการรันคำสั่ง<br>*(Uses `async/await` to handle non-blocking I/O for user input, API calls, and command execution.)*
-   **Session Management**: กำหนด Session ID ที่ไม่ซ้ำกันสำหรับการรันแต่ละครั้ง หรือใช้ ID เดิมจาก environment variable (`AI_SESSION_ID`) เพื่อให้สามารถสนทนาต่อจากเดิมได้<br>*(Assigns a unique Session ID for each run or uses a persistent ID from an environment variable (`AI_SESSION_ID`) to continue previous conversations.)*
-   **User-Friendly Feedback**: ใช้ loading spinner (`ora`) เพื่อแสดงสถานะว่า AI กำลังประมวลผล<br>*(Uses a loading spinner (`ora`) to indicate when the AI is processing.)*
-   **Slash Commands**: รองรับคำสั่งพิเศษเช่น `/help`, `/clear`, และ `/exit`<br>*(Supports special commands like `/help`, `/clear`, and `/exit`.)*
-   **Debug Mode**: มีโหมดดีบักที่เปิดใช้งานผ่าน environment variable เพื่อดู log การทำงานโดยละเอียด<br>*(Includes a debug mode, enabled via an environment variable, for detailed operational logging.)*

## ⚙️ หลักการทำงาน (How it Works)

1.  **Initialization**: สคริปต์จะโหลดค่าต่าง ๆ จากไฟล์ `.env` และกำหนด Session ID สำหรับการสนทนา<br>*(The script loads configurations from the `.env` file and sets a Session ID for the conversation.)*
2.  **Main Loop**: เริ่มต้น `while` loop ที่ไม่สิ้นสุดเพื่อรอรับ input จากผู้ใช้<br>*(Starts an infinite `while` loop to await user input.)*
3.  **AI Request**: input ของผู้ใช้จะถูกส่งไปเป็น prompt ให้กับ AI service พร้อมกับ `session_id`<br>*(The user's input is sent as a prompt to the AI service, along with the `session_id`.)*
4.  **Response Parsing**: สคริปต์จะตรวจสอบการตอบกลับของ AI<br>*(The script parses the AI's response.)*
    -   หากมีคำสั่ง `[CMD]...[/CMD]`: ดึงคำสั่ง, ถามผู้ใช้เพื่อขออนุญาต, รันคำสั่ง, และส่งผลลัพธ์กลับไปให้ AI<br>*(If it contains a command within `[CMD]...[/CMD]` tags: it extracts the command, asks for permission, executes it, and sends the result back to the AI.)*
    -   หากเป็นข้อความธรรมดา: แสดงผลให้ผู้ใช้เห็นเป็นคำตอบสุดท้าย<br>*(If it's plain text: it's displayed to the user as the final answer.)*
5.  **Error Handling**: มี `try...catch` ที่ครอบคลุมเพื่อจัดการข้อผิดพลาดที่อาจเกิดขึ้น<br>*(A comprehensive `try...catch` block handles potential errors.)*

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

1.  **Clone a repository (ถ้ามี) / Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **ติดตั้ง Dependencies / Install Dependencies:**
    สคริปต์นี้ต้องการ `dotenv` และ `ora` คุณสามารถติดตั้งได้ผ่าน npm:<br>*(This script requires `dotenv` and `ora`. You can install them via npm:)*
    ```bash
    npm install
    ```

3.  **สร้างไฟล์ Environment / Create Environment File:**
    คัดลอกไฟล์ `.env.example` ไปเป็น `.env`<br>*(Copy the `.env.example` file to `.env`:)*
    ```bash
    cp .env.example .env
    ```

4.  **ตั้งค่าในไฟล์ `.env` / Configure the `.env` file:**
    เปิดไฟล์ `.env` แล้วกรอกข้อมูลการเชื่อมต่อ n8n หรือ AI service ของคุณให้ครบถ้วน<br>*(Open the `.env` file and fill in the connection details for your n8n or AI service.)*

    -   `AI_HOST`: ที่อยู่ของ n8n instance (เช่น `localhost`, `your-subdomain.n8n.cloud`) / *The address of your n8n instance (e.g., `localhost`, `your-subdomain.n8n.cloud`).*
    -   `AI_PORT`: Port ของ n8n (เช่น `5678` สำหรับ Desktop) / *The port for your n8n instance (e.g., `5678` for Desktop).*
    -   `AI_PATH`: Path ของ Webhook (เช่น `/webhook-test/1/ai-chat`) / *The webhook path (e.g., `/webhook-test/1/ai-chat`).*
    -   `USE_HTTPS`: ตั้งเป็น `true` หากใช้ SSL, `false` หากไม่ใช้ / *Set to `true` for SSL, `false` otherwise.*
    -   `AI_AUTH`: Basic Auth ในรูปแบบ `username:password` / *Basic Auth credentials in `username:password` format.*
    -   `DEBUG_MODE`: ตั้งเป็น `true` เพื่อเปิดโหมดดีบัก / *Set to `true` to enable debug mode.*
    -   `AI_SESSION_ID`: (ไม่บังคับ) กำหนด Session ID แบบตายตัวเพื่อใช้สนทนาต่อจาก session เดิม / *(Optional) A fixed Session ID to continue a previous conversation.*

## 💻 การใช้งาน (Usage)

รันสคริปต์ผ่าน Node.js: / *Run the script using Node.js:*
```bash
node chatloop.js
```
หรือถ้าคุณได้ตั้งค่า execute permission (`chmod +x chatloop.js`) แล้ว:
```bash
./chatloop.js
```

### คำสั่งพิเศษ (Slash Commands)

-   `/help`: แสดงรายการคำสั่งพิเศษทั้งหมด
-   `/clear`: เคลียร์หน้าจอเทอร์มินัล
-   `/clear_history_chat`: ส่งคำสั่งเพื่อล้างประวัติการสนทนาในฝั่ง AI (n8n)
-   `/exit`: ออกจากโปรแกรม