import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { del as blobDelete, get as blobGet, put as blobPut } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';

const app = express();
const PORT = 3000;

// Directories
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Ensure directories exist
[DATA_DIR, UPLOAD_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Seed data if missing
const SAMPLE_KINEMATICS_HTML = `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Кинематика: Жылдамдық пен Үдеу</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #f8fafc; color: #1e293b; display: flex; justify-content: center; padding: 20px; }
    .card { background: #ffffff; max-width: 680px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 32px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 99px; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
    h1 { font-size: 22px; color: #0f172a; margin-bottom: 8px; }
    .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin: 20px 0; }
    .progress-fill { background: #2563eb; height: 100%; width: 25%; transition: width 0.3s; }
    .question-box { margin-bottom: 24px; padding: 18px; background: #f1f5f9; border-radius: 12px; border-left: 4px solid #2563eb; }
    .question-text { font-size: 17px; font-weight: 600; line-height: 1.5; margin-bottom: 8px; }
    .options { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .opt-btn { background: #ffffff; border: 1.5px solid #cbd5e1; padding: 14px 18px; border-radius: 10px; font-size: 15px; text-align: left; cursor: pointer; transition: all 0.2s; font-weight: 500; }
    .opt-btn:hover { border-color: #2563eb; background: #eff6ff; }
    .opt-btn.correct { background: #dcfce7 !important; border-color: #16a34a !important; color: #15803d; }
    .opt-btn.wrong { background: #fee2e2 !important; border-color: #dc2626 !important; color: #b91c1c; }
    .feedback { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
    .btn-next { margin-top: 20px; width: 100%; background: #2563eb; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; display: none; }
    .btn-next:hover { background: #1d4ed8; }
    .res-box { text-align: center; display: none; }
    .score-circle { width: 110px; height: 110px; border-radius: 50%; background: #eff6ff; border: 4px solid #2563eb; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #2563eb; margin: 20px auto; }
  </style>
</head>
<body>
  <div class="card">
    <div id="quiz-screen">
      <span class="badge">⚛️ Физика · 7-9 сынып</span>
      <h1 id="q-title">Кинематика негіздері</h1>
      <div class="progress-bar"><div class="progress-fill" id="p-bar"></div></div>
      <div class="question-box">
        <div class="question-text" id="q-text">Сұрақ жүктелуде...</div>
      </div>
      <div class="options" id="opt-container"></div>
      <div class="feedback" id="feedback-box"></div>
      <button class="btn-next" id="btn-next" onclick="nextQuestion()">Келесі сұрақ →</button>
    </div>

    <div class="res-box" id="res-screen">
      <span class="badge">🏁 Ойын аяқталды!</span>
      <h1>Жарайсың! Тест сәтті тапсырылды</h1>
      <div class="score-circle" id="final-pct">0%</div>
      <p id="final-stats" style="color:#64748b; margin-bottom: 24px;"></p>
      <p style="font-size:14px; color:#475569;">Нәтижең мұғалімге автоматты түрде жолданды. Қатемен жұмыс парағы төменде ашылады.</p>
    </div>
  </div>

  <script>
    const questions = [
      {
        q: "1. Автомобиль 2 сағатта 120 км жол жүрді. Оның орташа жылдамдығы қандай?",
        opts: ["50 км/сағ", "60 км/сағ", "70 км/сағ", "240 км/сағ"],
        ans: "60 км/сағ",
        exp: "Орташа жылдамдық v = S / t = 120 км / 2 сағ = 60 км/сағ."
      },
      {
        q: "2. Дене тыныштық күйден 3 м/с² үдеумен қозғала бастады. 4 секундтан кейін оның жылдамдығы қандай болады?",
        opts: ["7 м/с", "12 м/с", "16 м/с", "1.33 м/с"],
        ans: "12 м/с",
        exp: "v = v₀ + at = 0 + (3 м/с² * 4 с) = 12 м/с."
      },
      {
        q: "3. Түзусызықты бірқалыпты қозғалыста үдеу неге тең?",
        opts: ["Нөлге тең (a = 0)", "Тұрақты санға (a = const > 0)", "Үнемі артады", "Шексіздікке тең"],
        ans: "Нөлге тең (a = 0)",
        exp: "Бірқалыпты қозғалыста жылдамдық өзгермейді (v = const), сондықтан үдеу a = 0."
      },
      {
        q: "4. Еркін түсу үдеуі (g) Жер бетінде шамамен қаншаға тең?",
        opts: ["3.14 м/с²", "9.8 м/с² (немесе ~10 м/с²)", "100 м/с²", "0 м/с²"],
        ans: "9.8 м/с² (немесе ~10 м/с²)",
        exp: "Жер беті маңындағы еркін түсу үдеуі g ≈ 9.8 м/с²."
      }
    ];

    let curIdx = 0;
    let score = 0;
    let mistakes = [];
    const startTime = Date.now();

    function renderQuestion() {
      const item = questions[curIdx];
      document.getElementById('p-bar').style.width = ((curIdx + 1) / questions.length * 100) + '%';
      document.getElementById('q-text').textContent = item.q;
      const optsDiv = document.getElementById('opt-container');
      optsDiv.innerHTML = '';
      document.getElementById('feedback-box').style.display = 'none';
      document.getElementById('btn-next').style.display = 'none';

      item.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt, item);
        optsDiv.appendChild(btn);
      });
    }

    function checkAnswer(btn, chosen, item) {
      const allBtns = document.querySelectorAll('.opt-btn');
      allBtns.forEach(b => b.disabled = true);
      const fb = document.getElementById('feedback-box');
      fb.style.display = 'block';

      if (chosen === item.ans) {
        btn.classList.add('correct');
        score++;
        fb.style.background = '#dcfce7';
        fb.style.color = '#15803d';
        fb.innerHTML = '<strong>Дұрыс! 👍</strong> ' + item.exp;
      } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
          if (b.textContent === item.ans) b.classList.add('correct');
        });
        mistakes.push({
          question: item.q,
          studentAnswer: chosen,
          correctAnswer: item.ans,
          explanation: item.exp,
          topic: "Кинематика"
        });
        fb.style.background = '#fee2e2';
        fb.style.color = '#b91c1c';
        fb.innerHTML = '<strong>Қате! ❌</strong> Дұрыс жауабы: <b>' + item.ans + '</b>. ' + item.exp;
      }

      document.getElementById('btn-next').style.display = 'block';
    }

    function nextQuestion() {
      curIdx++;
      if (curIdx < questions.length) {
        renderQuestion();
      } else {
        finishGame();
      }
    }

    function finishGame() {
      document.getElementById('quiz-screen').style.display = 'none';
      document.getElementById('res-screen').style.display = 'block';
      const pct = Math.round((score / questions.length) * 100);
      document.getElementById('final-pct').textContent = pct + '%';
      document.getElementById('final-stats').textContent = 'Жинаған ұпайыңыз: ' + score + ' / ' + questions.length;

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Report result to platform via Universal Bridge
      if (window.reportResult) {
        window.reportResult({
          score: score,
          total: questions.length,
          percentage: pct,
          durationSec: duration,
          mistakes: mistakes
        });
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PHYSICS_GAME_RESULT',
          score: score,
          total: questions.length,
          percentage: pct,
          durationSec: duration,
          mistakes: mistakes
        }, '*');
      }
    }

    renderQuestion();
  </script>
</body>
</html>`;

const SAMPLE_NEWTON_HTML = `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ньютон заңдары және Күштер</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #f8fafc; color: #1e293b; display: flex; justify-content: center; padding: 20px; }
    .card { background: #ffffff; max-width: 680px; width: 100%; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 32px; }
    .badge { display: inline-block; background: #fef3c7; color: #b45309; padding: 4px 12px; border-radius: 99px; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
    h1 { font-size: 22px; color: #0f172a; margin-bottom: 8px; }
    .sim-box { background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e1; }
    .sim-car { font-size: 48px; transition: transform 0.5s ease; display: inline-block; }
    .question-text { font-size: 17px; font-weight: 600; line-height: 1.5; margin: 16px 0 12px; }
    .options { display: flex; flex-direction: column; gap: 10px; }
    .opt-btn { background: #ffffff; border: 1.5px solid #cbd5e1; padding: 14px 18px; border-radius: 10px; font-size: 15px; text-align: left; cursor: pointer; transition: all 0.2s; font-weight: 500; }
    .opt-btn:hover { border-color: #0284c7; background: #f0f9ff; }
    .opt-btn.correct { background: #dcfce7 !important; border-color: #16a34a !important; color: #15803d; }
    .opt-btn.wrong { background: #fee2e2 !important; border-color: #dc2626 !important; color: #b91c1c; }
    .feedback { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
    .btn-next { margin-top: 20px; width: 100%; background: #0284c7; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; display: none; }
    .btn-next:hover { background: #0369a1; }
    .res-box { text-align: center; display: none; }
    .score-circle { width: 110px; height: 110px; border-radius: 50%; background: #f0f9ff; border: 4px solid #0284c7; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #0284c7; margin: 20px auto; }
  </style>
</head>
<body>
  <div class="card">
    <div id="quiz-screen">
      <span class="badge">⚖️ Динамика · 7-10 сынып</span>
      <h1>Ньютон заңдары және Күштер</h1>
      
      <div class="sim-box">
        <div class="sim-car" id="sim-obj">🚗 💨</div>
        <p style="font-size:13px; color:#64748b; margin-top:6px;" id="sim-caption">Интерактивті симуляциялық сұрақтар</p>
      </div>

      <div class="question-text" id="q-text">Сұрақ...</div>
      <div class="options" id="opt-container"></div>
      <div class="feedback" id="feedback-box"></div>
      <button class="btn-next" id="btn-next" onclick="nextQuestion()">Келесі сұраққа өту →</button>
    </div>

    <div class="res-box" id="res-screen">
      <span class="badge">🏆 Тамаша!</span>
      <h1>Сынақ аяқталды!</h1>
      <div class="score-circle" id="final-pct">0%</div>
      <p id="final-stats" style="color:#64748b; margin-bottom: 24px;"></p>
      <p style="font-size:14px; color:#475569;">Нәтиже тіркелді. Төмендегі нәтижелер терезесінен толық есепті көре аласыз.</p>
    </div>
  </div>

  <script>
    const questions = [
      {
        q: "1. Массасы 4 кг арбаға 12 Н күш әсер етсе, ол қандай үдеу алады? (F = ma)",
        opts: ["3 м/с²", "48 м/с²", "0.33 м/с²", "8 м/с²"],
        ans: "3 м/с²",
        exp: "Ньютонның 2-заңы бойынша a = F / m = 12 Н / 4 кг = 3 м/с²."
      },
      {
        q: "2. Денеге басқа денелер әсер етпесе немесе әсері теңгерілсе, дене тыныштығын немесе бірқалыпты түзусызықты қозғалысын сақтайды. Бұл қай заң?",
        opts: ["Ньютонның 1-заңы (Инерция заңы)", "Ньютонның 2-заңы", "Ньютонның 3-заңы", "Бүкіләлемдік тартылыс заңы"],
        ans: "Ньютонның 1-заңы (Инерция заңы)",
        exp: "Бұл инерция құбылысын сипаттайтын Ньютонның бірінші заңы."
      },
      {
        q: "3. 'Әрекетке әрқашан тең және қарама-қарсы бағытталған қарсы әрекет бар' (F₁ = -F₂). Бұл қай заң?",
        opts: ["Ньютонның 3-заңы", "Паскаль заңы", "Гук заңы", "Архимед заңы"],
        ans: "Ньютонның 3-заңы",
        exp: "Екі дененің бір-біріне әсер ету күштері модулі бойынша тең және қарама-қарсы бағытталған."
      },
      {
        q: "4. Ауырлық күшінің формуласы қандай?",
        opts: ["F = mg", "F = kx", "F = μN", "F = ma²"],
        ans: "F = mg",
        exp: "Ауырлық күші масса мен еркін түсу үдеуінің көбейтіндісіне тең: F = mg."
      }
    ];

    let curIdx = 0;
    let score = 0;
    let mistakes = [];
    const startTime = Date.now();

    function renderQuestion() {
      const item = questions[curIdx];
      document.getElementById('q-text').textContent = item.q;
      const optsDiv = document.getElementById('opt-container');
      optsDiv.innerHTML = '';
      document.getElementById('feedback-box').style.display = 'none';
      document.getElementById('btn-next').style.display = 'none';

      item.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt, item);
        optsDiv.appendChild(btn);
      });
    }

    function checkAnswer(btn, chosen, item) {
      const allBtns = document.querySelectorAll('.opt-btn');
      allBtns.forEach(b => b.disabled = true);
      const fb = document.getElementById('feedback-box');
      fb.style.display = 'block';

      if (chosen === item.ans) {
        btn.classList.add('correct');
        score++;
        fb.style.background = '#dcfce7';
        fb.style.color = '#15803d';
        fb.innerHTML = '<strong>Дұрыс! 🎯</strong> ' + item.exp;
      } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
          if (b.textContent === item.ans) b.classList.add('correct');
        });
        mistakes.push({
          question: item.q,
          studentAnswer: chosen,
          correctAnswer: item.ans,
          explanation: item.exp,
          topic: "Динамика"
        });
        fb.style.background = '#fee2e2';
        fb.style.color = '#b91c1c';
        fb.innerHTML = '<strong>Қате!</strong> Дұрысы: <b>' + item.ans + '</b>. ' + item.exp;
      }

      document.getElementById('btn-next').style.display = 'block';
    }

    function nextQuestion() {
      curIdx++;
      if (curIdx < questions.length) {
        renderQuestion();
      } else {
        finishGame();
      }
    }

    function finishGame() {
      document.getElementById('quiz-screen').style.display = 'none';
      document.getElementById('res-screen').style.display = 'block';
      const pct = Math.round((score / questions.length) * 100);
      document.getElementById('final-pct').textContent = pct + '%';
      document.getElementById('final-stats').textContent = 'Нәтиже: ' + score + ' / ' + questions.length;

      const duration = Math.round((Date.now() - startTime) / 1000);

      if (window.reportResult) {
        window.reportResult({
          score: score,
          total: questions.length,
          percentage: pct,
          durationSec: duration,
          mistakes: mistakes
        });
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PHYSICS_GAME_RESULT',
          score: score,
          total: questions.length,
          percentage: pct,
          durationSec: duration,
          mistakes: mistakes
        }, '*');
      }
    }

    renderQuestion();
  </script>
</body>
</html>`;

const SAMPLE_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="UTF-8">
  <title>Физика ойын шаблоны</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #f8fafc; color: #1e293b; }
    .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    button { padding: 10px 20px; margin: 6px 0; display: block; width: 100%; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; text-align: left; font-size: 16px; }
    button:hover { background: #eff6ff; border-color: #3b82f6; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Сұрақ: Тізбектей жалғауда ток күші қалай өзгереді?</h2>
    <button onclick="answer(false, 'Тізбектей жалғауда ток күші барлық бөлікте бірдей болады: I = I₁ = I₂.')">А) Тармақтарға бөлінеді</button>
    <button onclick="answer(true, 'Өте дұрыс!')">Б) Барлық бөлігінде бірдей болады</button>
    <button onclick="answer(false, 'Кернеу ғана бөлінеді, ток күші бірдей қалады.')">В) Үнемі артып отырады</button>
    <div id="res" style="margin-top: 16px; font-weight: bold;"></div>  </div>

  <script>
    // Ойын біткен кезде осы функция нәтижені платформаға жібереді:
    function answer(isCorrect, explanation) {
      const score = isCorrect ? 1 : 0;
      const total = 1;
      const mistakes = isCorrect ? [] : [{
        question: "Тізбектей жалғауда ток күші қалай өзгереді?",
        studentAnswer: "Қате нұсқа",
        correctAnswer: "Барлық бөлігінде бірдей болады",
        explanation: explanation
      }];

      document.getElementById('res').innerText = isCorrect ? "Дұрыс! 👏" : "Қате! ❌";

      // Мұғалім платформасына нәтижені өткізу:
      if (window.reportResult) {
        window.reportResult({
          score: score,
          total: total,
          percentage: isCorrect ? 100 : 0,
          durationSec: 10,
          mistakes: mistakes
        });
      }
    }
  </script>
