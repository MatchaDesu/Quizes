const params = new URLSearchParams(window.location.search)
const part = params.get("part")

const title = document.getElementById("quiz-title");
const questionText = document.getElementById("quiz-question");
const questionList = document.getElementById("quiz-list");
const questionImage = document.getElementById("quiz-img");

const buttonBox = document.getElementById("button-box");
const numBox = document.getElementById("number-selection-box");

const shuffle = arr => arr.sort(() => Math.random() - 0.5);

let questions = []
let current = 0
let answers = {}

async function initQuiz() {
    if (!part) {
        alert("ไม่พบประเภทข้อสอบ")
        return
    }

    const res = await fetch(`data/quiz/${part}.json`)
    const data = await res.json()

    questions = data.questions
    shuffle(questions);

    renderQuiz()
}

function renderQuiz() {
    const q = questions[current]

    title.innerText = `ข้อที่ ${current + 1}`
    questionText.innerText = q.question + (q.multi ? " (ตอบได้หลายคำตอบ)" : "");

    questionImage.src = q.img ? q.img : "";

    questionList.innerHTML = ""

    const inputType = q.multi ? "checkbox" : "radio"

    q.choices.forEach((choice, i) => {
        const checked = q.multi
            ? answers[current]?.includes(i) ? "checked" : ""
            : answers[current] === i ? "checked" : ""

        questionList.innerHTML += `
      <label class="quiz-box">
        ${String.fromCharCode(65 + i)}
        <input
          type="${inputType}"
          name="question-${current}"
          value="${i}"
          ${checked}
        >
        <span>${choice.text}</span>
      </label>
    `
    })

    renderNumber()
    renderBtn()
}

function renderNumber() {
    numBox.innerHTML = ``;

    for (let i = 0; i < questions.length; i++) {
        const isCurrent = i === current;
        const isAnswered = answers[i] !== undefined;

        let className = "number-btn";
        if (isAnswered) className += " answered";
        if (isCurrent) className += " active";

        numBox.innerHTML += `
            <button
                type="button"
                class="${className}"
                onclick="jumpTo(${i})"
            >
                ${i + 1}
            </button>
        `;
    }
}

function renderBtn() {
    buttonBox.innerHTML = ``

    if (current > 0) {
        buttonBox.innerHTML += `<button type="button" onclick="prevQuestion()">ข้อก่อนหน้า</button>`;
    }
    if (current < questions.length - 1) {
        buttonBox.innerHTML += `<button type="button" onclick="nextQuestion()">ข้อถัดไป</button>`;
    }

    if (current === questions.length - 1) {
        buttonBox.innerHTML += `<button type="button" onclick="submitQuiz()" class="highlight-button" >ส่งคำตอบ</button>`;
    }
}

function nextQuestion() {
    saveAnswer()
    if (current < questions.length - 1) {
        current++
        renderQuiz()
    }
}

function prevQuestion() {
    saveAnswer()
    if (current > 0) {
        current--
        renderQuiz()
    }
}

function jumpTo(i) {
    saveAnswer()
    current = i
    renderQuiz()
}

function saveAnswer() {
    const q = questions[current]

    if (q.multi) {
        const checked = document.querySelectorAll(
            `input[name="question-${current}"]:checked`
        )

        if (checked.length > 0) {
            answers[current] = [...checked].map(c => Number(c.value))
        } else {
            delete answers[current]
        }

    } else {
        const checked = document.querySelector(
            `input[name="question-${current}"]:checked`
        )

        if (checked) {
            answers[current] = Number(checked.value)
        } else {
            delete answers[current]
        }
    }
}

function submitQuiz() {
    saveAnswer()

    let score = 0

    questions.forEach((q, i) => {
        if (q.multi) {
            const correctIndexes = q.choices
                .map((c, idx) => c.correct ? idx : null)
                .filter(v => v !== null)

            const userAnswers = answers[i] || []

            const isCorrect =
                userAnswers.length === correctIndexes.length &&
                correctIndexes.every(idx => userAnswers.includes(idx))

            if (isCorrect) score++
        } else {
            if (q.choices[answers[i]]?.correct) {
                score++
            }
        }
    })

    document.body.innerHTML = `
    <div class="result-container">
      <h1>สรุปผลคะแนน</h1>
      <p class="score">${score}/${questions.length}</p>
      <button onclick="renderReview()">ดูเฉลย</button>
      <button onclick="location.reload()">ทำใหม่อีกครั้ง</button>
    </div>
  `
}

function renderReview() {

    // ล้างหน้าแล้วสร้าง review box
    document.body.innerHTML = `<div id="review-box"></div>`;
    const reviewBox = document.getElementById("review-box");

    reviewBox.innerHTML = `<h1>เฉลยข้อสอบ</h1>`;

    questions.forEach((q, i) => {
        const userAnswer = answers[i]; // undefined = ไม่ตอบ
        let html = "";

        html += `
        <div class="review-question">
            <h2>ข้อ ${i + 1}: ${q.question}</h2>
        `;

        // ถ้าไม่ได้ตอบ
        if (userAnswer === undefined) {
            html += `<p class="not-answered">❗ ข้อนี้ไม่ได้ตอบ</p>`;
        }

        if (userAnswer !== undefined) {
            const userText = q.multi
                ? userAnswer.map(i =>
                    `${String.fromCharCode(65 + i)}. ${q.choices[i].text}`
                ).join(", ")
                : `${String.fromCharCode(65 + userAnswer)}. ${q.choices[userAnswer].text}`;

            html += `<p class="user-answer">📝 คุณตอบ: ${userText}</p>`;
        }

        q.choices.forEach((c, idx) => {
            let className = "review-choice";

            const isSelected = q.multi
                ? Array.isArray(userAnswer) && userAnswer.includes(idx)
                : userAnswer === idx;

            if (isSelected) className += " selected";

            if (c.correct) className += " correct";
            if (isSelected && !c.correct) className += " wrong";

            html += `
            <div class="${className}">
                <p>${String.fromCharCode(65 + idx)}. ${c.text}</p>
            </div>
            `;
        });

        let isCorrect = false;

        if (userAnswer !== undefined) {
            isCorrect = q.multi
                ? userAnswer.length === q.choices.filter(c => c.correct).length &&
                userAnswer.every(a => q.choices[a]?.correct)
                : q.choices[userAnswer]?.correct === true;
        }

        // แสดงเฉลยถ้าผิดหรือไม่ตอบ
        if (!isCorrect) {
            const correctText = q.choices
                .map((c, idx) =>
                    c.correct
                        ? `${String.fromCharCode(65 + idx)}. ${c.text}`
                        : null
                )
                .filter(Boolean)
                .join(", ");

            html += `<p class="correct-text">✔ คำตอบที่ถูก: ${correctText}</p>`;
        }
        
        html += `</div>`;
        reviewBox.innerHTML += html;
    });

    reviewBox.innerHTML += `<button onclick="location.reload()">ทำใหม่อีกครั้ง</button>`;
}



initQuiz()