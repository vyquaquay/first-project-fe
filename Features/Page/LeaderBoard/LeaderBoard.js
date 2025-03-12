document.addEventListener("DOMContentLoaded", async () => {
  const loadingOverlay = document.getElementById("loadingOverlay");

  // Show loading overlay and disable interactions
  function showLoading() {
    loadingOverlay.classList.add("active");
    document.body.classList.add("loading-active");
  }

  // Hide loading overlay and enable interactions
  function hideLoading() {
    loadingOverlay.classList.remove("active");
    document.body.classList.remove("loading-active");
  }

  showLoading(); // Show overlay immediately

  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("id");
  const sessionId = urlParams.get("sessionId");

  if (!quizId || !sessionId) {
    hideLoading();
    showError("Missing quiz or session information");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Fetch quiz details
    const quizResponse = await fetch(
      `http://2.59.135.31:3000/api/quizzes/${quizId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!quizResponse.ok) throw new Error("Failed to fetch quiz");
    const quiz = await quizResponse.json();

    // Fetch session details
    const sessionResponse = await fetch(
      `http://2.59.135.31:3000/api/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!sessionResponse.ok) throw new Error("Failed to fetch session");
    const session = await sessionResponse.json();

    // Fetch leaderboard
    const leaderboardResponse = await fetch(
      `http://2.59.135.31:3000/api/sessions/leaderboard/${quizId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!leaderboardResponse.ok) throw new Error("Failed to fetch leaderboard");
    const leaderboard = await leaderboardResponse.json();

    // Update UI
    updateQuizInfo(quiz);
    updateLeaderboard(leaderboard);
    updateResults(session, quiz);
    displayQuestionDetails(session, quiz);

    hideLoading(); // Hide overlay only after all data is loaded
  } catch (error) {
    console.error("Error:", error);
    hideLoading();
    showError(`Failed to load results: ${error.message}`);
  }
});

function updateQuizInfo(quiz) {
  document.getElementById("quizTitle").textContent = quiz.title;
  document.getElementById("quizDescription").textContent =
    quiz.description || "No description available";
}

function updateLeaderboard(leaderboard) {
  const leaderboardBody = document.getElementById("leaderboardBody");
  leaderboardBody.innerHTML = leaderboard
    .map((entry, index) => {
      let rankStyle = "";
      let rankIcon = "";

      if (index === 0) {
        rankStyle = "background-color:  #FFF68F; font-weight: bold;";
        rankIcon = "🥇";
      } else if (index === 1) {
        rankStyle = "background-color: #98F5FF; font-weight: bold;";
        rankIcon = "🥈";
      } else if (index === 2) {
        rankStyle = "background-color: #54FF9F; font-weight: bold;";
        rankIcon = "🥉";
      }

      return `
        <tr style="${rankStyle}">
          <td><span class="rank-icon">${rankIcon}</span> ${index + 1}</td>
          <td>${entry.userId?.name || "Anonymous"}</td>
          <td>${entry.score || 0}</td>
          <td>${calculateTimeTaken(entry.questionAnswer || [])}</td>
          <td>${
            entry.dateFinished
              ? new Date(entry.dateFinished).toLocaleDateString()
              : "-"
          }</td>
        </tr>
      `;
    })
    .join("");
}

function updateResults(session, quiz) {
  try {
    // Update summary statistics
    const correctAnswers = (session.questionAnswer || []).filter(
      (answer) => answer.isCorrect
    ).length;
    document.getElementById("finalScore").textContent = session.score || 0;
    document.getElementById(
      "correctAnswers"
    ).textContent = `${correctAnswers}/${quiz.questions.length}`;
    document.getElementById("timeTaken").textContent = calculateTimeTaken(
      session.questionAnswer || []
    );
  } catch (error) {
    console.error("Error updating results:", error);
  }
}

function displayQuestionDetails(session, quiz) {
  try {
    const container = document.getElementById("questionsContainer");
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error("Invalid quiz questions data");
    }

    container.innerHTML = quiz.questions
      .map((question, index) => {
        const answer = (session.questionAnswer || [])[index] || {
          selectedAnswer: null,
          isCorrect: false,
          timeLeft: 0,
        };
        const timeTaken = 10 - (answer.timeLeft || 0);

        return `
          <div class="question-item">
              <div class="question-header">
                  <span class="question-number">Question ${index + 1}</span>
                  <span class="question-status ${
                    answer.isCorrect ? "status-correct" : "status-wrong"
                  }">
                      ${answer.isCorrect ? "Correct" : "Wrong"}
                  </span>
              </div>
              <p class="question-text">${question.question}</p>
              <div class="answer-grid">
                  <div class="answer-option ${getAnswerClass(
                    "A",
                    question,
                    answer
                  )}">
                      A. ${question.answer_a}
                  </div>
                  <div class="answer-option ${getAnswerClass(
                    "B",
                    question,
                    answer
                  )}">
                      B. ${question.answer_b}
                  </div>
                  <div class="answer-option ${getAnswerClass(
                    "C",
                    question,
                    answer
                  )}">
                      C. ${question.answer_c}
                  </div>
                  <div class="answer-option ${getAnswerClass(
                    "D",
                    question,
                    answer
                  )}">
                      D. ${question.answer_d}
                  </div>
              </div>
              <div class="question-meta">
                  <span>Time taken: ${timeTaken} seconds</span>
                  <span>Points: ${calculateQuestionScore(answer)}</span>
              </div>
          </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error displaying question details:", error);
    container.innerHTML =
      '<p class="error">Failed to load question details</p>';
  }
}

function getAnswerClass(option, question, answer) {
  const classes = [];
  if (answer.selectedAnswer === option) classes.push("selected");
  if (question.correct_answer === option) classes.push("correct");
  if (answer.selectedAnswer === option && !answer.isCorrect)
    classes.push("wrong");
  return classes.join(" ");
}

function calculateQuestionScore(answer) {
  if (!answer.isCorrect) return 0;
  const timeBonus = answer.timeLeft * 10;
  return 100 + timeBonus;
}

function calculateTimeTaken(answers) {
  const totalSeconds = answers.reduce(
    (total, answer) => total + (10 - answer.timeLeft),
    0
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function showError(message) {
  // Using alert as in your original code; could switch to SweetAlert2 if preferred
  alert(message);
  window.location.href = "../HomePage/HomPage.html";
}

function playAgain() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("id");
  window.location.href = `../PlayQuiz/PlayQuiz.html?id=${quizId}`;
}

function goHome() {
  window.location.href = "../HomePage/HomPage.html";
}