</body>
</html>`;

// Initialize files
function initializeDatabase() {
  const seedKinematicsFile = 'kinematics.html';
  const seedNewtonFile = 'newton.html';

  fs.writeFileSync(path.join(UPLOAD_DIR, seedKinematicsFile), SAMPLE_KINEMATICS_HTML, 'utf8');
  fs.writeFileSync(path.join(UPLOAD_DIR, seedNewtonFile), SAMPLE_NEWTON_HTML, 'utf8');

  if (!fs.existsSync(GAMES_FILE)) {
    const initialGames = [
      {
        id: 'game-kinematics-1',
        title: 'Кинематика: Жылдамдық пен Үдеу формулалары',
        description: 'Жылдамдық, уақыт, арақашықтық және еркін түсу үдеуіне арналған практикалық интерактивті тапсырмалар.',
        category: 'Кинематика',
        targetGrades: ['7', '8', '9'],
        fileName: seedKinematicsFile,
        originalName: 'kinematics_quiz.html',
        shareCode: 'KINEMA',
        deadline: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        playCount: 14,
        avgScore: 75
      },
      {
        id: 'game-newton-2',
        title: 'Ньютон заңдары және Күштер динамикасы',
        description: 'Инерция, күштер әрекеті, F=ma және ауырлық күші заңдарын бекітуге арналған тренажер.',
        category: 'Динамика',
        targetGrades: ['8', '9', '10'],
        fileName: seedNewtonFile,
        shareCode: 'NEWTON',
        deadline: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        playCount: 9,
        avgScore: 82
      }
    ];
    fs.writeFileSync(GAMES_FILE, JSON.stringify(initialGames, null, 2), 'utf8');
  }

  if (!fs.existsSync(ATTEMPTS_FILE)) {
    const initialAttempts = [
      {
        id: 'att-1',
        gameId: 'game-kinematics-1',
        gameTitle: 'Кинематика: Жылдамдық пен Үдеу формулалары',
        studentName: 'Айдос Серікұлы',
        className: '8 «А»',
        score: 4,
        total: 4,
        percentage: 100,
        durationSec: 85,
        mistakes: [],
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'att-2',
        gameId: 'game-kinematics-1',
        gameTitle: 'Кинематика: Жылдамдық пен Үдеу формулалары',
        studentName: 'Дана Қасымова',
        className: '8 «А»',
        score: 3,
        total: 4,
        percentage: 75,
        durationSec: 110,
        mistakes: [
          {
            question: "3. Түзусызықты бірқалыпты қозғалыста үдеу неге тең?",
            studentAnswer: "Тұрақты санға (a = const > 0)",
            correctAnswer: "Нөлге тең (a = 0)",
            explanation: "Бірқалыпты қозғалыста жылдамдық өзгермейді, сондықтан a = 0.",
            topic: "Кинематика"
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'att-3',
        gameId: 'game-newton-2',
        gameTitle: 'Ньютон заңдары және Күштер динамикасы',
        studentName: 'Нұрасыл Ерлан',
        className: '9 «Б»',
        score: 4,
        total: 4,
        percentage: 100,
        durationSec: 92,
        mistakes: [],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ];
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(initialAttempts, null, 2), 'utf8');
  }

  if (!fs.existsSync(CATEGORIES_FILE)) {
    const initialCategories = [
      { id: 'cat-1', name: 'Кинематика', description: 'Жылдамдық, үдеу, түзусызықты және қисықсызықты қозғалыс', grades: ['7', '8', '9', '10'], color: 'blue' },
      { id: 'cat-2', name: 'Динамика', description: 'Ньютон заңдары, күштер (ауырлық, серпімділік, үйкеліс)', grades: ['7', '8', '9', '10'], color: 'indigo' },
      { id: 'cat-3', name: 'Статика және Сақталу заңдары', description: 'Импульс, энергияның сақталу заңы, рычаг және моменттер', grades: ['8', '9', '10'], color: 'emerald' },
      { id: 'cat-4', name: 'Термодинамика және Молекулалық физика', description: 'Идеал газ күйі, жылу құбылыстары, фазалық ауысулар', grades: ['8', '10'], color: 'amber' },
      { id: 'cat-5', name: 'Электростатика және Тұрақты ток', description: 'Кулон заңы, Ом заңы, тізбектер, электр өрісі', grades: ['8', '10'], color: 'sky' },
      { id: 'cat-6', name: 'Магнетизм және Электромагниттік өріс', description: 'Лоренц күші, Ампер күші, магнит индукциясы', grades: ['9', '10', '11'], color: 'purple' },
      { id: 'cat-7', name: 'Оптика', description: 'Жарықтың шағылуы, сынуы, линзалар және интерференция', grades: ['8', '9', '11'], color: 'rose' },
      { id: 'cat-8', name: 'Атомдық және Ядролық физика', description: 'Атом құрылысы, фотоэффект, радиоактивтілік', grades: ['9', '11'], color: 'violet' },
      { id: 'cat-9', name: 'Астрофизика және Ғарыш', description: 'Аспан денелері, Күн жүйесі, гравитациялық тартылыс', grades: ['9', '11'], color: 'cyan' },
      { id: 'cat-10', name: 'Жалпы физика', description: 'Физикалық өлшем бірліктері, құралдар және ғылыми әдістер', grades: ['7', '8', '9', '10', '11'], color: 'slate' }
    ];
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(initialCategories, null, 2), 'utf8');
  }
}

initializeDatabase();

// Persistent storage
// Local development can continue using the JSON files in /data.
// On Vercel, durable state is stored in a private Vercel Blob store.
const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
const BLOB_ACCESS = 'private' as const;
const BLOB_DATA_PREFIX = 'fizgame/data/';
const BLOB_GAME_PREFIX = 'fizgame/games/';

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(stream).text();
}

async function readPersistentJson<T>(pathname: string, fallbackFile: string, fallback: T): Promise<T> {
  if (!BLOB_ENABLED) {
    try {
      return JSON.parse(fs.readFileSync(fallbackFile, 'utf8')) as T;
    } catch {
      return fallback;
    }
  }

  try {
    const result = await blobGet(pathname, { access: BLOB_ACCESS });
    if (result?.statusCode === 200 && result.stream) {
      return JSON.parse(await streamToText(result.stream)) as T;
    }
  } catch (error) {
    console.error('[BLOB READ]', pathname, error);
  }

  // First deployment: seed the Blob store from the repository's JSON files.
  try {
    let seed = fallback;
    if (fs.existsSync(fallbackFile)) {
      seed = JSON.parse(fs.readFileSync(fallbackFile, 'utf8')) as T;
    }
    await blobPut(pathname, JSON.stringify(seed, null, 2), {
      access: BLOB_ACCESS,
      contentType: 'application/json',
      allowOverwrite: true
    });
    return seed;
  } catch (error) {
    console.error('[BLOB SEED]', pathname, error);
    return fallback;
  }
}

async function writePersistentJson(pathname: string, fallbackFile: string, value: any): Promise<void> {
  if (!BLOB_ENABLED) {
    fs.writeFileSync(fallbackFile, JSON.stringify(value, null, 2), 'utf8');
    return;
  }

  await blobPut(pathname, JSON.stringify(value, null, 2), {
    access: BLOB_ACCESS,
    contentType: 'application/json',
    allowOverwrite: true
  });
}

async function getGames() {
  return await readPersistentJson<any[]>(BLOB_DATA_PREFIX + 'games.json', GAMES_FILE, []);
}

async function saveGames(games: any[]) {
  await writePersistentJson(BLOB_DATA_PREFIX + 'games.json', GAMES_FILE, games);
}

async function getCategories() {
  return await readPersistentJson<any[]>(BLOB_DATA_PREFIX + 'categories.json', CATEGORIES_FILE, []);
}

async function saveCategories(categories: any[]) {
  await writePersistentJson(BLOB_DATA_PREFIX + 'categories.json', CATEGORIES_FILE, categories);
}

async function getAttempts() {
  return await readPersistentJson<any[]>(BLOB_DATA_PREFIX + 'attempts.json', ATTEMPTS_FILE, []);
}

async function saveAttempts(attempts: any[]) {
  await writePersistentJson(BLOB_DATA_PREFIX + 'attempts.json', ATTEMPTS_FILE, attempts);
}

async function readGameHtml(blobPathname: string): Promise<string | null> {
  if (!BLOB_ENABLED) return null;
  if (!blobPathname.startsWith(BLOB_GAME_PREFIX)) return null;
  const result = await blobGet(blobPathname, { access: BLOB_ACCESS });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return await streamToText(result.stream);
}

// Multer storage for HTML files
const MAX_HTML_FILE_SIZE = 50 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    } catch (error) {
      cb(error as Error, UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    // Browser-provided filenames can contain non-ASCII characters. Keep the
    // extension, but normalize the rest so the file is safe on all platforms.
    const original = file.originalname || 'game.html';
    const ext = path.extname(original).toLowerCase();
    const base = path.basename(original, path.extname(original))
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}._-]+/gu, '_')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 120) || 'game';
    const safeExt = ext === '.htm' ? '.htm' : '.html';
    const unique = `${Date.now()}-${base}${safeExt}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_HTML_FILE_SIZE,
    fieldSize: MAX_HTML_FILE_SIZE,
    fields: 100
  },
  fileFilter: (req, file, cb) => {
    const originalName = (file.originalname || '').trim();
    const ext = path.extname(originalName).toLowerCase();
    const allowedExtension = ext === '.html' || ext === '.htm';

    // Browsers and Windows may report HTML as text/html, text/plain,
    // application/octet-stream, or an empty/unknown MIME type. The extension
    // is therefore the authoritative check for this endpoint.
    if (allowedExtension) {
      cb(null, true);
      return;
    }

    cb(new Error(
      `Тек HTML (.html, .htm) файлды жүктеуге болады. Таңдалған файл: ${originalName || 'атаусыз файл'}`
    ));
  }
});

