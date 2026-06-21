'use strict';

/**
 * @fileoverview Onboarding Quiz Page logic (quiz.html).
 */

import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { saveUserProfile } from './firestore.js';
import { logger, hashEmail, showNotification } from './utils.js';

let currentStep = 1;
const totalSteps = 4;
const cacheKey = 'cm_quiz_cache';

const defaultAnswers = {
  city: 'Delhi',
  transport: { mode: 'motorcycle', distanceKm: 0 },
  flights: { flightsPerYear: 0 },
  home: { cookingFuel: 'lpg', electricityKwhPerMonth: 0, acHoursPerDay: 0, householdSize: 1 },
  food: { dietType: 'vegetarian' }
};


/**
 * Load cached answers from localStorage to prevent data loss.
 * @returns {Object} Cached answers or default answers fallback.
 */
function loadAnswers() {
  try {
    const rawCachedData = localStorage.getItem(cacheKey);
    return rawCachedData ? JSON.parse(rawCachedData) : { ...defaultAnswers };
  } catch (parseError) {
    logger.warn('Failed to parse cached quiz answers.', { message: parseError.message });
    return { ...defaultAnswers };
  }
}

/**
 * Renders the active step visual state and updates the progress bar.
 * Uses early returns and declarative DOM updates.
 */
function renderStep() {
  for (let stepIndex = 1; stepIndex <= totalSteps; stepIndex++) {
    const stepElement = document.getElementById(`quiz-step-${stepIndex}`);
    if (!stepElement) {
      continue;
    }
    const isCurrent = stepIndex === currentStep;
    stepElement.style.display = isCurrent ? 'flex' : 'none';
    
    // Disable inputs in hidden steps so they bypass HTML5 validation
    const inputs = stepElement.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.disabled = !isCurrent;
    });
  }
  const progressBarElement = document.getElementById('quiz-progress-bar');
  if (progressBarElement) {progressBarElement.value = (currentStep / totalSteps) * 100;}
  
  const progressPercentageElement = document.getElementById('quiz-progress-percent');
  if (progressPercentageElement) {progressPercentageElement.textContent = `${Math.round((currentStep / totalSteps) * 100)}%`;}
  
  const previousButtonElement = document.getElementById('quiz-prev-btn');
  if (previousButtonElement) {previousButtonElement.disabled = currentStep === 1;}
  
  const nextButtonTextElement = document.getElementById('quiz-next-btn-text');
  if (nextButtonTextElement) {nextButtonTextElement.textContent = currentStep === totalSteps ? 'Submit' : 'Next Step';}
}

/**
 * Aggregates form inputs into the answers object.
 * @param {Object} answers - The target answers object.
 */
function captureInputs(answers) {
  const getVal = (id) => document.getElementById(id)?.value;
  const getNum = (id) => Number(getVal(id)) || 0;

  answers.city = getVal('quiz-city') || answers.city;
  answers.transport.mode = getVal('quiz-transport-mode') || answers.transport.mode;
  answers.transport.distanceKm = getNum('quiz-transport-distance');
  answers.flights.flightsPerYear = getNum('quiz-flights');
  answers.home.cookingFuel = getVal('quiz-home-fuel') || answers.home.cookingFuel;
  answers.home.electricityKwhPerMonth = getNum('quiz-home-electricity');
  answers.home.acHoursPerDay = getNum('quiz-home-ac');
  answers.home.householdSize = Math.max(1, parseInt(getVal('quiz-home-size')) || 1);
  answers.food.dietType = getVal('quiz-food-diet') || answers.food.dietType;
}

/**
 * Handles submission of quiz answers to Firestore database.
 * @param {Object} answers - Complete answers payload.
 * @returns {Promise<void>}
 */
async function submitQuiz(answers) {
  const user = getAuth().currentUser;
  if (!user) {
    localStorage.setItem(cacheKey, JSON.stringify(answers));
    showNotification('Please sign in to save your quiz results.');
    return;
  }
  const container = document.getElementById('quiz-container');
  if (container) {
    container.innerHTML = '<div class="text-center py-lg"><div class="typing-dot-1 inline-block bg-teal w-sm h-sm rounded-full mr-xs"></div><div class="typing-dot-2 inline-block bg-teal w-sm h-sm rounded-full mr-xs"></div><div class="typing-dot-3 inline-block bg-teal w-sm h-sm rounded-full"></div><p class="body-md mt-md">Assembling your digital planet...</p></div>';
  }
  try {
    const hashedEmail = await hashEmail(user.email || 'anonymous');
    const profile = { displayName: user.displayName || 'Anonymous', email: hashedEmail, createdAt: new Date(), lastActive: new Date(), quizAnswers: answers };
    
    // Race the Firestore save against a timeout in case of slow/offline network queuing
    const savePromise = saveUserProfile(user.uid, profile);
    const timeoutPromise = new Promise(resolve => { setTimeout(resolve, 2000); });
    await Promise.race([savePromise, timeoutPromise]);

    localStorage.removeItem(cacheKey);
    window.location.href = 'dashboard';
  } catch (submissionError) {
    logger.error('Failed to submit quiz.', { message: submissionError.message });
    showNotification(`Quiz save failed: ${submissionError.message}`);
  }
}

/**
 * Setup and initialize Onboarding Quiz Page.
 */
export function initQuizPage() {
  logger.info('Initializing Quiz Page module.');
  const answers = loadAnswers();
  renderStep();
  const prevBtn = document.getElementById('quiz-prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) { currentStep--; renderStep(); }
    });
  }
  const form = document.getElementById('quiz-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      captureInputs(answers);
      localStorage.setItem(cacheKey, JSON.stringify(answers));
      if (currentStep < totalSteps) {
        currentStep++;
        renderStep();
      } else {
        await submitQuiz(answers);
      }
    });
  }
}
