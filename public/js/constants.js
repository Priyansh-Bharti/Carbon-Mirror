'use strict';

/**
 * @fileoverview Application-wide constants for Carbon Mirror.
 * Grounded in IPCC, MoEFCC, and official Indian sustainability sources.
 */

// Firestore Collection Names
export const DB_COLLECTIONS = {
  USERS: 'users',
  FOOTPRINTS: 'footprints',
  FOREST: 'forest'
};

// Planet Score States
export const SCORE_STATES = {
  THRIVING: 'thriving',
  STRESSED: 'stressed',
  STRUGGLING: 'struggling',
  CRITICAL: 'critical'
};

// Indian & Global Benchmarks (Tons CO2e per year)
export const CARBON_AVERAGES = {
  INDIA: 2.2, // India average footprint (Tons/Yr)
  GLOBAL: 4.7 // Global average footprint (Tons/Yr)
};

// Transport Emissions Factors (kg CO2 per km)
export const TRANSPORT_FACTORS = {
  petrol_car: 0.171,        // IPCC AR6, India average
  diesel_car: 0.163,        // IPCC AR6, India average
  motorcycle: 0.089,        // IPCC AR6, India average
  auto_rickshaw_cng: 0.058, // IPCC AR6, India average
  metro_delhi: 0.025,       // Delhi Metro Rail Corp. 2023 Sustainability Report
  bus_delhi: 0.089,         // Delhi Transport Corporation
  cycle_walk: 0.000,        // Zero emissions
  domestic_flight: 0.255,   // per km per passenger, ICAO 2023
  international_flight: 0.195 // per km per passenger, ICAO 2023
};

// Home Energy Emissions Factors (kg CO2 per unit)
export const ENERGY_FACTORS = {
  electricity_kwh: 0.708,   // India grid emission factor, CEA 2023
  lpg_kg: 2.983,            // per kg of LPG, MoEFCC
  natural_gas_scm: 2.100,   // per standard cubic metre, MoEFCC
  firewood_kg: 1.580        // per kg of wood, IPCC
};

// Food Emissions Factors (kg CO2 per kg or unit)
export const FOOD_FACTORS = {
  beef: 27.0,               // IPCC / Global average
  chicken: 6.9,             // IPCC / Global average
  eggs_dozen: 3.6,          // per dozen, IPCC
  dairy_litre: 3.2,         // per litre of milk, India average MoEFCC
  rice_kg: 2.7,             // India paddy average, MoEFCC
  vegetables_kg: 0.4,       // MoEFCC
  pulses_kg: 0.9            // MoEFCC
};

/**
 * Daily kg CO2 emissions by diet archetype.
 * Values sourced from IPCC AR6 Working Group III, Chapter 12 (Food Systems).
 * Placed in constants to allow carbon.js to stay within the 200-line limit
 * and to make adding new diet categories a constants-only change.
 */
export const FOOD_DIET_MAP = {
  vegan: 1.2,           // IPCC: lowest footprint diet archetype
  vegetarian: 1.7,      // IPCC: lacto-ovo vegetarian, India context
  occasional_meat: 2.2, // IPCC: <50g meat/day average
  regular_meat: 3.2,    // IPCC: 50-100g meat/day average
  heavy_meat: 4.8       // IPCC: >100g meat/day, India meat-heavy urban profile
};


// Actions and Mitigation Goals
export const ACTIONS = {
  metro_commute: {
    id: 'metro_commute',
    name: 'Switch Metro for Auto',
    kgSavedPerMonth: 45,
    rupeeSavedPerMonth: 1200
  },
  air_dry_clothes: {
    id: 'air_dry_clothes',
    name: 'Air-dry Clothes',
    kgSavedPerMonth: 20,
    rupeeSavedPerMonth: 400
  },
  meatless_mondays: {
    id: 'meatless_mondays',
    name: 'Meatless Mondays',
    kgSavedPerMonth: 120,
    rupeeSavedPerMonth: 850
  },
  unplug_devices: {
    id: 'unplug_devices',
    name: 'Unplug Devices',
    kgSavedPerMonth: 10,
    rupeeSavedPerMonth: 200
  }
};

/**
 * The fallback baseline footprint to use when user data is incomplete or missing.
 * Prevents magic objects from littering UI controllers.
 * @constant {Object}
 */
export const DEFAULT_BASELINE_FOOTPRINT = {
  totalKgPerYear: 2200,
  breakdown: {
    transport: 800,
    home: 800,
    food: 600
  },
  planetScore: 50,
  planetState: 'stressed'
};
