// Function to determine cards per page based on screen width
function getCardsPerPage() {
  const width = window.innerWidth;
  if (width >= 1200) {
    return 3; // Medium and larger screens
  } else if (width >= 768) {
    return 2; // Small screens
  } else {
    return 1; // Extra small screens
  }
}

// Function to fetch and display quizzes
async function displayQuizzes() {
  try {
    const response = await fetch("http://2.59.135.31:3000/api/quizzes/new");
    if (!response.ok) {
      throw new Error("Failed to fetch quizzes");
    }

    const quizSets = await response.json();
    const quizGrid = document.getElementById("quiz-grid");

    // Clear existing content
    quizGrid.innerHTML = `
            <button class="slide-btn prev-btn">&lt;</button>
            <div class="cards-container"></div>
            <button class="slide-btn next-btn">&gt;</button>
        `;

    const cardsContainer = quizGrid.querySelector(".cards-container");

    // Create and append quiz cards
    quizSets.forEach((quizSet) => {
      const quizCard = `
                <div class="quiz-card" data-quiz-id="${quizSet._id}">
                    <div class="quiz-info">
                        <h4>${quizSet.title}</h4>
                        <p class="quiz-description">${
                          quizSet.description || "No description available"
                        }</p>
                        <div class="quiz-meta">
                            <div class="quiz-meta-item">
                                <span>Creator:</span>
                                <span>${
                                  quizSet.creator?.name || "Unknown"
                                }</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Questions:</span>
                                <span>${quizSet.questions?.length || 0}</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Created:</span>
                                <span>${new Date(
                                  quizSet.createdAt
                                ).toLocaleDateString()}</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Plays:</span>
                                <span>${quizSet.playCount || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div class="quiz-actions">
                        <button class="action-btn play-btn" onclick="playQuiz('${
                          quizSet._id
                        }')">Play</button>
                        <button class="action-btn view-btn" onclick="viewQuiz('${
                          quizSet._id
                        }')">View</button>
                    </div>
                </div>
            `;
      cardsContainer.innerHTML += quizCard;
    });

    // Initialize carousel functionality
    let currentPage = 0;
    let cardsPerPage = getCardsPerPage();
    let totalPages = Math.ceil(quizSets.length / cardsPerPage);
    const cards = Array.from(cardsContainer.querySelectorAll(".quiz-card"));

    function updateCardPositions(cards, cardsPerPage, currentPage) {
      const containerWidth = document.querySelector('.cards-container').offsetWidth;
      const cardWidth = containerWidth / cardsPerPage;
      
      cards.forEach((card, index) => {
        const pageIndex = Math.floor(index / cardsPerPage);
        const positionInPage = index % cardsPerPage;
        
        if (pageIndex === currentPage) {
          card.style.display = 'block';
          card.style.opacity = '1';
          card.style.transform = 'translateX(0)';
          card.style.left = `${positionInPage * (100 / cardsPerPage)}%`;
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    }

    function updateCarousel() {
      const slideDirection = this?.classList?.contains('next-btn') ? 'left' : 'right';
      const startIndex = currentPage * cardsPerPage;
      const endIndex = startIndex + cardsPerPage;
      const nextStartIndex = slideDirection === 'left' ? startIndex + cardsPerPage : startIndex - cardsPerPage;
      const nextEndIndex = nextStartIndex + cardsPerPage;

      // Show and animate current cards sliding out
      cards.slice(startIndex, endIndex).forEach((card, i) => {
        card.style.display = "block";
        card.style.left = `${i * (100 / cardsPerPage)}%`;
        card.classList.remove('sliding-out-left', 'sliding-out-right', 'sliding-in-left', 'sliding-in-right');
        card.classList.add(`sliding-out-${slideDirection}`);
      });

      // Show and animate next cards sliding in
      cards.slice(nextStartIndex, nextEndIndex).forEach((card, i) => {
        card.style.display = "block";
        card.style.left = `${i * (100 / cardsPerPage)}%`;
        card.classList.remove('sliding-out-left', 'sliding-out-right', 'sliding-in-left', 'sliding-in-right');
        card.classList.add(`sliding-in-${slideDirection}`);
      });

      // After animation completes, clean up
      setTimeout(() => {
        updateCardPositions(cards, cardsPerPage, currentPage);
      }, 300);
    }

    // Add click handlers for buttons
    const prevBtn = quizGrid.querySelector(".prev-btn");
    const nextBtn = quizGrid.querySelector(".next-btn");

    prevBtn.addEventListener("click", function() {
      if (currentPage > 0) {
        updateCarousel.call(this);
        currentPage--;
      }
    });

    nextBtn.addEventListener("click", function() {
      if (currentPage < totalPages - 1) {
        updateCarousel.call(this);
        currentPage++;
      }
    });

    // Initial update without animation
    cards.forEach((card, index) => {
      const pageIndex = Math.floor(index / cardsPerPage);
      const positionInPage = index % cardsPerPage;
      
      if (pageIndex === 0) {
        card.style.display = 'block';
        card.style.opacity = '1';
        card.style.transform = 'translateX(0)';
        card.style.left = `${positionInPage * (100 / cardsPerPage)}%`;
      } else {
        card.style.display = 'none';
        card.style.opacity = '0';
      }
    });

    // Update cards per page on window resize
    window.addEventListener('resize', () => {
      const newCardsPerPage = getCardsPerPage();
      if (newCardsPerPage !== cardsPerPage) {
        cardsPerPage = newCardsPerPage;
        currentPage = 0; // Reset to first page
        
        // Remove all animation classes
        cards.forEach(card => {
          card.classList.remove('sliding-out-left', 'sliding-out-right', 'sliding-in-left', 'sliding-in-right');
        });
        
        // Update card positions without animation
        updateCardPositions(cards, cardsPerPage, currentPage);
        
        // Update total pages
        totalPages = Math.ceil(cards.length / cardsPerPage);
      }
    });

  } catch (error) {
    console.error("Error fetching quizzes:", error);
  }
}

// Function to display popular quizzes
async function displayPopularQuizzes() {
  try {
    const response = await fetch("http://2.59.135.31:3000/api/quizzes/popular");
    if (!response.ok) {
      throw new Error("Failed to fetch quizzes");
    }

    const quizSets = await response.json();

    // Sort quizzes by playCount in descending order
    const sortedQuizSets = quizSets.sort((a, b) => b.playCount - a.playCount);

    const popularQuizGrid = document.querySelector(
      ".quiz-section:nth-of-type(3) .quiz-grid"
    );

    // Clear existing content
    popularQuizGrid.innerHTML = `
            <button class="slide-btn prev-btn">&lt;</button>
            <div class="cards-container"></div>
            <button class="slide-btn next-btn">&gt;</button>
        `;

    const cardsContainer = popularQuizGrid.querySelector(".cards-container");

    // Create and append quiz cards for popular quizzes
    sortedQuizSets.forEach((quizSet) => {
      const quizCard = `
                <div class="quiz-card" data-quiz-id="${quizSet._id}">
                    <div class="quiz-info">
                        <h4>${quizSet.title}</h4>
                        <div class="quiz-meta">
                            <div class="quiz-meta-item">
                                <span>Creator:</span>
                                <span>${
                                  quizSet.creator?.name || "Unknown"
                                }</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Questions:</span>
                                <span>${
                                  quizSet.questions
                                    ? quizSet.questions.length
                                    : 0
                                }</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Created:</span>
                                <span>${new Date(
                                  quizSet.createdAt
                                ).toLocaleDateString()}</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Plays:</span>
                                <span>${quizSet.playCount || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div class="quiz-actions">
                        <button class="action-btn play-btn" onclick="playQuiz('${
                          quizSet._id
                        }')">Play</button>
                        <button class="action-btn view-btn" onclick="viewQuiz('${
                          quizSet._id
                        }')">View</button>
                    </div>
                </div>
            `;
      cardsContainer.innerHTML += quizCard;
    });

    // Initialize carousel functionality
    let currentPage = 0;
    let cardsPerPage = getCardsPerPage();
    let totalPages = Math.ceil(sortedQuizSets.length / cardsPerPage);
    const cards = Array.from(cardsContainer.querySelectorAll(".quiz-card"));

    function updateCarousel() {
      const slideDirection = this?.classList?.contains('next-btn') ? 'left' : 'right';
      const startIndex = currentPage * cardsPerPage;
      const endIndex = startIndex + cardsPerPage;
      const nextStartIndex = slideDirection === 'left' ? endIndex : startIndex - cardsPerPage;
      const nextEndIndex = slideDirection === 'left' ? endIndex + cardsPerPage : startIndex;

      // First make all cards invisible except current and next set
      cards.forEach(card => {
        card.style.display = "none";
      });

      // Show and animate current cards sliding out
      cards.slice(startIndex, endIndex).forEach(card => {
        card.style.display = "block";
        card.classList.remove('sliding-out-left', 'sliding-out-right', 'sliding-in-left', 'sliding-in-right');
        card.classList.add(`sliding-out-${slideDirection}`);
      });

      // Show and animate next cards sliding in
      cards.slice(nextStartIndex, nextEndIndex).forEach(card => {
        card.style.display = "block";
        card.classList.remove('sliding-out-left', 'sliding-out-right', 'sliding-in-left', 'sliding-in-right');
        card.classList.add(`sliding-in-${slideDirection}`);
      });

      // After animation completes, clean up
      setTimeout(() => {
        cards.forEach((card, index) => {
          // Hide all cards first
          card.style.display = "none";
          // Remove animation classes
          card.classList.remove('sliding-out-left', 'sliding-out-right', 'sliding-in-left', 'sliding-in-right');
          // Show only the cards that should be visible after animation
          if (index >= nextStartIndex && index < nextEndIndex) {
            card.style.display = "block";
          }
        });
      }, 300); // Match this with your CSS animation duration
    }

    // Add click handlers for buttons
    const prevBtn = popularQuizGrid.querySelector(".prev-btn");
    const nextBtn = popularQuizGrid.querySelector(".next-btn");

    prevBtn.addEventListener("click", function() {
      if (currentPage > 0) {
        updateCarousel.call(this);
        currentPage--;
      }
    });

    nextBtn.addEventListener("click", function() {
      if (currentPage < totalPages - 1) {
        updateCarousel.call(this);
        currentPage++;
      }
    });

    // Initial update without animation
    cards.forEach((card, index) => {
      card.style.setProperty('--card-index', index % cardsPerPage);
      if (index < cardsPerPage) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  } catch (error) {
    console.error("Error fetching popular quizzes:", error);
  }
}

// Call both functions when the page loads
document.addEventListener("DOMContentLoaded", () => {
  displayQuizzes();
  displayPopularQuizzes();

  // Add click handler for generate button
  const generateBtn = document.querySelector('.generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', (e) => {
      if (!isUserLoggedIn()) {
        e.preventDefault(); // Prevent default navigation
        // Show SweetAlert first
        Swal.fire({
          icon: 'warning',
          title: 'Authentication Required',
          text: 'Please sign in to generate quizzes',
          showCancelButton: true,
          confirmButtonText: 'Sign In',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            // Show the sign in modal if user clicks "Sign In"
            showSignInModal();
            
            // Add one-time listener for successful login
            const checkLoginAndRedirect = () => {
              if (isUserLoggedIn()) {
                window.location.href = '../QuizGenerate/QuizGenerate.html';
              }
            };
            
            // Check every second for 60 seconds (1 minute) if user has logged in
            const checkInterval = setInterval(() => {
              checkLoginAndRedirect();
            }, 1000);
            
            // Clear interval after 1 minute
            setTimeout(() => {
              clearInterval(checkInterval);
            }, 60000);
          }
        });
      } else {
        // If logged in, allow navigation to QuizGenerate.html
        window.location.href = '../QuizGenerate/QuizGenerate.html';
      }
    });
  }

  // Check for auth message
  const authMessage = sessionStorage.getItem('authMessage');
  if (authMessage) {
    // Show the message
    Swal.fire({
      icon: 'warning',
      title: 'Authentication Required',
      text: authMessage,
      confirmButtonText: 'OK'
    });
    // Clear the message
    sessionStorage.removeItem('authMessage');
  }
});

// Add these new functions at the end of the file
async function viewQuiz(quizId) {
  try {
    const response = await fetch(
      `http://2.59.135.31:3000/api/quizzes/${quizId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch quiz details");
    }

    const quiz = await response.json();

    // Create modal HTML
    const modalHTML = `
            <div class="quiz-view-modal" id="quizViewModal">
                <div class="quiz-view-content">
                    <div class="quiz-view-header">
                        <h2>${quiz.title}</h2>
                        <button class="quiz-view-close" onclick="closeQuizView()">&times;</button>
                    </div>
                    <div class="quiz-view-description">
                        <p>${quiz.description || "No description available"}</p>
                    </div>
                    <div class="quiz-view-meta">
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Creator</span>
                            <span class="quiz-view-meta-value">${
                              quiz.creator?.name || "Unknown"
                            }</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Email</span>
                            <span class="quiz-view-meta-value">${
                              quiz.creator?.email || "N/A"
                            }</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Created</span>
                            <span class="quiz-view-meta-value">${new Date(
                              quiz.createdAt
                            ).toLocaleDateString()}</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Total Questions</span>
                            <span class="quiz-view-meta-value">${
                              quiz.questions.length
                            }</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Total Plays</span>
                            <span class="quiz-view-meta-value">${
                              quiz.playCount || 0
                            }</span>
                        </div>
                    </div>
                    <div class="quiz-questions">
                        ${quiz.questions
                          .map(
                            (question, index) => `
                            <div class="quiz-question">
                                <h3>Question ${index + 1}</h3>
                                <p>${question.question}</p>
                                <div class="quiz-answers">
                                    <div class="answer${
                                      question.correct_answer === "A"
                                        ? " correct"
                                        : ""
                                    }">A. ${question.answer_a}</div>
                                    <div class="answer${
                                      question.correct_answer === "B"
                                        ? " correct"
                                        : ""
                                    }">B. ${question.answer_b}</div>
                                    <div class="answer${
                                      question.correct_answer === "C"
                                        ? " correct"
                                        : ""
                                    }">C. ${question.answer_c}</div>
                                    <div class="answer${
                                      question.correct_answer === "D"
                                        ? " correct"
                                        : ""
                                    }">D. ${question.answer_d}</div>
                                </div>
                                <div class="correct-answer">
                                    Correct Answer: ${question.correct_answer}
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Show modal
    const modal = document.getElementById("quizViewModal");
    modal.style.display = "flex";

    // Add click event to close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeQuizView();
      }
    });

    // Add escape key listener
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeQuizView();
      }
    });
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load quiz details",
    });
  }
}

function closeQuizView() {
  const modal = document.getElementById("quizViewModal");
  if (modal) {
    modal.remove();
  }
}

function playQuiz(quizId) {
  // Check if user is logged in first
  if (!isUserLoggedIn()) {
    // Show sign in modal with a message
    Swal.fire({
      icon: 'warning',
      title: 'Authentication Required',
      text: 'Please sign in to play quizzes',
      showCancelButton: true,
      confirmButtonText: 'Sign In',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Show the sign in modal if user clicks "Sign In"
        showSignInModal();
        
        // Store the quiz ID they were trying to play
        sessionStorage.setItem('pendingQuizId', quizId);
        
        // Add one-time listener for successful login
        const checkLoginAndRedirect = () => {
          if (isUserLoggedIn()) {
            const pendingQuizId = sessionStorage.getItem('pendingQuizId');
            if (pendingQuizId) {
              sessionStorage.removeItem('pendingQuizId');
              window.location.href = `../PlayQuiz/PlayQuiz.html?id=${pendingQuizId}`;
            }
          }
        };
        
        // Check every second for 60 seconds (1 minute) if user has logged in
        const checkInterval = setInterval(() => {
          checkLoginAndRedirect();
        }, 1000);
        
        // Clear interval after 1 minute
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 60000);
      }
    });
  } else {
    // If logged in, proceed to play quiz
    window.location.href = `../PlayQuiz/PlayQuiz.html?id=${quizId}`;
  }
}

// Scroll to top functionality
document.addEventListener("DOMContentLoaded", function () {
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");

  // Hiển thị nút khi cuộn xuống 100px
  window.onscroll = function () {
    if (
      document.body.scrollTop > 100 ||
      document.documentElement.scrollTop > 100
    ) {
      scrollToTopBtn.style.display = "flex";
    } else {
      scrollToTopBtn.style.display = "none";
    }
  };

  // Xử lý sự kiện click
  scrollToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});

// Add this function near the top of the file, after the getCardsPerPage function
function showSignInModal() {
  const modal = document.getElementById("myModal");
  if (modal) {
    modal.style.visibility = "visible";
  }
}

// Add this function to check if user is logged in
function isUserLoggedIn() {
  return localStorage.getItem("user") !== null;
}
