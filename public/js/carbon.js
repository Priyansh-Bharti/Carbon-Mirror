'use strict';

/**
 * @fileoverview Pure functional carbon footprint calculation engine.
 */

import { 
  TRANSPORT_FACTORS, 
  ENERGY_FACTORS, 
  FOOD_DIET_MAP
} from './constants.js';

import {
  kgToPlanetScore,
  getPlanetState
} from './carbon-utils.js';

/**
 * Calculates daily transport emissions.
 * @param {Object} transportData - Transport details.
 * @param {string} transportData.mode - Transport mode key.
 * @param {number} transportData.distanceKm - Daily commute distance in km.
 * @param {number} [transportData.flightsPerYear] - Annual flights.
 * @returns {number|Error} Daily kg CO2 or Error.
 * @throws {never}
 */
export function calculateTransportEmissions(transportData) {
  if (!transportData || typeof transportData !== 'object') {
    return new Error('Invalid input: transportData must be an object.');
  }
  const { mode, distanceKm, flightsPerYear = 0 } = transportData;
  if (typeof mode !== 'string' || typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm < 0) {
    return new Error('Invalid transport mode or commute distance.');
  }
  const factor = TRANSPORT_FACTORS[mode];
  if (factor === undefined) {
    return new Error(`Unknown transport mode: ${mode}`);
  }
  const commute = distanceKm * factor;
  const flightDaily = (flightsPerYear * 1200 * TRANSPORT_FACTORS.domestic_flight) / 365.0;
  return Number((commute + flightDaily).toFixed(3));
}

/**
 * Helper to calculate monthly cooking emissions per household.
 * @param {string} fuel - Cooking fuel type.
 * @returns {number|null} Monthly emissions in kg CO2 or null if invalid.
 * @throws {never}
 */
function getCookingEmissions(fuel) {
  const f = fuel.toLowerCase();
  if (f === 'lpg') return 14.2 * ENERGY_FACTORS.lpg_kg;
  if (f === 'gas') return 15.0 * ENERGY_FACTORS.natural_gas_scm;
  if (f === 'firewood') return 150.0 * ENERGY_FACTORS.firewood_kg;
  if (f === 'electric') return 60.0 * ENERGY_FACTORS.electricity_kwh;
  return null;
}

/**
 * Calculates daily home energy emissions per capita.
 * @param {Object} homeData - Household details.
 * @param {string} homeData.cookingFuel - 'lpg'|'electric'|'firewood'|'gas'.
 * @param {number} homeData.electricityKwhPerMonth - Monthly kWh.
 * @param {number} homeData.acHoursPerDay - AC run hours.
 * @param {number} homeData.householdSize - People in house.
 * @returns {number|Error} Daily kg CO2 per person or Error.
 * @throws {never}
 */
export function calculateHomeEmissions(homeData) {
  if (!homeData || typeof homeData !== 'object') {
    return new Error('Invalid input: homeData must be an object.');
  }
  const { cookingFuel, electricityKwhPerMonth, acHoursPerDay, householdSize } = homeData;
  if (typeof cookingFuel !== 'string' || typeof electricityKwhPerMonth !== 'number' ||
      typeof acHoursPerDay !== 'number' || typeof householdSize !== 'number' ||
      electricityKwhPerMonth < 0 || acHoursPerDay < 0 || householdSize <= 0) {
    return new Error('Invalid home energy parameters.');
  }
  const cookingKg = getCookingEmissions(cookingFuel);
  if (cookingKg === null) {
    return new Error(`Unknown cooking fuel: ${cookingFuel}`);
  }
  const electricityKg = electricityKwhPerMonth * ENERGY_FACTORS.electricity_kwh;
  const acKg = acHoursPerDay * 1.5 * 30.0 * ENERGY_FACTORS.electricity_kwh;
  
  const monthlyCapita = (cookingKg + electricityKg + acKg) / householdSize;
  return Number(((monthlyCapita * 12.0) / 365.0).toFixed(3));
}

/**
 * Calculates daily food emissions based on diet type.
 * @param {Object} foodData - Food habits.
 * @param {string} foodData.dietType - 'vegan'|'vegetarian'|'occasional_meat'|'regular_meat'|'heavy_meat'.
 * @returns {number|Error} Daily kg CO2 or Error.
 * @throws {never}
 */
export function calculateFoodEmissions(foodData) {
  if (!foodData || typeof foodData !== 'object') {
    return new Error('Invalid input: foodData must be an object.');
  }
  const { dietType } = foodData;
  if (typeof dietType !== 'string') {
    return new Error('Invalid dietType parameter.');
  }
  const value = FOOD_DIET_MAP[dietType.toLowerCase()];
  if (value === undefined) {
    return new Error(`Unknown diet type: ${dietType}`);
  }
  return Number(value.toFixed(3));
}

/** @type {Map<string, Object>} Memoization cache for footprint calculations. */
const footprintCache = new Map();

/**
 * Aggregates all categories into a total footprint.
 * Results are memoised by input hash — safe because this is a pure function.
 * @param {Object} userAnswers - Complete user responses.
 * @returns {Object|Error} Total footprint details or Error.
 * @throws {never}
 */
export function calculateTotalFootprint(userAnswers) {
  if (!userAnswers || typeof userAnswers !== 'object') {
    return new Error('Invalid input: userAnswers must be an object.');
  }
  const cacheKey = JSON.stringify(userAnswers);
  if (footprintCache.has(cacheKey)) {
    return footprintCache.get(cacheKey);
  }
  const result = _computeTotalFootprint(userAnswers);
  if (!(result instanceof Error)) {
    footprintCache.set(cacheKey, result);
  }
  return result;
}

/**
 * Internal computation for calculateTotalFootprint (not memoised).
 * @param {Object} userAnswers - Complete user responses.
 * @returns {Object|Error} Total footprint details or Error.
 * @throws {never}
 */
function _computeTotalFootprint(userAnswers) {
  const transportData = { ...userAnswers.transport };
  if (userAnswers.flights && typeof userAnswers.flights.flightsPerYear === 'number') {
    transportData.flightsPerYear = userAnswers.flights.flightsPerYear;
  }
  const transportDaily = calculateTransportEmissions(transportData);
  if (transportDaily instanceof Error) return transportDaily;
  const homeDaily = calculateHomeEmissions(userAnswers.home);
  if (homeDaily instanceof Error) return homeDaily;
  const foodDaily = calculateFoodEmissions(userAnswers.food);
  if (foodDaily instanceof Error) return foodDaily;

  const dailyTotal = transportDaily + homeDaily + foodDaily;
  const annualTotal = dailyTotal * 365.0;
  const score = kgToPlanetScore(annualTotal);

  return {
    totalKgPerDay: Number(dailyTotal.toFixed(3)),
    totalKgPerYear: Number(annualTotal.toFixed(3)),
    breakdown: {
      transport: Number((transportDaily * 365.0).toFixed(3)),
      home: Number((homeDaily * 365.0).toFixed(3)),
      food: Number((foodDaily * 365.0).toFixed(3))
    },
    planetScore: score,
    planetState: getPlanetState(score),
    comparedToIndiaAvg: Number(((annualTotal / 2200.0 - 1.0) * 100.0).toFixed(2)),
    comparedToGlobalAvg: Number(((annualTotal / 4700.0 - 1.0) * 100.0).toFixed(2))
  };
}
