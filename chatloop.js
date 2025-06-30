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
 *   - Session Management: กำหนด Session ID ที่ไม่ซ้ำกันสำหรับการรันแต่ละครั้ง หรือใช้ ID เดิมจาก environment variable (`AI_SESSION_ID`) เพื่อให้สามารถสนทนาต่อจากเดิมได้
 *   - User-Friendly Feedback: ใช้ loading spinner (`ora`) เพื่อแสดงสถานะว่า AI กำลังประมวลผล
 *   - Slash Commands: รองรับคำสั่งพิเศษเช่น `/help`, `/clear`, และ `/exit`
 *   - Debug Mode: มีโหมดดีบักที่เปิดใช้งานผ่าน environment variable เพื่อดู log การทำงานโดยละเอียด
 *
 * @how_it_works
 *   1. Initialization: สคริปต์จะโหลดค่าต่าง ๆ (API host, port, auth) จากไฟล์ `.env`
 *      และกำหนด Session ID สำหรับการสนทนา (ใช้ค่าจาก `AI_SESSION_ID` หากมี หรือสร้างขึ้นใหม่)
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
const { randomUUID } = require('crypto');
const ora = require('ora').default;
const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

// กำหนดโหมด Debug จาก Environment Variable
const IS_DEBUG_MODE = process.env.DEBUG_MODE === 'true' || process.env.DEBUG_MODE === '1';

// กำหนด Session ID จาก Environment Variable หรือสร้างขึ้นมาใหม่
// เพื่อให้ Webhook (n8n) สามารถแยกแยะแต่ละ session การสนทนาได้
const SESSION_ID = process.env.AI_SESSION_ID || randomUUID();

// กำหนดขนาดสูงสุดของผลลัพธ์ command ก่อนที่จะแบ่งเป็นส่วนๆ
const MAX_CHUNK_SIZE = 4000; // อิงตามขนาด context window ของ AI model โดยประมาณ

// Helper function สำหรับ Debug Log
const debugLog = (...args) => {
  if (IS_DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
};

if (IS_DEBUG_MODE) {
  debugLog(`Using Session ID: ${SESSION_ID}`);
}

// --- START: Command History ---
// กำหนดที่อยู่ของไฟล์ประวัติคำสั่ง
const HISTORY_FILE_PATH = path.join(process.cwd(), 'history.log');

// โหลดประวัติคำสั่งจากไฟล์
let commandHistory = [];
try {
  if (fs.existsSync(HISTORY_FILE_PATH)) {
    commandHistory = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8')
      .split('\n')
      .map(line => line.trim()) // ตัดช่องว่างหน้า-หลัง
      .filter(Boolean); // กรองบรรทัดว่างออก (วิธีที่สั้นกว่า)
    // rl.history บันทึกแบบใหม่สุดไปเก่าสุด (newest-to-oldest) ลงไฟล์
    // แต่ตอนโหลด readline ต้องการประวัติแบบเก่าสุดไปใหม่สุด (oldest-to-newest)
    // ดังนั้นเราจึงต้องกลับด้าน (reverse) อาร์เรย์ที่อ่านมาจากไฟล์ก่อนใช้งาน
    commandHistory.reverse();
    debugLog(`โหลดประวัติคำสั่งมา ${commandHistory.length} รายการ`);
  }
} catch (err) {
  console.error('⚠️ ไม่สามารถโหลดประวัติคำสั่งได้:', err.message);
}
// --- END: Command History ---

// เตรียม readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  history: commandHistory, // เปิดใช้งานประวัติคำสั่ง
  historySize: 1000        // จำกัดขนาดของประวัติ
});

// ตัวแปรสำหรับเก็บสถานะของประวัติที่บันทึกล่าสุด เพื่อป้องกันการเขียนไฟล์ซ้ำซ้อน
let lastSavedHistoryState = '';

