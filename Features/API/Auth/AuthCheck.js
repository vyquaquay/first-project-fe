function checkAuth() {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
        // Store the current page URL before redirecting
        const currentPage = window.location.pathname.split('/').pop();
        let message = '';
        
        // Customize message based on the page
        switch(currentPage) {
            case 'QuizGenerate.html':
                message = 'Please sign in to generate quizzes';
                break;
            case 'LeaderBoard.html':
                message = 'Please sign in to view the leaderboard';
                break;
            case 'PlayQuiz.html':
                message = 'Please sign in to play quizzes';
                break;
            default:
                message = 'Please sign in to continue';
        }
        
        // Store the message to be displayed after redirect
        sessionStorage.setItem('authMessage', message);
        
        // Redirect to home page
        window.location.href = '../HomePage/HomPage.html';
        return false;
    }
    return true;
}

// Export the function if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuth };
} 