const uploadSingleHtml = (req: any, res: any, next: any) => {
  if (!req.is('multipart/form-data')) {
    next();
    return;
  }

  upload.single('file')(req, res, (err: any) => {
    if (!err) {
      next();
      return;
    }

    console.error('[HTML UPLOAD] Multer error:', err);

    if (err instanceof multer.MulterError) {
      const messages: Record<string, string> = {
        LIMIT_FILE_SIZE: `HTML файл тым үлкен. Максималды өлшем: ${MAX_HTML_FILE_SIZE / 1024 / 1024} MB.`,
        LIMIT_FIELD_SIZE: 'HTML мәтіні тым үлкен.',
        LIMIT_UNEXPECTED_FILE: 'Файл өрісі дұрыс емес. HTML файлын «file» өрісі арқылы жіберу қажет.'
      };
      return res.status(err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FIELD_SIZE' ? 413 : 400)
        .json({ error: messages[err.code] || `Файлды жүктеу қатесі: ${err.message}` });
    }

    return res.status(400).json({
      error: err.message || 'HTML файлды жүктеу барысында қате шықты.'
    });
  });
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------


// Upload/API health check. This is intentionally simple so the UI can
// distinguish a real upload error from an unavailable backend.
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'fizgame',
    uploadReady: fs.existsSync(UPLOAD_DIR),
    blobStorageConfigured: BLOB_ENABLED,
    maxHtmlFileMb: MAX_HTML_FILE_SIZE / 1024 / 1024,
    vercel: Boolean(process.env.VERCEL)
  });
});

