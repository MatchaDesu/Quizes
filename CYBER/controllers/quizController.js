const params = new URLSearchParams(window.location.search)
const part = params.get("part")

const SHEET_ID = "1gfWRXnG7KtR4Q-Gfh7tQSsX-AEx-vITrrT2xdP7dtic"

const title = document.getElementById("quiz-title");
const questionText = document.getElementById("quiz-question");
const questionList = document.getElementById("quiz-list");
const questionImage = document.getElementById("quiz-img");

const numBox = document.getElementById("number-selection-box");

let questions = []
let current = 0
let answers = {}
let isAnswer = false

async function initQuiz() {
    if (!part) {
        alert("ไม่พบประเภทข้อสอบ")
        return
    }

    const qUrl = `https://opensheet.elk.sh/${SHEET_ID}/question`
    const cUrl = `https://opensheet.elk.sh/${SHEET_ID}/choices`

    const [qRes, cRes] = await Promise.all([
        fetch(qUrl),
        fetch(cUrl)
    ])

    const qData = await qRes.json()
    const cData = await cRes.json()

    questions = buildQuestions(qData, cData)

    renderQuiz()
}

function buildQuestions(qData, cData) {
    return qData.map(q => ({
        question: q.question,
        img: q.img || null,
        multi: q.multi === "TRUE",
        choices: cData
            .filter(c => c.qid === q.qid)
            .map(c => ({
                text: c.text,
                correct: c.correct === "TRUE"
            }))
    }))
}

function renderQuiz() {
    const q = questions[current]

    isAnswer = false
    questionList.classList.remove("answer-mode");

    title.innerText = `ข้อที่ ${current + 1}`
    questionText.innerText = q.question + (q.multi ? " (ตอบได้หลายคำตอบ)" : "");

    if (q.img) {
        questionImage.src = q.img;
        questionImage.style.visibility = "visible";
    }
    else {
        questionImage.style.visibility = "hidden";
    }

    questionList.innerHTML = ""

    const inputType = q.multi ? "checkbox" : "radio"

    q.choices.forEach((choice, i) => {
        const checked = q.multi
            ? answers[current]?.includes(i) ? "checked" : ""
            : answers[current] === i ? "checked" : ""

        const isCorrect = choice.correct ? "is-correct" : "";

        questionList.innerHTML += `
      <label class="quiz-box ${isCorrect}">
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
    

function showAns() {
    isAnswer = !isAnswer;
    questionList.classList.toggle("answer-mode", isAnswer);
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

function renderNumber() {
    numBox.innerHTML = ``;

    for (let i = 0; i < questions.length; i++) {
        const isCurrent = i === current;

        let className = "number-btn";
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
    document.getElementById("prev-button").style.visibility = "hidden";
    document.getElementById("next-button").style.visibility = "hidden";

    if (current > 0) {
        document.getElementById("prev-button").style.visibility = "visible";
    }
    if (current < questions.length - 1) {
        document.getElementById("next-button").style.visibility = "visible";
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

initQuiz()