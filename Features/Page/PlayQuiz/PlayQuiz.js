document.addEventListener("DOMContentLoaded", () => {
  // Game state
  let currentQuiz = null;
  let currentQuestionIndex = 0;
  let score = 0;
  let timeLeft = 10;
  let timerInterval = null;
  let isAnswerSelected = false;
  let currentSession = null;
  let isPaused = false; // Track pause state for popup
  let animationInProgress = false; // Track if animation is running
  let currentAnimationIndex = 0; // Track current animation step

  // DOM Elements
  const quizTitle = document.getElementById("quizTitle");
  const questionCounter = document.getElementById("questionCounter");
  const totalScore = document.getElementById("totalScore");
  const timer = document.getElementById("timer");
  const questionText = document.getElementById("questionText");
  const statusMessage = document.getElementById("statusMessage");
  const optionButtons = document.querySelectorAll(".option-btn");
  const backHomeBtn = document.getElementById("backHomeBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");

  // Show loading overlay and disable interactions
  function showLoading() {
    loadingOverlay.classList.add("active");
    document.querySelector(".quiz-container").classList.add("loading-active");
  }

  function hideLoading() {
    loadingOverlay.classList.remove("active");
    document.querySelector(".quiz-container").classList.remove("loading-active");
  }

  // Initialize quiz
  async function initializeQuiz() {
    showLoading();

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get("id");

    if (!quizId) {
      hideLoading();
      showError("No quiz ID provided");
      return;
    }

    try {
      const quizResponse = await fetch(`http://2.59.135.31:3000/api/quizzes/${quizId}`);
      if (!quizResponse.ok) throw new Error("Failed to fetch quiz");
      currentQuiz = await quizResponse.json();

      const token = localStorage.getItem("token");
      const sessionResponse = await fetch(
        `http://2.59.135.31:3000/api/sessions/active/${quizId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (sessionResponse.ok) {
        currentSession = await sessionResponse.json();
        if (currentSession && currentSession.status === "in-progress") {
          hideLoading();
          const result = await Swal.fire({
            title: "Continue Previous Session?",
            text: `You have an unfinished session (Question ${
              currentSession.questionIndex + 1
            }/${currentQuiz.questions.length}). Would you like to continue?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, continue",
            cancelButtonText: "No, start over",
          });

          if (result.isConfirmed) {
            currentQuestionIndex = currentSession.questionIndex;
            score = currentSession.score;
          } else {
            await createNewSession(quizId);
          }
        } else {
          await createNewSession(quizId);
        }
      } else {
        await createNewSession(quizId);
      }

      quizTitle.textContent = currentQuiz.title;
      hideLoading();
      startQuiz();
    } catch (error) {
      hideLoading();
      showError("Failed to load quiz");
      console.error(error);
    }
  }

  // Create new session
  async function createNewSession(quizId) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://2.59.135.31:3000/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizSetId: quizId,
          status: "in-progress",
        }),
      });
      if (!response.ok) throw new Error("Failed to create session");
      currentSession = await response.json();
    } catch (error) {
      console.error("Error creating session:", error);
    }
  }

  // Update session after each answer
  async function updateSession(selectedAnswer, isCorrect) {
    if (!currentSession) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://2.59.135.31:3000/api/sessions/${currentSession._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionAnswer: [
              ...currentSession.questionAnswer,
              {
                questionIndex: currentQuestionIndex,
                selectedAnswer,
                isCorrect,
                timeLeft,
              },
            ],
            score,
            questionIndex: currentQuestionIndex + 1,
            lastTimePlay: new Date(),
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to update session");
      currentSession = await response.json();
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }

  // End session
  async function endSession() {
    if (!currentSession) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://2.59.135.31:3000/api/sessions/${currentSession._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "ended",
            dateFinished: new Date(),
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to end session");
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }

  // Start quiz
  function startQuiz() {
    updateScore();
    displayQuestion();
  }

  // Display current question
  async function displayQuestion() {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
      endQuiz();
      return;
    }

    // Reset state for new question
    timeLeft = 10;
    isAnswerSelected = false;
    animationInProgress = false;
    currentAnimationIndex = 0;

    const question = currentQuiz.questions[currentQuestionIndex];
    questionCounter.textContent = `Question: ${currentQuestionIndex + 1}/${currentQuiz.questions.length}`;
    questionText.textContent = question.question;

    // Reset options state and set to "Loading..."
    optionButtons.forEach((button) => {
      button.classList.remove("visible", "correct", "wrong");
      button.disabled = true; // Keep disabled until all options are shown
      document.querySelector(`#${button.id} .option-text`).textContent = "Loading..."; // Placeholder
    });

    // Reset status message
    statusMessage.textContent = "";
    statusMessage.className = "status-message";

    // Initial delay before animation starts
    if (!isPaused) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay before first answer
    }

    // Show options sequentially
    const options = [
      { id: "optionA", text: question.answer_a },
      { id: "optionB", text: question.answer_b },
      { id: "optionC", text: question.answer_c },
      { id: "optionD", text: question.answer_d },
    ];

    animationInProgress = true;
    console.log("Starting animation in displayQuestion, currentAnimationIndex:", currentAnimationIndex);

    for (; currentAnimationIndex < options.length; currentAnimationIndex++) {
      if (isPaused) {
        console.log("Animation paused at index:", currentAnimationIndex);
        break; // Pause animation if popup is active
      }
      const button = document.getElementById(options[currentAnimationIndex].id);
      console.log(`Showing option ${options[currentAnimationIndex].id} at index ${currentAnimationIndex}`);
      document.querySelector(`#${options[currentAnimationIndex].id} .option-text`).textContent = options[currentAnimationIndex].text; // Update from "Loading..."
      button.classList.add("visible");
      await new Promise((resolve) => setTimeout(resolve, 400)); // 400ms per option
      // Do NOT enable button here; wait until all are shown
    }

    if (!isPaused) {
      // Enable all buttons only after animation completes
      optionButtons.forEach((button) => (button.disabled = false));
      console.log("Animation complete, enabling buttons and starting timer");
      isAnswerSelected = false;
      animationInProgress = false;
      startTimer();
    }
  }

  // Timer functionality
  function startTimer() {
    updateTimer();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!isPaused) { // Only count down if not paused
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          handleTimeout();
        }
      }
    }, 1000);
  }

  function updateTimer() {
    timer.textContent = timeLeft;
    timer.className = "timer" + (timeLeft <= 3 ? " warning" : "");
  }

  // Handle answer selection
  async function handleAnswerSelection(selectedOption) {
    if (isAnswerSelected) return;
    isAnswerSelected = true;

    clearInterval(timerInterval);
    const question = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedOption === question.correct_answer;

    if (isCorrect) {
      const timeBonus = timeLeft * 10;
      const questionScore = 100 + timeBonus;
      score += questionScore;
      updateScore();
    }

    optionButtons.forEach((button) => {
      const choice = button.dataset.choice;
      if (choice === question.correct_answer) {
        button.classList.add("correct");
      } else if (choice === selectedOption && !isCorrect) {
        button.classList.add("wrong");
      }
      button.disabled = true;
    });

    showStatus(isCorrect, timeLeft);
    await updateSession(selectedOption, isCorrect);

    setTimeout(() => {
      currentQuestionIndex++;
      displayQuestion();
    }, 1000);
  }

  // Handle timeout
  async function handleTimeout() {
    if (isAnswerSelected) return;
    isAnswerSelected = true;

    const question = currentQuiz.questions[currentQuestionIndex];

    optionButtons.forEach((button) => {
      if (button.dataset.choice === question.correct_answer) {
        button.classList.add("correct");
      }
      button.disabled = true;
    });

    showStatus(false, timeLeft);
    await updateSession(null, false);

    setTimeout(() => {
      currentQuestionIndex++;
      displayQuestion();
    }, 1000);
  }

  // Update score display
  function updateScore() {
    totalScore.textContent = `Score: ${score}`;
  }

  // Show status message
  function showStatus(isCorrect, timeLeft) {
    statusMessage.className = `status-message show ${isCorrect ? "correct" : "wrong"}`;
    if (isCorrect) {
      const timeBonus = timeLeft * 10;
      statusMessage.textContent = `Correct! +${100 + timeBonus} points (Time bonus: +${timeBonus})`;
    } else {
      statusMessage.textContent = "Wrong answer! The correct answer is highlighted.";
    }
  }

  // End quiz
  async function endQuiz() {
    clearInterval(timerInterval);
    await endSession();
    window.location.href = `../LeaderBoard/LeaderBoard.html?id=${currentQuiz._id}&sessionId=${currentSession._id}`;
  }

  // Show error message
  function showError(message) {
    Swal.fire({
      title: "Error",
      text: message,
      icon: "error",
      confirmButtonText: "Return to Home",
    }).then(() => {
      window.location.href = "../HomePage/HomPage.html";
    });
  }

  // Back to home handler
  async function handleBackHome() {
    isPaused = true; // Pause animation and timer
    clearInterval(timerInterval); // Stop timer
    const pausedTimeLeft = timeLeft; // Store current timeLeft

    console.log("Paused at animationInProgress:", animationInProgress, "currentAnimationIndex:", currentAnimationIndex, "timeLeft:", timeLeft);

    const result = await Swal.fire({
      title: "Leave Quiz?",
      text: "Your progress will be saved. You can continue later. Are you sure you want to return to home?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, leave quiz",
      cancelButtonText: "No, continue quiz",
    });

    if (result.isConfirmed) {
      window.location.href = "../HomePage/HomPage.html";
    } else {
      isPaused = false; // Resume game
      if (!isAnswerSelected) {
        if (animationInProgress) {
          console.log("Resuming animation from index:", currentAnimationIndex);
          await resumeAnimation(currentAnimationIndex); // Wait for animation to complete
        } else {
          console.log("Resuming timer from timeLeft:", pausedTimeLeft);
          timeLeft = pausedTimeLeft; // Restore paused time
          startTimer(); // Resume timer from paused value
        }
      }
    }
  }

  // Resume animation from paused point
  async function resumeAnimation(startIndex) {
    const options = [
      { id: "optionA", text: currentQuiz.questions[currentQuestionIndex].answer_a },
      { id: "optionB", text: currentQuiz.questions[currentQuestionIndex].answer_b },
      { id: "optionC", text: currentQuiz.questions[currentQuestionIndex].answer_c },
      { id: "optionD", text: currentQuiz.questions[currentQuestionIndex].answer_d },
    ];

    animationInProgress = true; // Indicate animation is resuming

    console.log("Resuming animation from index:", startIndex);

    for (let i = startIndex; i < options.length; i++) {
      if (isPaused) {
        console.log("Animation paused again at index:", i);
        break; // Allow re-pausing if popup is triggered again
      }
      const button = document.getElementById(options[i].id);
      console.log(`Showing option ${options[i].id} at index ${i}`);
      document.querySelector(`#${options[i].id} .option-text`).textContent = options[i].text; // Update from "Loading..."
      button.classList.add("visible");
      await new Promise((resolve) => setTimeout(resolve, 400)); // 400ms per option
      // Do NOT enable button here; wait until all are shown
    }

    if (!isPaused) {
      // Enable all buttons only after animation completes
      optionButtons.forEach((button) => (button.disabled = false));
      console.log("Animation complete, enabling buttons and starting timer");
      isAnswerSelected = false;
      animationInProgress = false;
      startTimer();
    }
  }

  // Event listeners
  optionButtons.forEach((button) => {
    button.addEventListener("click", () => handleAnswerSelection(button.dataset.choice));
  });

  backHomeBtn.addEventListener("click", handleBackHome);

  // Start the quiz
  initializeQuiz();
});