// Categories (Физика бөлімдері)
app.get('/api/categories', async (req, res) => {
  const cats = await getCategories();
  res.json(cats);
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, grades, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Бөлім атауы бос болмауы керек' });
    }
    const cleanName = name.trim();
    const cats = await getCategories();
    const existing = cats.find((c: any) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Бұл бөлім бұрыннан бар!' });
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      description: (description || '').trim(),
      grades: Array.isArray(grades) && grades.length ? grades : ['7', '8', '9', '10', '11'],
      color: color || 'blue'
    };
    cats.push(newCat);
    await await saveCategories(cats);
    res.json({ success: true, category: newCat });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Бөлімді қосу қатесі' });
  }
});

app.delete('/api/categories/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const cats = await getCategories();
    const filtered = cats.filter((c: any) => c.id !== identifier && c.name.toLowerCase() !== identifier.toLowerCase());
    await await saveCategories(filtered);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Бөлімді жою қатесі' });
  }
});

// 1. Get all active games (for student or catalog)
app.get('/api/games', async (req, res) => {
  const games = await getGames();
  res.json(games);
});

// 2. Get single game by ID or shareCode
app.get('/api/games/:query', async (req, res) => {
  const { query } = req.params;
  const games = await getGames();
  const game = games.find((g: any) => g.id === query || g.shareCode.toUpperCase() === query.toUpperCase());
  if (!game) {
    return res.status(404).json({ error: 'Сабақ табылмады!' });
  }
  res.json(game);
});