// ฟังก์ชันสำหรับบันทึกประวัติคำสั่ง
function saveHistory() {
  debugLog('กำลังจะบันทึกประวัติ...');
  try {
    // rl.history จะเป็น null/undefined หาก readline ไม่ได้ถูกสร้าง
    if (!rl || !rl.history) {
      debugLog('Readline หรือ history ไม่พร้อมใช้งาน, ข้ามการบันทึก');
      return;
    }
    // ก่อนบันทึก เราจะกรองประวัติในหน่วยความจำออกก่อน
    // เพื่อให้ไฟล์ history.log เก็บเฉพาะ prompt ที่มีความหมายจริงๆ
    const historyToSave = rl.history.filter(line => {
      const trimmed = line.trim();
      // เก็บเฉพาะบรรทัดที่ไม่ใช่ค่าว่าง และไม่ใช่ slash command
      return trimmed && !trimmed.startsWith('/');
    });

    const currentHistoryState = historyToSave.join('\n');

    // ตรวจสอบว่าประวัติมีการเปลี่ยนแปลงจากครั้งล่าสุดที่บันทึกหรือไม่
    if (currentHistoryState === lastSavedHistoryState) {
      debugLog('ประวัติไม่มีการเปลี่ยนแปลง, ข้ามการบันทึกไฟล์');
      return;
    }

    // rl.history จะเรียงจากใหม่สุดไปเก่าสุด (newest-to-oldest)
    // เราจะบันทึกลงไฟล์ตามลำดับนี้เลย ซึ่งทำให้ไฟล์อ่านง่าย (ของใหม่อยู่บน)
    // และตอนโหลดกลับ เราจะใช้ .reverse() เพื่อให้ readline ทำงานถูกต้อง
    fs.writeFileSync(HISTORY_FILE_PATH, currentHistoryState);
    lastSavedHistoryState = currentHistoryState; // อัปเดตสถานะล่าสุด
    debugLog(`กรองและบันทึกประวัติ ${historyToSave.length} จากทั้งหมด ${rl.history.length} รายการเรียบร้อยแล้ว`);
  } catch (err) {
    // ไม่ต้องทำให้โปรแกรมพัง แค่แสดงข้อผิดพลาดก็พอ
    console.error('⚠️ ไม่สามารถบันทึกประวัติคำสั่งได้:', err.message);
  }
}

// ตัวแปรสำหรับเก็บ ID ของ interval ที่ใช้บันทึกประวัติอัตโนมัติ
let historySaveInterval;

// ดักจับ event ตอนจบการทำงานของโปรแกรมเพื่อบันทึกประวัติ
// วิธีนี้จะทำงานครอบคลุมทั้งการใช้ /exit และการกด Ctrl+C
process.on('exit', () => {
  // หยุดการบันทึกอัตโนมัติ
  clearInterval(historySaveInterval);
  // บันทึกครั้งสุดท้ายก่อนปิดโปรแกรมเพื่อให้แน่ใจว่าข้อมูลครบถ้วน
  saveHistory();
});

// ฟังก์ชันแสดง help
const showHelp = () => {
  console.log(chalk.yellow(`
📚 คำสั่งพิเศษ:
  ${chalk.cyan('/show_history')}       แสดงประวัติการสนทนาใน session นี้
  ${chalk.cyan('/show_full_history')}  แสดงประวัติทั้งหมดที่บันทึกไว้
  ${chalk.cyan('/clear_history_chat')} ล้างประวัติการสนทนาในฝั่ง AI
  ${chalk.cyan('/clear')}              เคลียร์หน้าจอ
  ${chalk.cyan('/help')}               แสดงคำสั่งทั้งหมด
  ${chalk.cyan('/exit')}               ออกจากโปรแกรม
  (เร็วๆ นี้จะมี /save, /theme, /log ด้วยน้า~)
`));
};

