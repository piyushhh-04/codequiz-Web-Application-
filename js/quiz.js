// Main Quiz Application
class QuizApp {
    constructor() {
        // State
        this.currentSubject = '';
        this.allQuestions = [];
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 30;
        this.startTime = null;
        this.totalTime = 0;
        this.selectedOption = null;
        
        // DOM Elements
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.learningScreen = document.getElementById('learning-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.scoreboardScreen = document.getElementById('scoreboard-screen');
        this.subjectsGrid = document.querySelector('.subjects-grid');
        
        // Initialize
        this.init();
    }
    
    init() {
        this.loadSubjects();
        this.setupEventListeners();
    }
    
    loadSubjects() {
        // Clear grid
        this.subjectsGrid.innerHTML = '';
        
        // Load subjects from quizData
        Object.keys(quizData).forEach(subject => {
            const card = this.createSubjectCard(subject);
            this.subjectsGrid.appendChild(card);
        });
    }
    
    createSubjectCard(subject) {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.dataset.subject = subject;
        
        const icon = document.createElement('i');
        icon.className = subjectIcons[subject] || 'fas fa-code';
        
        const title = document.createElement('h3');
        title.textContent = subjectNames[subject] || subject;
        
        const count = document.createElement('p');
        count.textContent = subjectDescriptions[subject] || '30 Questions';
        
        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(count);
        
        card.addEventListener('click', () => this.startQuiz(subject));
        
        return card;
    }
    
    setupEventListeners() {
        // Back button (quiz screen)
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showBackDialog();
        });
        
        // Back button (learning screen)
        document.getElementById('learning-back-btn').addEventListener('click', () => {
            this.showWelcomeScreen();
        });
        
        // Start quiz button (learning screen)
        document.getElementById('start-quiz-btn').addEventListener('click', () => {
            this.showQuizScreen();
        });
        