// 3. Vercel Blob client-upload token endpoint.
// The browser uploads the HTML directly to Blob, avoiding Vercel's 4.5 MB
// Function request-body limit. The actual game record is created separately.
app.post('/api/blob-upload', async (req, res) => {
  if (!BLOB_ENABLED) {
    return res.status(503).json({
      error: 'Vercel Blob бапталмаған. Vercel жобасының Storage бөлімінен Blob store қосыңыз.'
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname: string) => {
        const normalizedPath = String(pathname || '');
        const safeName = path.basename(normalizedPath).toLowerCase();
        if (!normalizedPath.startsWith(BLOB_GAME_PREFIX)) {
          throw new Error('Файл тек Fizgame ойындар қалтасына жүктелуі керек.');
        }
        if (!safeName.endsWith('.html') && !safeName.endsWith('.htm')) {
          throw new Error('Тек .html немесе .htm файл жүктеуге болады.');
        }

        return {
          allowedContentTypes: ['text/html', 'text/plain', 'application/octet-stream'],
          maximumSizeInBytes: MAX_HTML_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind: 'physics-game' })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('[BLOB UPLOAD COMPLETED]', blob.pathname);
      }
    });

    return res.json(jsonResponse);
  } catch (error: any) {
    console.error('[BLOB UPLOAD]', error);
    return res.status(400).json({ error: error.message || 'Blob жүктеу токенін жасау мүмкін болмады.' });
  }
});

