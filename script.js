// 퀴즈 데이터 (외부 JSON 파일에서 로드)
let quizData = null;

// 게임 상태
let shuffledQuestions = [];
let currentIndex = 0;
let score = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let isAnswering = false;

// 오디오 컨텍스트 (효과음용)
let audioContext;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    if (!audioContext) initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'correct') {
        // 정답 효과음: 상승하는 음
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    } else {
        // 오답 효과음: 하강하는 음
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

function playFanfare() {
    if (!audioContext) initAudio();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);

        oscillator.start(audioContext.currentTime + i * 0.15);
        oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3);
    });
}

// 배열 섞기 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function startQuiz() {
    initAudio();

    // OX 문제와 객관식 문제 분리
    const oxQuestions = quizData.questions.filter(q => q.type === 'OX');
    const multipleQuestions = quizData.questions.filter(q => q.type === 'MULTIPLE');

    // 각각 랜덤으로 섞은 후 OX 먼저, 객관식 나중에 합치기
    shuffledQuestions = [...shuffleArray(oxQuestions), ...shuffleArray(multipleQuestions)];

    currentIndex = 0;
    score = 0;
    correctAnswers = 0;
    wrongAnswers = 0;

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'block';
    document.getElementById('resultScreen').style.display = 'none';

    showQuestion();
}

function showQuestion() {
    const question = shuffledQuestions[currentIndex];

    // 진행률 업데이트
    const progress = ((currentIndex) / shuffledQuestions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // 문제 번호 및 점수
    document.getElementById('questionNumber').textContent = `${currentIndex + 1} / ${shuffledQuestions.length}`;
    document.getElementById('scoreDisplay').textContent = `점수: ${score}`;

    // 문제 타입
    document.getElementById('questionType').textContent = question.type === 'OX' ? 'OX 퀴즈' : '4지선다';

    // 문제 텍스트
    document.getElementById('questionText').textContent = question.question;

    // 모든 버튼 selected 클래스 리셋
    document.querySelectorAll('.ox-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));

    // 힌트 리셋
    document.getElementById('hintBtn').disabled = false;
    document.getElementById('hintBtn').textContent = '힌트 보기 💡';
    document.getElementById('hintText').classList.remove('show');
    document.getElementById('hintText').textContent = '';

    // 버튼 표시 전환
    if (question.type === 'OX') {
        document.getElementById('oxButtons').style.display = 'flex';
        document.getElementById('multipleButtons').style.display = 'none';
    } else {
        document.getElementById('oxButtons').style.display = 'none';
        document.getElementById('multipleButtons').style.display = 'grid';

        // 선택지 텍스트 업데이트
        const optionTexts = document.querySelectorAll('.option-text');
        question.options.forEach((option, index) => {
            optionTexts[index].textContent = option;
        });
    }
}

function showHint() {
    const question = shuffledQuestions[currentIndex];
    const hintBtn = document.getElementById('hintBtn');
    const hintText = document.getElementById('hintText');

    if (question.hint) {
        hintText.textContent = question.hint;
        hintText.classList.add('show');
        hintBtn.disabled = true;
        hintBtn.textContent = '힌트 사용됨 ✓';
    }
}

function checkAnswer(userAnswer) {
    if (isAnswering) return;
    isAnswering = true;

    const question = shuffledQuestions[currentIndex];
    const isCorrect = userAnswer === question.answer;

    // 클릭한 버튼에 selected 클래스 추가
    if (question.type === 'OX') {
        const oxBtns = document.querySelectorAll('.ox-btn');
        oxBtns.forEach(btn => btn.classList.remove('selected'));
        oxBtns[userAnswer - 1].classList.add('selected');
    } else {
        const optionBtns = document.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => btn.classList.remove('selected'));
        optionBtns[userAnswer - 1].classList.add('selected');
    }

    const overlay = document.getElementById('feedbackOverlay');
    const emoji = document.getElementById('feedbackEmoji');
    const text = document.getElementById('feedbackText');
    const answerText = document.getElementById('feedbackAnswer');

    if (isCorrect) {
        score += Math.round(100 / shuffledQuestions.length);
        correctAnswers++;

        overlay.className = 'feedback-overlay correct';
        emoji.textContent = ['🎉', '👏', '⭐', '🌟', '💚'][Math.floor(Math.random() * 5)];
        text.textContent = ['정답이에요!', '잘했어요!', '훌륭해요!', '멋져요!', '최고예요!'][Math.floor(Math.random() * 5)];
        answerText.textContent = '';

        playSound('correct');
    } else {
        wrongAnswers++;

        overlay.className = 'feedback-overlay wrong';
        emoji.textContent = ['😢', '💪', '🤔'][Math.floor(Math.random() * 3)];
        text.textContent = ['아쉬워요!', '다음엔 맞춰봐요!', '괜찮아요!'][Math.floor(Math.random() * 3)];

        // 정답 표시
        if (question.type === 'OX') {
            answerText.textContent = `정답은 "${question.answer === 1 ? 'O' : 'X'}" 이에요`;
        } else {
            answerText.textContent = `정답은 "${question.options[question.answer - 1]}" 이에요`;
        }

        playSound('wrong');
    }

    overlay.style.display = 'flex';

    // 다음 문제로 이동
    setTimeout(() => {
        overlay.style.display = 'none';
        isAnswering = false;

        currentIndex++;
        if (currentIndex < shuffledQuestions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }, 1500);
}

function showResult() {
    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'block';

    const finalScore = Math.round((correctAnswers / shuffledQuestions.length) * 100);
    document.getElementById('resultScore').textContent = finalScore + '점';
    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('wrongCount').textContent = wrongAnswers;

    let emoji, message;
    if (finalScore >= 90) {
        emoji = '🏆';
        message = '환경 박사예요! 정말 대단해요!';
    } else if (finalScore >= 70) {
        emoji = '🌟';
        message = '잘했어요! 환경을 잘 알고 있네요!';
    } else if (finalScore >= 50) {
        emoji = '💪';
        message = '좋아요! 조금 더 연습해봐요!';
    } else {
        emoji = '🌱';
        message = '괜찮아요! 다시 도전해봐요!';
    }

    document.getElementById('resultEmoji').textContent = emoji;
    document.getElementById('resultMessage').textContent = message;

    playFanfare();
}

function restartQuiz() {
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
}

// JSON 파일 로드
async function loadQuizData() {
    try {
        const response = await fetch('quiz-data.json');
        if (!response.ok) {
            throw new Error('퀴즈 데이터를 불러올 수 없습니다.');
        }
        quizData = await response.json();

        // 총 문제 수 업데이트
        document.querySelector('.start-screen p').innerHTML =
            `환경을 지키는 방법을 배워볼까요?<br>총 ${quizData.total}문제가 준비되어 있어요!`;
        document.querySelector('.start-screen h1').textContent = quizData.title;
    } catch (error) {
        console.error('퀴즈 데이터 로드 실패:', error);
        alert('퀴즈 데이터를 불러오는데 실패했습니다. 페이지를 새로고침 해주세요.');
    }
}

// 페이지 로드 시 퀴즈 데이터 로드
window.addEventListener('DOMContentLoaded', loadQuizData);
