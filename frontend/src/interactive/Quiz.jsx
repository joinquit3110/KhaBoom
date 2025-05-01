import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Quiz - Interactive quiz component for educational assessments
 * Supports multiple choice, text input, and matching questions
 */
const Quiz = ({ params, courseId }) => {
  const [questions, setQuestions] = useState(params.questions || []);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize quiz from params
  useEffect(() => {
    if (params.questions && Array.isArray(params.questions)) {
      setQuestions(params.questions);
      setUserAnswers(new Array(params.questions.length).fill(null));
    } else {
      // Default questions if none provided
      const defaultQuestions = [
        {
          id: 1,
          type: 'multiple-choice',
          question: 'What is the value of π (pi) rounded to two decimal places?',
          options: ['3.14', '3.16', '3.12', '3.18'],
          correctAnswer: 0,
          explanation: 'Pi (π) is approximately equal to 3.14159...'
        }
      ];
      setQuestions(defaultQuestions);
      setUserAnswers(new Array(defaultQuestions.length).fill(null));
    }
  }, [params]);
  
  // Handle user answer selection
  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);
    setFeedback(null);
  };
  
  // Handle text input answers
  const handleTextAnswer = (e) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = e.target.value;
    setUserAnswers(newAnswers);
    setFeedback(null);
  };
  
  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
    } else {
      submitQuiz();
    }
  };
  
  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setFeedback(null);
    }
  };
  
  // Check if the current answer is correct
  const checkCurrentAnswer = () => {
    const question = questions[currentQuestion];
    const userAnswer = userAnswers[currentQuestion];
    
    if (userAnswer === null || userAnswer === undefined) {
      setFeedback({
        type: 'warning',
        message: 'Please select an answer before checking.'
      });
      return;
    }
    
    let isCorrect = false;
    
    switch (question.type) {
      case 'multiple-choice':
        isCorrect = userAnswer === question.correctAnswer;
        break;
      case 'text-input':
        // Case insensitive comparison and trim whitespace
        isCorrect = userAnswer.trim().toLowerCase() === 
                   question.correctAnswer.trim().toLowerCase();
        break;
      case 'matching':
        // Check if all matches are correct
        isCorrect = userAnswer.every((match, idx) => match === question.correctAnswer[idx]);
        break;
      default:
        isCorrect = userAnswer === question.correctAnswer;
    }
    
    setFeedback({
      type: isCorrect ? 'success' : 'error',
      message: isCorrect ? 
        'Correct! ' + (question.explanation || '') : 
        'Incorrect. ' + (question.explanation || 'Try again.')
    });
    
    return isCorrect;
  };
  
  // Submit the entire quiz and calculate score
  const submitQuiz = () => {
    setIsSubmitting(true);
    
    let correctCount = 0;
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      
      if (userAnswer !== null && userAnswer !== undefined) {
        let isCorrect = false;
        
        switch (question.type) {
          case 'multiple-choice':
            isCorrect = userAnswer === question.correctAnswer;
            break;
          case 'text-input':
            isCorrect = userAnswer.trim().toLowerCase() === 
                       question.correctAnswer.trim().toLowerCase();
            break;
          case 'matching':
            isCorrect = userAnswer.every((match, idx) => match === question.correctAnswer[idx]);
            break;
          default:
            isCorrect = userAnswer === question.correctAnswer;
        }
        
        if (isCorrect) correctCount++;
      }
    });
    
    setScore(correctCount);
    setShowResults(true);
    setIsSubmitting(false);
  };
  
  // Restart the quiz
  const restartQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
    setScore(0);
    setFeedback(null);
  };
  
  // Render current question
  const renderQuestion = () => {
    if (questions.length === 0) return <p>No questions available.</p>;
    
    const question = questions[currentQuestion];
    const userAnswer = userAnswers[currentQuestion];
    
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="multiple-choice-question">
            <h3>{question.question}</h3>
            <div className="options-list">
              {question.options.map((option, index) => (
                <motion.div 
                  key={index}
                  className={`option ${userAnswer === index ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="option-marker">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );
      
      case 'text-input':
        return (
          <div className="text-input-question">
            <h3>{question.question}</h3>
            <input
              type="text"
              className="text-answer-input"
              value={userAnswer || ''}
              onChange={handleTextAnswer}
              placeholder="Type your answer here..."
            />
          </div>
        );
      
      default:
        return (
          <div className="default-question">
            <h3>{question.question}</h3>
            <p>This question type is not supported.</p>
          </div>
        );
    }
  };
  
  // Render results screen
  const renderResults = () => {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="quiz-results">
        <h2>Quiz Results</h2>
        <div className="score-display">
          <div className="score-circle" style={{ 
            background: `conic-gradient(#4caf50 ${percentage}%, #f5f5f5 0)` 
          }}>
            <span className="score-percentage">{percentage}%</span>
          </div>
          <p className="score-text">
            You got <strong>{score}</strong> out of <strong>{questions.length}</strong> questions correct!
          </p>
        </div>
        
        <div className="results-actions">
          <motion.button
            className="restart-button"
            onClick={restartQuiz}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Restart Quiz
          </motion.button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="quiz-container">
      <AnimatePresence mode="wait">
        {showResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderResults()}
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="quiz-header">
              <div className="question-progress">
                Question <strong>{currentQuestion + 1}</strong> of <strong>{questions.length}</strong>
              </div>
            </div>
            
            <div className="quiz-content">
              {renderQuestion()}
              
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    className={`feedback ${feedback.type}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feedback.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="quiz-navigation">
              <motion.button
                className="prev-button"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                whileHover={{ scale: currentQuestion > 0 ? 1.05 : 1 }}
                whileTap={{ scale: currentQuestion > 0 ? 0.95 : 1 }}
              >
                Previous
              </motion.button>
              
              <motion.button
                className="check-button"
                onClick={checkCurrentAnswer}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Check Answer
              </motion.button>
              
              <motion.button
                className="next-button"
                onClick={nextQuestion}
                disabled={isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentQuestion < questions.length - 1 ? 'Next' : 'Finish Quiz'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