// 4. Upload / Create new game
app.post('/api/games', uploadSingleHtml, async (req, res) => {
  try {
    const { title, description, category, targetGrades, deadline, htmlContent, blobPathname } = req.body;
    let fileName = '';
    let originalName = 'game.html';
    let storedBlobPath = '';

    if (blobPathname) {
      if (!BLOB_ENABLED) {
        return res.status(503).json({ error: 'Vercel Blob бапталмаған.' });
      }
      if (typeof blobPathname !== 'string' || !blobPathname.startsWith(BLOB_GAME_PREFIX)) {
        return res.status(400).json({ error: 'Жүктелген файлдың сақтау жолы жарамсыз.' });
      }

      const blobHtml = await readGameHtml(blobPathname);
      if (!blobHtml || !/<html[\s>]/i.test(blobHtml) && !/<body[\s>]/i.test(blobHtml)) {
        return res.status(400).json({ error: 'Жүктелген файл HTML құжатына ұқсамайды.' });
      }

      storedBlobPath = blobPathname;
      fileName = path.basename(blobPathname);
      originalName = path.basename(blobPathname);
    } else if (req.file) {
      fileName = req.file.filename;
      originalName = req.file.originalname || 'game.html';

      const uploadedPath = path.join(UPLOAD_DIR, fileName);
      if (!fs.existsSync(uploadedPath)) {
        return res.status(500).json({ error: 'HTML файл серверге қабылданды, бірақ сақтау кезінде табылмады.' });
      }

      // Reject empty files early and provide a useful error instead of creating
      // a broken game record.
      const uploadedSize = fs.statSync(uploadedPath).size;
      if (uploadedSize === 0) {
        fs.unlinkSync(uploadedPath);
        return res.status(400).json({ error: 'HTML файл бос болып тұр.' });
      }

      // Basic content validation. We intentionally do not require a specific
      // game framework: any valid HTML document is allowed.
      const uploadedContent = fs.readFileSync(uploadedPath, 'utf8');
      if (!/<html[\\s>]/i.test(uploadedContent) && !/<body[\\s>]/i.test(uploadedContent)) {
        fs.unlinkSync(uploadedPath);
        return res.status(400).json({ error: 'Файл HTML құжатына ұқсамайды. <html> немесе <body> тегі табылмады.' });
      }
    } else if (htmlContent && typeof htmlContent === 'string' && htmlContent.trim().length > 0) {
      fileName = `${Date.now()}-custom.html`;
      fs.writeFileSync(path.join(UPLOAD_DIR, fileName), htmlContent, 'utf8');
      originalName = 'custom.html';
    } else {
      return res.status(400).json({ error: 'HTML файл немесе HTML кодын енгізу қажет!' });
    }

    let detectedTitle = (title || '').trim();
    let detectedCategory = (category || 'Жалпы физика').trim();

    // Auto-detect title from HTML if not provided
    if (!detectedTitle) {
      let contentToInspect = '';
      if (storedBlobPath) {
        try {
          contentToInspect = await readGameHtml(storedBlobPath) || '';
        } catch(e) {}
      } else if (req.file) {
        try {
          contentToInspect = fs.readFileSync(path.join(UPLOAD_DIR, fileName), 'utf8');
        } catch(e) {}
      } else if (htmlContent) {
        contentToInspect = htmlContent;
      }

      if (contentToInspect) {
        const titleMatch = contentToInspect.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1].trim()) {
          detectedTitle = titleMatch[1].trim();
        }
      }

      if (!detectedTitle) {
        detectedTitle = originalName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') || 'Атаусыз физика ойыны';
      }
    }

    const games = await getGames();
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    let grades: string[] = [];
    if (Array.isArray(targetGrades)) {
      grades = targetGrades;
    } else if (typeof targetGrades === 'string' && targetGrades.length > 0) {
      try {
        grades = JSON.parse(targetGrades);
      } catch {
        grades = targetGrades.split(',').map(s => s.trim());
      }
    }

    const newGame = {
      id: `game-${Date.now()}`,
      title: detectedTitle,
      description: description || '',
      category: detectedCategory,
      targetGrades: grades.length ? grades : ['7', '8', '9', '10', '11'],
      fileName,
      originalName,
      blobPathname: storedBlobPath || null,
      shareCode,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      isActive: true,
      createdAt: new Date().toISOString(),
      playCount: 0,
      avgScore: 0
    };

    games.unshift(newGame);
    await await saveGames(games);

    res.json({ success: true, game: newGame });
  } catch (error: any) {
    console.error('Error uploading game:', error);
    res.status(500).json({ error: error.message || 'Ойынды сақтауда қате орын алды' });
  }
});

