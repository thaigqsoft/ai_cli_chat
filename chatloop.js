#!/usr/bin/env node

/**
 * @file chatloop.js
 * @description
 *   สคริปต์นี้สร้าง Command-Line Interface (CLI) สำหรับการแชทกับ AI แบบโต้ตอบ
 *   ถูกออกแบบมาให้เป็นลูปการสนทนาที่สามารถรัน system command ตามคำแนะนำของ AI ได้
 *   ทำให้เกิดเป็นผู้ช่วยบนเทอร์มินัลที่ทรงพลังและทำงานผ่านการสนทนา
 *
 * @features
 *   - Interactive Chat Loop: วนรับ-ส่งข้อความกับผู้ใช้อย่างต่อเนื่อง
 *   - AI Integration: สื่อสารกับ AI service ผ่าน HTTP API
 *   - System Command Execution: AI สามารถร้องขอให้รัน shell command ได้ (เช่น `ls -la`, `cat file.txt`)
 *     โดยสคริปต์จะดักจับคำร้องขอ, ถามผู้ใช้เพื่อยืนยันความปลอดภัย, รันคำสั่ง,
 *     แล้วส่งผลลัพธ์กลับไปให้ AI วิเคราะห์ต่อ
 *   - Natural Language Confirmation: ผู้ใช้สามารถอนุญาตการรันคำสั่งด้วยภาษาธรรมชาติ (เช่น "yes", "ok", "ได้เลย")
 *   - Asynchronous Operations: ใช้ async/await เพื่อจัดการ I/O แบบไม่ปิดกั้น ทั้งการรับ input, การเรียก API, และการรันคำสั่ง
 *   - User-Friendly Feedback: ใช้ loading spinner (`ora`) เพื่อแสดงสถานะว่า AI กำลังประมวลผล
 *   - Slash Commands: รองรับคำสั่งพิเศษเช่น `/help`, `/clear`, และ `/exit`
 *   - Debug Mode: มีโหมดดีบักที่เปิดใช้งานผ่าน environment variable เพื่อดู log การทำงานโดยละเอียด
 *
 * @how_it_works
 *   1. Initialization: สคริปต์จะโหลดค่าต่าง ๆ (API host, port, auth) จากไฟล์ `.env`
 *   2. Main Loop: เริ่มต้น `while` loop ที่ไม่สิ้นสุดเพื่อรอรับ input จากผู้ใช้ผ่าน `readline`
 *   3. AI Request: input ของผู้ใช้จะถูกส่งไปเป็น prompt ให้กับ AI service
 *   4. Response Parsing: สคริปต์จะตรวจสอบการตอบกลับของ AI
 *      - หากมีคำสั่งที่อยู่ในแท็ก `[CMD]...[/CMD]`:
 *          a. ดึงคำสั่งออกมา
 *          b. ถามผู้ใช้เพื่อขออนุญาตก่อนรัน
 *          c. หากได้รับอนุญาต จะรันคำสั่งผ่าน `child_process.exec`
 *          d. ผลลัพธ์ของคำสั่ง (stdout/stderr) จะถูกนำไปสร้างเป็น prompt ใหม่และส่งกลับไปให้ AI
 *             เพื่อให้ AI รับรู้ผลและทำงานในขั้นตอนต่อไปได้
 *      - หากเป็นข้อความธรรมดา จะแสดงผลให้ผู้ใช้เห็นเป็นคำตอบสุดท้าย
 *   5. State Management: `readline` จะถูกสั่ง `pause` และ `resume` ตามจังหวะที่เหมาะสม
 *      เพื่อป้องกันไม่ให้ input ของผู้ใช้รบกวนการแสดงผลของ spinner และเพื่อให้สามารถถามคำยืนยันได้
 *   6. Error Handling: มี `try...catch` ที่ครอบคลุมเพื่อจัดการข้อผิดพลาดที่อาจเกิดขึ้น
 */

require('dotenv').config();
const readline = require('readline');
const { exec } = require('child_process');
const http = require('http');
const https = require('https');
const ora = require('ora').default;

// กำหนดโหมด Debug จาก Environment Variable
const IS_DEBUG_MODE = process.env.DEBUG_MODE === 'true' || process.env.DEBUG_MODE === '1';

