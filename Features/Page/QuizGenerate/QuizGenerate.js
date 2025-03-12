document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const playNowBtn = document.getElementById("playNowBtn");
  const viewQuestionsBtn = document.getElementById("viewQuestionsBtn");
  const topicInput = document.getElementById("topic");
  const numQuestionsInput = document.getElementById("numQuestions");
  const languageSelect = document.getElementById("language");
  const container = document.querySelector(".container");
  const questionsPopup = document.getElementById("questionsPopup");
  const closePopupBtn = document.querySelector(".close-popup");
  const deleteQuizBtn = document.querySelector(".delete-quiz");
  const regenerateQuizBtn = document.querySelector(".regenerate-quiz");

  let currentQuizData = null;
  let currentQuizId = null;

  async function generateQuiz(isRegenerate = false) {
    const quizData = {
      topic: topicInput.value.trim(),
      numberOfQuestions: parseInt(numQuestionsInput.value),
      language: languageSelect.value,
    };

    if (!quizData.topic && !isRegenerate) {
      Swal.fire({
        icon: "warning",
        title: "Missing Topic",
        text: "Please enter a quiz topic",
      });
      return;
    }

    if (quizData.numberOfQuestions < 1 || quizData.numberOfQuestions > 20) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Number of Questions",
        text: "Number of questions must be between 1 and 20",
      });
      return;
    }

    if (isRegenerate) {
      // Show loading state immediately for regeneration
      Swal.fire({
        title: "Regenerating Quiz",
        html: "Please wait while we create new questions...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      container.classList.add("loading");
      document.querySelector(".loading-text").textContent =
        "Generating your quiz... 🚀";
    }

    try {
      const token = localStorage.getItem("token");
      let response;

      if (isRegenerate && currentQuizId) {
        response = await fetch(
          `http://2.59.135.31:3000/api/quizzes/regenerate/${currentQuizId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ language: languageSelect.value }),
          }
        );
      } else {
        response = await fetch("http://2.59.135.31:3000/api/quizzes/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(quizData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.quizSet || !result.quizSet.id) {
        throw new Error("Unexpected API response format");
      }

      currentQuizData = result.quizSet;
      currentQuizId = result.quizSet.id;

      if (!isRegenerate) {
        container.classList.remove("loading");
        container.classList.add("completed");
      }

      localStorage.setItem("generatedQuizId", result.quizSet.id);

      playNowBtn.style.display = "block";
      playNowBtn.onclick = () => {
        window.location.href = `/Features/Page/PlayQuiz/PlayQuiz.html?id=${result.quizSet.id}`;
      };

      if (isRegenerate) {
        // After regenerating, fetch and display the new questions
        const updatedQuizData = await fetchQuizQuestions(currentQuizId);
        await Swal.fire({
          icon: "success",
          title: "Quiz Regenerated!",
          text: "New questions have been generated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        displayQuestions(updatedQuizData);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      Swal.fire({
        icon: "error",
        title: "Generation Failed",
        text: error.message || "Failed to generate quiz. Please try again.",
      });
      if (!isRegenerate) {
        container.classList.remove("loading");
      }
    }
  }

  async function fetchQuizQuestions(quizId) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://2.59.135.31:3000/api/quizzes/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      throw error;
    }
  }

  async function deleteQuiz(quizId) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://2.59.135.31:3000/api/quizzes/${quizId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Quiz Deleted!",
        text: "The quiz has been deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.href = "../HomePage/HomPage.html";
      return true;
    } catch (error) {
      console.error("Error deleting quiz:", error);
      Swal.fire({
        icon: "error",
        title: "Deletion Failed",
        text: error.message || "Failed to delete quiz. Please try again.",
      });
      throw error;
    }
  }

  function displayQuestions(quizData) {
    const questionsList = document.querySelector(".questions-list");
    questionsList.innerHTML = "";

    quizData.questions.forEach((question, index) => {
      const questionElement = document.createElement("div");
      questionElement.className = "question-item";
      questionElement.innerHTML = `
        <h3>Question ${index + 1}</h3>
        <p>${question.question}</p>
        <p><strong>Options:</strong></p>
        <p>A: ${question.answer_a}${
        question.correct_answer === "A"
          ? ' <span class="correct-answer">(Correct)</span>'
          : ""
      }</p>
        <p>B: ${question.answer_b}${
        question.correct_answer === "B"
          ? ' <span class="correct-answer">(Correct)</span>'
          : ""
      }</p>
        <p>C: ${question.answer_c}${
        question.correct_answer === "C"
          ? ' <span class="correct-answer">(Correct)</span>'
          : ""
      }</p>
        <p>D: ${question.answer_d}${
        question.correct_answer === "D"
          ? ' <span class="correct-answer">(Correct)</span>'
          : ""
      }</p>
      `;
      questionsList.appendChild(questionElement);
    });
  }

  function openPopup() {
    questionsPopup.style.display = "flex";
  }

  function closePopup() {
    questionsPopup.style.display = "none";
  }

  generateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    generateQuiz();
  });

  viewQuestionsBtn.addEventListener("click", async () => {
    try {
      const quizData = await fetchQuizQuestions(currentQuizId);
      displayQuestions(quizData);
      openPopup();
    } catch (error) {
      alert("Failed to load questions. Please try again.");
    }
  });

  closePopupBtn.addEventListener("click", closePopup);

  deleteQuizBtn.addEventListener("click", async () => {
    try {
      Swal.fire({
        title: "Deleting Quiz",
        html: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      await deleteQuiz(currentQuizId);
    } catch (error) {
      console.error("Delete error:", error);
    }
  });

  regenerateQuizBtn.addEventListener("click", async () => {
    try {
      await generateQuiz(true);
    } catch (error) {
      console.error("Regenerate error:", error);
    }
  });

  numQuestionsInput.addEventListener("input", () => {
    const value = parseInt(numQuestionsInput.value);
    if (value < 1) numQuestionsInput.value = 1;
    if (value > 20) numQuestionsInput.value = 20;
  });

  // Close popup when clicking outside
  questionsPopup.addEventListener("click", (e) => {
    if (e.target === questionsPopup) {
      closePopup();
    }
  });
});