// 4. Update game settings
app.put('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  const games = await getGames();
  const index = games.findIndex((g: any) => g.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ойын табылмады' });
  }

  const { title, description, category, targetGrades, deadline, isActive } = req.body;
  if (title !== undefined) games[index].title = title;
  if (description !== undefined) games[index].description = description;
  if (category !== undefined) games[index].category = category;  if (targetGrades !== undefined) games[index].targetGrades = targetGrades;
  if (deadline !== undefined) games[index].deadline = deadline;
  if (isActive !== undefined) games[index].isActive = Boolean(isActive);

  await saveGames(games);
  res.json({ success: true, game: games[index] });
});

// 5. Delete game
app.delete('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  const games = await getGames();
  const index = games.findIndex((g: any) => g.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Ойын табылмады' });
  }

  const removed = games.splice(index, 1)[0];
  await saveGames(games);

  // optionally remove file
  if (removed.blobPathname && BLOB_ENABLED) {
    try {
      await blobDelete(removed.blobPathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (e) {
      console.error('Could not delete Blob game file:', e);
    }
  }

  const filePath = path.join(UPLOAD_DIR, removed.fileName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Could not delete file:', e);
    }
  }

  res.json({ success: true });
});

// 6. Serve HTML game for iframe with injected Universal Bridge
app.get('/api/play/:id', async (req, res) => {
  const { id } = req.params;
  const games = await getGames();
  const game = games.find((g: any) => g.id === id || g.shareCode.toUpperCase() === id.toUpperCase());

  if (!game) {
    return res.status(404).send('<h2>Сабақ табылмады</h2>');
  }

  let htmlContent = '';

  if (game.blobPathname && BLOB_ENABLED) {
    htmlContent = await readGameHtml(game.blobPathname) || '';
  } else {
    const filePath = path.join(UPLOAD_DIR, game.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('<h2>Ойын файлы табылмады</h2>');
    }
    htmlContent = fs.readFileSync(filePath, 'utf8');
  }

  if (!htmlContent) {
    return res.status(404).send('<h2>Ойын файлы табылмады</h2>');
  }

  // Universal Bridge script injected into <head> or at the top
  const bridgeScript = `
  <script>
    (function() {
      // Universal Bridge for AI Studio Physics Platform
      window.reportResult = function(data) {
        try {
          window.parent.postMessage({
            type: 'PHYSICS_GAME_RESULT',
            score: data.score || 0,
            total: data.total || 1,
            percentage: data.percentage !== undefined ? data.percentage : Math.round(((data.score || 0) / (data.total || 1)) * 100),
            durationSec: data.durationSec || 0,
            mistakes: data.mistakes || []
          }, '*');
        } catch(e) {
          console.error('Failed to post result message:', e);
        }
      };

      // Expose to global
      window.physicsBridge = {
        submit: window.reportResult
      };
    })();
  </script>
  `;

  if (htmlContent.includes('<head>')) {
    htmlContent = htmlContent.replace('<head>', `<head>${bridgeScript}`);
  } else {
    htmlContent = bridgeScript + htmlContent;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlContent);
});