// ฟังก์ชันแสดงประวัติคำสั่งทั้งหมดที่บันทึกไว้ในไฟล์
const showFullHistory = () => {
  debugLog('กำลังจะแสดงประวัติคำสั่งทั้งหมดจากไฟล์');
  try {
    if (fs.existsSync(HISTORY_FILE_PATH)) {
      const historyContent = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8').trim();
      if (historyContent) {
        console.log(chalk.gray('\n--- 📜 ประวัติคำสั่งทั้งหมด (จาก history.log) ---'));
        console.log(historyContent);
        console.log(chalk.gray('-------------------------------------------------'));
      } else {
        console.log(chalk.yellow('📜 ไฟล์ประวัติ (history.log) ว่างเปล่า'));
      }
    } else {
      console.log(chalk.yellow('📜 ไม่พบไฟล์ประวัติ (history.log)'));
    }
  } catch (err) {
    console.error('⚠️ ไม่สามารถอ่านไฟล์ประวัติคำสั่งได้:', err.message);
  }
};

// ฟังก์ชันแสดงประวัติคำสั่งที่บันทึกไว้
const showHistory = () => {
  debugLog('กำลังจะแสดงประวัติคำสั่งจากหน่วยความจำ (rl.history)');
  // rl.history จะเก็บประวัติของ session ปัจจุบันที่ถูกกรองแล้ว (เฉพาะ prompt จริงๆ)
  // โดยเรียงจากใหม่สุดไปเก่าสุด ซึ่งเหมาะกับการแสดงผล
  const currentHistory = rl.history;

  if (currentHistory && currentHistory.length > 0) {
    console.log(chalk.gray('\n--- 📜 ประวัติการสนทนาใน Session นี้ ---'));
    // แสดงผลจากใหม่ไปเก่า (ตามที่ rl.history เก็บไว้)
    console.log(currentHistory.join('\n'));
    console.log(chalk.gray('-----------------------------------------'));
  } else {
    console.log(chalk.yellow('📜 ยังไม่มีประวัติการสนทนาใน Session นี้'));
  }
};