// Helper function สำหรับ Debug Log
const debugLog = (...args) => {
  if (IS_DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
};

// เตรียม readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// [DEBUG] เพิ่มตัวดักฟังเพื่อดูว่า readline ถูกปิดเมื่อไหร่
rl.on('close', () => {
  debugLog('Event "close" บน readline ถูกเรียกแล้ว');
});

// ฟังก์ชันแสดง help
const showHelp = () => {
  console.log(`
📚 คำสั่งพิเศษ:
  /clear_history_chat ล้างประวัติการสนทนาในฝั่ง AI
  /clear    เคลียร์หน้าจอ
  /help     แสดงคำสั่งทั้งหมด
  /exit     ออกจากโปรแกรม
  (เร็วๆ นี้จะมี /save, /theme, /log ด้วยน้า~)
`);
};

// ฟังก์ชันส่งข้อความไปยัง AI
async function sendToAI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ prompt_msg: prompt });

    // เลือกใช้ http หรือ https ตามการตั้งค่าใน .env
    const useHttps = process.env.USE_HTTPS === 'true';
    const requester = useHttps ? https : http;
    debugLog(`Connecting to n8n via ${useHttps ? 'HTTPS' : 'HTTP'}`);

    const options = {
      hostname: process.env.AI_HOST,
      port: process.env.AI_PORT,
      path: process.env.AI_PATH,
      method: 'POST',
      auth: process.env.AI_AUTH,
      timeout: 240000, // 4 นาที
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = requester.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`❌ HTTP ${res.statusCode}: ${res.statusMessage}\n${body}`));
          return;
        }
        try {
          const json = JSON.parse(body);
          resolve(json.output || '[ไม่มีข้อความจาก AI]');
        } catch (e) {
          reject(new Error('❌ ไม่สามารถแปลง JSON ได้:\n' + body));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('❌ การร้องขอหมดเวลา (4 นาที)'));
    });

    req.on('error', (error) => { // This handles network errors
      reject(new Error('❌ การเชื่อมต่อล้มเหลว: ' + error.message));
    });

    req.write(data);
    req.end();
  });
}

// Helper function to ask a question and get an answer asynchronously.
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// ฟังก์ชันสำหรับรัน system command
function executeSystemCommand(command) {
  debugLog(`Executing command: ${command}`);
  return new Promise((resolve) => {
    if (!command) {
      resolve("❌ ไม่มีคำสั่งให้รัน");
      return;
    }
    // กำหนด timeout เผื่อคำสั่งค้าง
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => { // 1 นาที
      if (error) {
        // เมื่อเกิด error เราจะไม่ reject แต่จะ resolve พร้อมข้อความ error
        // เพื่อให้ AI สามารถเห็นข้อผิดพลาดและอาจจะแก้ไขคำสั่งได้
        const errorMessage = `❌ เกิดข้อผิดพลาดตอนรันคำสั่ง: ${error.message}\n--- stderr ---\n${stderr}`;
        debugLog(errorMessage);
        resolve(errorMessage);
        return;
      }
      
      const result = `--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`;
      debugLog(`Command result:\n${result}`);
      resolve(result.trim());
    });
  });
}

// Helper function to check for affirmative responses in natural language
function isAffirmative(text) {
  const affirmativeWords = [
    // English
    'y', 'yes', 'ok', 'sure', 'yeah', 'yep', 'yup', 'go ahead', 'do it', 'please',
    // Thai
    'ได้', 'เอาเลย', 'จัดไป', 'ใช่', 'ตกลง', 'แน่นอน', 'เชิญเลย', 'ทำเลย', 'ได้เลย'
  ];
  const lowerText = text.toLowerCase().trim();
  return affirmativeWords.includes(lowerText);
}