// 7. Record student attempt
app.post('/api/attempts', async (req, res) => {
  try {
    const { gameId, studentName, className, score, total, percentage, durationSec, mistakes } = req.body;

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ error: 'Оқушының аты-жөнін жазу қажет!' });
    }

    const games = await getGames();
    const game = games.find((g: any) => g.id === gameId);
    const gameTitle = game ? game.title : 'Физика ойыны';

    const cleanScore = Number(score) || 0;
    const cleanTotal = Number(total) || 1;
    const cleanPct = percentage !== undefined ? Math.round(Number(percentage)) : Math.round((cleanScore / cleanTotal) * 100);

    const attempts = await getAttempts();
    const newAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      gameId,
      gameTitle,
      studentName: studentName.trim(),
      className: className ? className.trim() : '',
      score: cleanScore,
      total: cleanTotal,
      percentage: cleanPct,
      durationSec: Number(durationSec) || 0,
      mistakes: Array.isArray(mistakes) ? mistakes : [],
      createdAt: new Date().toISOString()
    };

    attempts.unshift(newAttempt);
    await await saveAttempts(attempts);

    // Update play count & average score on game
    if (game) {
      const gameAttempts = attempts.filter((a: any) => a.gameId === gameId);
      game.playCount = gameAttempts.length;
      const totalPct = gameAttempts.reduce((acc: number, cur: any) => acc + (cur.percentage || 0), 0);
      game.avgScore = Math.round(totalPct / gameAttempts.length);
      await saveGames(games);
    }

    res.json({ success: true, attempt: newAttempt });
  } catch (error: any) {
    console.error('Error saving attempt:', error);
    res.status(500).json({ error: error.message || 'Нәтижені сақтау сәтсіз аяқталды' });
  }
});

// 8. Get attempts list with filters
app.get('/api/attempts', async (req, res) => {
  const { gameId, studentName, className } = req.query;
  let attempts = await getAttempts();

  if (gameId) {
    attempts = attempts.filter((a: any) => a.gameId === gameId);
  }
  if (studentName) {
    const q = String(studentName).toLowerCase().trim();
    attempts = attempts.filter((a: any) => a.studentName.toLowerCase().includes(q));
  }
  if (className) {
    const c = String(className).trim();
    attempts = attempts.filter((a: any) => a.className === c);
  }

  res.json(attempts);
});

// 9. Get single attempt details
app.get('/api/attempts/:id', async (req, res) => {
  const { id } = req.params;
  const attempts = await getAttempts();
  const attempt = attempts.find((a: any) => a.id === id);
  if (!attempt) {
    return res.status(404).json({ error: 'Нәтиже табылмады' });
  }
  res.json(attempt);
});

// 10. Overall Dashboard Stats
app.get('/api/stats', async (req, res) => {
  const games = await getGames();
  const attempts = await getAttempts();

  const uniqueStudents = new Set(attempts.map((a: any) => `${a.studentName}_${a.className || ''}`)).size;
  const avgPct = attempts.length
    ? Math.round(attempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / attempts.length)
    : 0;

  res.json({
    totalGames: games.length,
    totalAttempts: attempts.length,
    avgPercentage: avgPct,
    totalStudents: uniqueStudents
  });
});

// 11. QR Code generator endpoint
app.get('/api/qrcode', async (req, res) => {
  try {
    const text = (req.query.text as string) || '';
    if (!text) {
      return res.status(400).json({ error: 'Мәтін немесе URL қажет' });
    }
    const qrDataUrl = await QRCode.toDataURL(text, {
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    res.json({ qrDataUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Export to CSV for Excel
app.get('/api/export/csv', async (req, res) => {
  const { gameId } = req.query;
  let attempts = await getAttempts();
  if (gameId) {
    attempts = attempts.filter((a: any) => a.gameId === gameId);
  }

  let csv = '\uFEFF'; // UTF-8 BOM for Excel in Kazakh/Russian
  csv += 'ID,Ойын атауы,Оқушы аты-жөні,Сыныбы,Балл,Жалпы сұрақ,Пайыз (%),Уақыт (сек),Қателер саны,Тапсырған күні\n';

  attempts.forEach((a: any) => {
    const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    const mistakesCount = (a.mistakes && a.mistakes.length) || 0;
    const dateFormatted = new Date(a.createdAt).toLocaleString('kk-KZ');

    csv += [
      escapeCsv(a.id),
      escapeCsv(a.gameTitle),
      escapeCsv(a.studentName),
      escapeCsv(a.className || 'Көрсетілмеген'),
      a.score,
      a.total,
      `${a.percentage}%`,
      a.durationSec,
      mistakesCount,
      escapeCsv(dateFormatted)
    ].join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="physics_results_${Date.now()}.csv"`);
  res.send(csv);
});

// 13. Download starter HTML template
app.get('/api/template/html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="physics_game_template.html"');
  res.send(SAMPLE_TEMPLATE_HTML);
});

// Explicit 404 for unknown /api/* routes so it never returns Vite SPA index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Сұралған API маршруты табылмады: ${req.method} ${req.originalUrl}` });
});

// Global error handler for API
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled server error:', err);
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      error: err.message || 'Серверде ішкі қате орын алды'
    });
  }
  next(err);
});

// ----------------------------------------------------
// FRONTEND MOUNTING (Vite in Dev / Static in Prod)
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Физика әлемі сервері қосылды: http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}