// ฟังก์ชันส่งข้อความไปยัง AI
async function sendToAI(prompt) {
  return new Promise((resolve, reject) => {
    const payload = {
      prompt_msg: prompt,
      session_id: SESSION_ID
    };
    const data = JSON.stringify(payload);

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
          reject(new Error(chalk.red(`❌ HTTP ${res.statusCode}: ${res.statusMessage}\n${body}`)));
          return;
        }
        try {
          const json = JSON.parse(body);
          resolve(json.output || chalk.gray('[ไม่มีข้อความจาก AI]'));
        } catch (e) {
          reject(new Error(chalk.red('❌ ไม่สามารถแปลง JSON ได้:\n' + body)));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(chalk.red('❌ การร้องขอหมดเวลา (4 นาที)')));
    });

    req.on('error', (error) => { // This handles network errors
      reject(new Error(chalk.red('❌ การเชื่อมต่อล้มเหลว: ' + error.message)));
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
      resolve(chalk.red("❌ ไม่มีคำสั่งให้รัน"));
      return;
    }
    // กำหนด timeout เผื่อคำสั่งค้าง
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => { // 1 นาที
      if (error) {
        // เมื่อเกิด error เราจะไม่ reject แต่จะ resolve พร้อมข้อความ error
        // เพื่อให้ AI สามารถเห็นข้อผิดพลาดและอาจจะแก้ไขคำสั่งได้
        const errorMessage = chalk.red(`❌ เกิดข้อผิดพลาดตอนรันคำสั่ง: ${error.message}\n--- stderr ---\n${stderr}`);
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
  console.log(chalk.green('🤖 พร้อมพูดคุยแล้วจ้า~ พิมพ์ /help ได้เลย'));

  while (true) {
    debugLog('>> เริ่มต้น while loop รอบใหม่');
    const input = await ask(chalk.cyan('👤: '));
    const text = input.trim();
    debugLog('🔁 rl.history:', rl.history);
    // --- START: History and Slash Command Handling ---
    // ตรวจสอบว่า input ที่รับมาเป็น prompt ที่จะส่งให้ AI หรือเป็นคำสั่งพิเศษ (slash command)
    // เราต้องการให้ประวัติการสนทนา (ที่เรียกดูด้วยลูกศรขึ้น-ลง) มีเฉพาะ prompt ที่เคยส่งให้ AI เท่านั้น
    const isPromptForAI = text && !text.startsWith('/');

    debugLog(`ได้รับ input: "${input}", เป็น prompt สำหรับ AI: ${isPromptForAI}`); // เราจะไม่กรอง history ที่นี่แล้วเพื่อความเสถียร

    if (!text) {
      debugLog('input ว่าง, วนกลับไปรอรับใหม่');
      continue;
    }

    // ถ้าเป็น Slash Command ให้จัดการในนี้แล้ววนกลับไปรอรับ input ใหม่
    if (!isPromptForAI) {
      switch (text) {
        case '/exit':
          console.log(chalk.magenta('👋 บ๊ายบาย~ แล้วพบกันใหม่นะคะ'));
          rl.close();
          // process.on('exit') จะจัดการบันทึกประวัติให้โดยอัตโนมัติ
          process.exit(0); // จบการทำงานของโปรแกรม ซึ่งจะ trigger 'exit' event
        case '/help':
          showHelp();
          break;
        case '/clear':
          console.clear();
          console.log(chalk.green('🤖 หน้าจอโล่งแล้ว พร้อมคุยต่อเลยจ้า~'));
          break;
        case '/show_history':
          showHistory();
          break;
        case '/show_full_history':
          showFullHistory();
          break;
        case '/clear_history_chat':
          // การทำงานส่วนนี้เป็น async เลยต้องครอบด้วย IIFE (Immediately Invoked Function Expression)
          await (async () => {
            const spinner = ora({ text: '🗑️ กำลังส่งคำสั่งล้างประวัติให้ AI...', color: 'yellow' });
            try {
              rl.pause();
              spinner.start();
              await sendToAI('/clear_history_chat');
              spinner.succeed(chalk.green('✅ ส่งคำสั่งล้างประวัติในฝั่ง AI เรียบร้อยแล้วค่ะ'));
            } catch (err) {
              spinner.fail(chalk.red(String(err.message || err)));
            } finally {
              if (spinner.isSpinning) spinner.stop();
              rl.resume();
            }
          })();
          break;
        default:
          console.log(chalk.yellow(`🤔 ไม่รู้จักคำสั่ง: ${text}`));
          break;
      }
      continue;
    }
    // --- END: History and Slash Command Handling ---
    
    let currentPrompt = text;
    let isInteractionDone = false;
    const spinner = ora({ text: '🤔 กำลังคิด...', color: 'yellow' });

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
            console.log(chalk.yellow(`🤖: ${aiMessage}`));
          }
          console.log(chalk.blue.bold(`\n✨ AI ต้องการรันคำสั่ง: ${commandToExecute}`));

          // ขออนุญาตผู้ใช้ก่อนรันคำสั่งเพื่อความปลอดภัย
          // Resume readline ชั่วคราวเพื่อรอรับ input
          rl.resume();
          const confirmation = await ask(chalk.yellow('👉 อนุญาตให้รันคำสั่งนี้มั้ยคะ?: '));
          // เราจะไม่ลบคำยืนยันออกจาก history ที่นี่แล้ว แต่จะไปกรองออกตอนบันทึกไฟล์
          // Pause กลับไปเหมือนเดิมเพื่อให้ spinner ทำงานได้ปกติ
          rl.pause();

          if (!isAffirmative(confirmation)) {
            console.log(chalk.gray('🚫 โอเคค่า งั้นยกเลิกคำสั่งนะคะ'));
            isInteractionDone = true;
            continue;
          }

          spinner.text = `⚙️ กำลังรัน: ${commandToExecute}`;
          spinner.color = 'blue';
          spinner.start();
          const commandResult = await executeSystemCommand(commandToExecute);
          spinner.succeed(chalk.green(`✅ รันคำสั่ง '${commandToExecute}' เสร็จสิ้น`));

          console.log(chalk.gray(`\n--- ผลลัพธ์ของคำสั่ง ---\n${commandResult}\n----------------------\n`));

          // --- START: Handle large command output by chunking ---
          if (commandResult.length > MAX_CHUNK_SIZE) {
            spinner.text = '📝 ผลลัพธ์มีขนาดใหญ่ กำลังแบ่งและส่งให้ AI ทีละส่วน...';
            spinner.color = 'magenta';
            spinner.start();

            const chunks = [];
            for (let i = 0; i < commandResult.length; i += MAX_CHUNK_SIZE) {
              chunks.push(commandResult.substring(i, i + MAX_CHUNK_SIZE));
            }
            
            debugLog(`แบ่งผลลัพธ์ของคำสั่งออกเป็น ${chunks.length} ส่วน`);

            // ป้อนข้อมูลเกือบทั้งหมดให้ AI เพื่อสะสมใน context
            for (let i = 0; i < chunks.length - 1; i++) {
              const chunkPrompt = `The user ran the command "${commandToExecute}". The output is very large, so I am feeding it to you in parts. This is part ${i + 1} of ${chunks.length}. Do not analyze it yet or perform any other action. Just acknowledge that you have received this part by replying with "OK" and nothing else.\n\n--- START OF PART ${i + 1}/${chunks.length} ---\n${chunks[i]}\n--- END OF PART ${i + 1}/${chunks.length} ---`;
              
              spinner.text = `📝 กำลังส่งส่วนที่ ${i + 1}/${chunks.length} ให้ AI...`;
              debugLog(`Sending chunk ${i + 1} to AI.`);
              
              // เราส่ง chunk ไปและอาศัย session_id ให้ AI จำ context ไว้
              // เราไม่แสดงผลลัพธ์ "OK" ให้ผู้ใช้เห็น
              await sendToAI(chunkPrompt); 
            }

            // เตรียม prompt สำหรับ chunk สุดท้าย พร้อมสั่งให้วิเคราะห์
            const finalChunk = chunks[chunks.length - 1];
            currentPrompt = `This is the final part (${chunks.length} of ${chunks.length}) of the output from the command "${commandToExecute}".\n\n--- START OF FINAL PART ${chunks.length}/${chunks.length} ---\n${finalChunk}\n--- END OF FINAL PART ---\n\nNow, taking all the previous parts into account, please analyze the complete result and provide the final answer or suggest the next step to the user.`;
            debugLog(`Sending the final chunk and asking for analysis.`);
            spinner.text = '📝 กำลังส่งส่วนสุดท้ายและรอการวิเคราะห์จาก AI...';
          } else {
            // พฤติกรรมเดิมสำหรับผลลัพธ์ที่ไม่ใหญ่เกินไป
            currentPrompt = `The command "${commandToExecute}" was executed and this was the output:\n\n${commandResult}\n\nBased on this, please analyze the result and continue with the next step or provide the final answer to the user.`;
          }
          // --- END: Handle large command output by chunking ---

          spinner.start(); // เริ่ม spinner อีกครั้งเพื่อรอ `sendToAI` ในรอบถัดไปของ loop
        } else {
          // ถ้าไม่มีคำสั่ง นี่คือคำตอบสุดท้ายจาก AI
          console.log(chalk.yellow(`🤖: ${reply}`));
          isInteractionDone = true;
        }
      }
    } catch (err) {
      spinner.fail(chalk.red(String(err.message || err)));
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

// เริ่มการบันทึกประวัติอัตโนมัติทุกๆ 30 วินาที
const HISTORY_SAVE_INTERVAL_MS = 30000;
historySaveInterval = setInterval(saveHistory, HISTORY_SAVE_INTERVAL_MS);
debugLog(`ตั้งค่าการบันทึกประวัติอัตโนมัติทุก ${HISTORY_SAVE_INTERVAL_MS / 1000} วินาที`);

mainLoop().catch(err => {
  console.error('\n💥 โอ๊ะ! เกิดข้อผิดพลาดที่ไม่คาดคิด โปรแกรมต้องปิดตัวลง');
  console.error(err);
  process.exit(1);
});