        // Play again button
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.startQuiz(this.currentSubject);
        });
        
        // New subject button
        document.getElementById('new-subject-btn').addEventListener('click', () => {
            this.showWelcomeScreen();
        });
    }
    
    showBackDialog() {
        dialog.confirm({
            title: 'Go Back?',
            message: 'Are you sure you want to go back? Your progress will be lost.',
            onConfirm: (confirmed) => {
                if (confirmed) {
                    this.showWelcomeScreen();
                }
            }
        });
    }
    
    startQuiz(subject) {
        // Reset state
        this.currentSubject = subject;
        this.allQuestions = quizData[subject];
        
        // Select random 10 questions from 30
        this.questions = this.getRandomQuestions(10);
        this.currentQuestionIndex = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.score = 0;
        this.totalTime = 0;
        
        // Reset chat history
        this.chatHistory = [];
        
        // Update UI
        document.getElementById('current-subject').textContent = subjectNames[subject];
        document.getElementById('learning-subject').textContent = subjectNames[subject];
        this.updateScoreDisplay();
        
        // Show learning screen (chat)
        this.showLearningScreen();
    }
    
    showLearningScreen() {
        // Switch to learning screen
        this.welcomeScreen.classList.remove('active');
        this.quizScreen.classList.remove('active');
        this.scoreboardScreen.classList.remove('active');
        this.learningScreen.classList.add('active');
        
        // Clear chat messages and show welcome
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // Add AI welcome message
        this.addChatBubble('ai', `<p>Hi! I'm your <strong>AI Tutor</strong> for <strong>${subjectNames[this.currentSubject]}</strong>. 🤖</p><p>You can ask me anything about this topic, or use the quick buttons below to get started. When you're ready, hit <strong>Start Quiz</strong>!</p>`);
        
        // Show quick prompts
        document.getElementById('quick-prompts').style.display = 'flex';
        
        // Setup chat input
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        chatInput.value = '';
        sendBtn.disabled = false;
        
        // Remove old listeners by cloning
        const newInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newInput, chatInput);
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        // Send on Enter key
        newInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
        
        // Send on button click
        newSendBtn.addEventListener('click', () => this.sendChatMessage());
        
        // Quick prompt buttons
        document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                document.getElementById('chat-input').value = newBtn.dataset.prompt;
                this.sendChatMessage();
            });
        });
    }
    
    addChatBubble(role, html) {
        const chatMessages = document.getElementById('chat-messages');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;
        
        if (role === 'ai') {
            bubble.innerHTML = `<div class="bubble-label"><i class="fas fa-robot"></i> AI Tutor</div>${html}`;
        } else {
            bubble.textContent = html;
        }
        
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    }
    
    addThinkingBubble() {
        const chatMessages = document.getElementById('chat-messages');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ai thinking';
        bubble.id = 'thinking-bubble';
        bubble.innerHTML = `<div class="bubble-label"><i class="fas fa-robot"></i> AI Tutor</div><div class="thinking-dots"><span></span><span></span><span></span></div>`;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    }
    
    removeThinkingBubble() {
        const thinking = document.getElementById('thinking-bubble');
        if (thinking) thinking.remove();
    }
    
    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to UI
        this.addChatBubble('user', message);
        input.value = '';
        sendBtn.disabled = true;
        
        // Hide quick prompts after first message
        document.getElementById('quick-prompts').style.display = 'none';
        
        // Add to history
        this.chatHistory.push({ role: 'user', text: message });
        
        // Show thinking indicator
        this.addThinkingBubble();
        
        try {
            const response = await fetch('http://localhost:5500/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subjectNames[this.currentSubject] || this.currentSubject,
                    questions: this.questions.map(q => ({ question: q.question })),
                    history: this.chatHistory
                })
            });
            
            const data = await response.json();
            this.removeThinkingBubble();
            
            if (data.reply) {
                this.addChatBubble('ai', data.reply);
                this.chatHistory.push({ role: 'model', text: data.reply });
            } else {
                this.addChatBubble('ai', '<p>Sorry, something went wrong. Try asking again!</p>');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.removeThinkingBubble();
            this.addChatBubble('ai', '<p>Could not reach the AI server. Make sure it\'s running!</p>');
        }
        
        sendBtn.disabled = false;
        input.focus();
    }
    
    showQuizScreen() {
        this.learningScreen.classList.remove('active');
        this.quizScreen.classList.add('active');
        
        // Load first question
        this.loadQuestion();
    }
    
    getRandomQuestions(count) {
        // Create a copy of all questions and shuffle
        const shuffled = [...this.allQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Return first 'count' questions
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    loadQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showScoreboard();
            return;
        }
        
        this.resetTimer();
        this.selectedOption = null;
        
        const question = this.questions[this.currentQuestionIndex];
        document.getElementById('question-text').textContent = question.question;
        
        // Load options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionBtn = document.createElement('div');
            optionBtn.className = 'option-btn';
            optionBtn.textContent = option;
            optionBtn.dataset.index = index;
            optionBtn.addEventListener('click', () => this.selectOption(index));
            optionsContainer.appendChild(optionBtn);
        });
        
        // Update counter
        document.getElementById('question-counter').textContent = 
            `Question ${this.currentQuestionIndex + 1}/${this.questions.length}`;
        
        // Update progress
        this.updateProgress();
        
        // Start timer
        this.startTimer();
    }
    
    selectOption(index) {
        if (this.selectedOption !== null) return;
        
        this.selectedOption = index;
        const question = this.questions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option-btn');
        
        // Disable all options
        options.forEach(option => option.classList.add('disabled'));
        
        // Show correct/incorrect
        options.forEach((option, i) => {
            if (i === question.correct) {
                option.classList.add('correct');
            } else if (i === index && i !== question.correct) {
                option.classList.add('wrong');
            }
        });
        
        // Update scores (+10 for correct, -5 for wrong)
        if (index === question.correct) {
            this.correctCount++;
            this.score += 10;
        } else {
            this.wrongCount++;
            this.score -= 5;
        }
        
        this.updateScoreDisplay();
        
        // Clear timer
        clearInterval(this.timer);
        
        // Auto move to next question after 1.5 seconds
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }
    
    nextQuestion() {
        this.totalTime += (30 - this.timeLeft);
        this.currentQuestionIndex++;
        this.loadQuestion();
    }
    
    startTimer() {
        this.timeLeft = 30;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                
                if (this.selectedOption === null) {
                    // Time's up - auto mark as wrong
                    const question = this.questions[this.currentQuestionIndex];
                    const options = document.querySelectorAll('.option-btn');
                    
                    options.forEach(option => option.classList.add('disabled'));
                    options[question.correct].classList.add('correct');
                    
                    this.wrongCount++;
                    this.score -= 5;
                    this.updateScoreDisplay();
                    
                    setTimeout(() => {
                        this.nextQuestion();
                    }, 1500);
                }
            }
        }, 1000);
    }
    
    resetTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer');
        timerDisplay.textContent = this.timeLeft;
        
        // Add warning class
        const timerBadge = document.querySelector('.timer-badge');
        if (this.timeLeft <= 10) {
            timerBadge.classList.add('warning');
        } else {
            timerBadge.classList.remove('warning');
        }
    }
    
    updateProgress() {
        const progress = ((this.currentQuestionIndex) / this.questions.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }
    
    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('correct-count').textContent = this.correctCount;
        document.getElementById('wrong-count').textContent = this.wrongCount;
    }
    
    showScoreboard() {
        this.resetTimer();
        
        // Switch screens
        this.quizScreen.classList.remove('active');
        this.scoreboardScreen.classList.add('active');
        
        // Update scoreboard
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-correct').textContent = this.correctCount;
        document.getElementById('final-wrong').textContent = this.wrongCount;
        document.getElementById('final-time').textContent = formatTime(this.totalTime);
        
        const accuracy = this.correctCount + this.wrongCount > 0 
            ? Math.round((this.correctCount / (this.correctCount + this.wrongCount)) * 100) 
            : 0;
        document.getElementById('final-accuracy').textContent = `${accuracy}%`;
    }
    
    showWelcomeScreen() {
        this.resetTimer();
        this.welcomeScreen.classList.add('active');
        this.learningScreen.classList.remove('active');
        this.quizScreen.classList.remove('active');
        this.scoreboardScreen.classList.remove('active');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});