// 🔁 วนรับข้อความเรื่อย ๆ ไม่มีวันจบ
async function mainLoop() {
  console.log('🤖 พร้อมพูดคุยแล้วจ้า~ พิมพ์ /help ได้เลย');

  while (true) {
    debugLog('>> เริ่มต้น while loop รอบใหม่');
    const input = await ask('👤: ');
    debugLog(`ได้รับ input: "${input}"`);
    const text = input.trim();

    if (!text) {
      debugLog('input ว่าง, วนกลับไปรอรับใหม่');
      continue;
    }

    if (text === '/exit') {
      console.log('👋 บ๊ายบาย~ แล้วพบกันใหม่นะคะ');
      rl.close();
      debugLog('สั่ง break ออกจาก loop เพราะ /exit');
      break; // Exit the loop
    }

    if (text === '/help') {
      showHelp();
      debugLog('วนกลับไปรอรับคำสั่งใหม่หลัง /help');
      continue;
    }

    if (text === '/clear') {
      console.clear();
      console.log('🤖 หน้าจอโล่งแล้ว พร้อมคุยต่อเลยจ้า~');
      debugLog('เคลียร์หน้าจอแล้ว และวนกลับไปรอรับคำสั่งใหม่');
      continue;
    }

    if (text === '/clear_history_chat') {
      const spinner = ora('🗑️ กำลังส่งคำสั่งล้างประวัติให้ AI...');
      try {
        rl.pause();
        spinner.start();
        // ส่ง prompt พิเศษเพื่อให้ AI หรือระบบเบื้องหลัง (n8n) ล้างประวัติ
        await sendToAI('/clear_history');
        spinner.succeed('✅ ส่งคำสั่งล้างประวัติในฝั่ง AI เรียบร้อยแล้วค่ะ');
      } catch (err) {
        spinner.fail(String(err.message || err));
        debugLog('เกิดข้อผิดพลาดตอนส่ง /clear_history');
      } finally {
        if (spinner.isSpinning) {
          spinner.stop();
        }
        rl.resume();
      }
      continue;
    }

    let currentPrompt = text;
    let isInteractionDone = false;
    const spinner = ora('🤔 กำลังคิด...');

    try {
      rl.pause(); // หยุด readline ชั่วคราวระหว่างรอ AI และรันคำสั่ง
      spinner.start();

      while (!isInteractionDone) {
        debugLog(`กำลังจะเรียก sendToAI ด้วย prompt: "${currentPrompt}"`);
        spinner.text = '🤔 AI กำลังคิด...';
        const reply = await sendToAI(currentPrompt);
        spinner.stop(); // หยุด spinner ชั่วคราว
        debugLog(`AI ตอบกลับมาว่า: "${reply}"`);

        // ตรวจสอบว่า AI ส่งคำสั่งมาในรูปแบบ [CMD]...[/CMD] หรือไม่
        const commandMatch = reply.match(/\[CMD\]([\s\S]*?)\[\/CMD\]/);

        if (commandMatch) {
          const commandToExecute = commandMatch[1].trim();
          const aiMessage = reply.replace(commandMatch[0], '').trim();

          if (aiMessage) {
            console.log(`🤖: ${aiMessage}`);
          }
          console.log(`\n✨ AI ต้องการรันคำสั่ง: ${commandToExecute}`);

          // ขออนุญาตผู้ใช้ก่อนรันคำสั่งเพื่อความปลอดภัย
          // Resume readline ชั่วคราวเพื่อรอรับ input
          rl.resume();
          const confirmation = await ask('👉 อนุญาตให้รันคำสั่งนี้มั้ยคะ?: ');
          // Pause กลับไปเหมือนเดิมเพื่อให้ spinner ทำงานได้ปกติ
          rl.pause();

          if (!isAffirmative(confirmation)) {
            console.log('🚫 โอเคค่า งั้นยกเลิกคำสั่งนะคะ');
            isInteractionDone = true;
            continue;
          }

          spinner.text = `⚙️ กำลังรัน: ${commandToExecute}`;
          spinner.start();
          const commandResult = await executeSystemCommand(commandToExecute);
          spinner.succeed(`✅ รันคำสั่ง '${commandToExecute}' เสร็จสิ้น`);

          console.log(`\n--- ผลลัพธ์ของคำสั่ง ---\n${commandResult}\n----------------------\n`);

          // เตรียม prompt ใหม่เพื่อส่งผลลัพธ์กลับไปให้ AI
          currentPrompt = `The command "${commandToExecute}" was executed and this was the output:\n\n${commandResult}\n\nBased on this, please analyze the result and continue with the next step or provide the final answer to the user.`;
          spinner.start(); // เริ่ม spinner อีกครั้งเพื่อรอ AI ตอบกลับ
        } else {
          // ถ้าไม่มีคำสั่ง นี่คือคำตอบสุดท้ายจาก AI
          console.log(`🤖: ${reply}`);
          isInteractionDone = true;
        }
      }
    } catch (err) {
      spinner.fail(String(err.message || err));
      debugLog('เกิดข้อผิดพลาดใน interaction loop');
    } finally {
      if (spinner.isSpinning) {
        spinner.stop();
      }
      debugLog('กำลังจะ resume readline...');
      rl.resume();
    }
    debugLog('<< จบการทำงานใน while loop รอบนี้');
  }
  debugLog('ออกจาก while loop แล้ว');
}

mainLoop().catch(err => {
  console.error('\n💥 โอ๊ะ! เกิดข้อผิดพลาดที่ไม่คาดคิด โปรแกรมต้องปิดตัวลง');
  console.error(err);
  process.exit(1);
});