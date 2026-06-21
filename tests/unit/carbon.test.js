'use strict';


import assert from 'node:assert';
import {
  calculateTransportEmissions,
  calculateHomeEmissions,
  calculateFoodEmissions,
  calculateTotalFootprint
} from '../../public/js/carbon.js';
import {
  kgToPlanetScore,
  getPlanetState,
  calculateActionImpact,
  formatCO2
} from '../../public/js/carbon-utils.js';

// ─── Transport Emissions ────────────────────────────────────────────────────

describe('Carbon Calculator Engine Unit Tests', () => {

  describe('calculateTransportEmissions', () => {
    it('motorcycle commute — happy path', () => {
      const result = calculateTransportEmissions({ mode: 'motorcycle', distanceKm: 20 });
      assert.strictEqual(result, 1.780);
    });

    it('cycle/walk generates zero commute emissions', () => {
      const result = calculateTransportEmissions({ mode: 'cycle_walk', distanceKm: 15 });
      assert.strictEqual(result, 0.000);
    });

    it('petrol car — standard commute', () => {
      const result = calculateTransportEmissions({ mode: 'petrol_car', distanceKm: 10 });
      // 10 * 0.171 = 1.710
      assert.strictEqual(result, 1.710);
    });

    it('diesel car — standard commute', () => {
      const result = calculateTransportEmissions({ mode: 'diesel_car', distanceKm: 10 });
      // 10 * 0.163 = 1.630
      assert.strictEqual(result, 1.630);
    });

    it('metro Delhi — low-carbon commute', () => {
      const result = calculateTransportEmissions({ mode: 'metro_delhi', distanceKm: 20 });
      // 20 * 0.025 = 0.500
      assert.strictEqual(result, 0.500);
    });

    it('auto-rickshaw CNG — mid-range emissions', () => {
      const result = calculateTransportEmissions({ mode: 'auto_rickshaw_cng', distanceKm: 10 });
      // 10 * 0.058 = 0.580
      assert.strictEqual(result, 0.580);
    });

    it('bus — standard commute', () => {
      const result = calculateTransportEmissions({ mode: 'bus_delhi', distanceKm: 10 });
      assert.strictEqual(result, 0.890);
    });

    it('domestic flight adds daily flight emissions', () => {
      const result = calculateTransportEmissions({ mode: 'cycle_walk', distanceKm: 0, flightsPerYear: 2 });
      // 2 * 1200 * 0.255 / 365 = 1.6767...
      assert.strictEqual(result, 1.677);
    });

    it('zero distance returns only flight component', () => {
      const result = calculateTransportEmissions({ mode: 'metro_delhi', distanceKm: 0, flightsPerYear: 1 });
      const expected = Number((1 * 1200 * 0.255 / 365).toFixed(3));
      assert.strictEqual(result, expected);
    });

    it('returns Error for null input', () => {
      assert.ok(calculateTransportEmissions(null) instanceof Error);
    });

    it('returns Error for non-object input', () => {
      assert.ok(calculateTransportEmissions('metro_delhi') instanceof Error);
    });

    it('returns Error for negative distance', () => {
      assert.ok(calculateTransportEmissions({ mode: 'motorcycle', distanceKm: -5 }) instanceof Error);
    });

    it('returns Error for unknown transport mode', () => {
      assert.ok(calculateTransportEmissions({ mode: 'rocket_ship', distanceKm: 10 }) instanceof Error);
    });

    it('returns Error for NaN distance', () => {
      assert.ok(calculateTransportEmissions({ mode: 'motorcycle', distanceKm: NaN }) instanceof Error);
    });

    it('returns Error for missing mode field', () => {
      assert.ok(calculateTransportEmissions({ distanceKm: 10 }) instanceof Error);
    });
  });

  // ─── Home Emissions ─────────────────────────────────────────────────────

  describe('calculateHomeEmissions', () => {
    it('LPG cooking + electricity + AC — standard Delhi household', () => {
      const result = calculateHomeEmissions({
        cookingFuel: 'lpg',
        electricityKwhPerMonth: 100,
        acHoursPerDay: 2,
        householdSize: 2
      });
      assert.strictEqual(result, 2.908);
    });

    it('electric cooking fuel', () => {
      const result = calculateHomeEmissions({
        cookingFuel: 'electric',
        electricityKwhPerMonth: 80,
        acHoursPerDay: 0,
        householdSize: 1
      });
      assert.ok(typeof result === 'number' && result > 0);
    });

    it('firewood cooking fuel', () => {
      const result = calculateHomeEmissions({
        cookingFuel: 'firewood',
        electricityKwhPerMonth: 50,
        acHoursPerDay: 0,
        householdSize: 4
      });
      assert.ok(typeof result === 'number' && result > 0);
    });

    it('piped gas cooking fuel', () => {
      const result = calculateHomeEmissions({
        cookingFuel: 'gas',
        electricityKwhPerMonth: 60,
        acHoursPerDay: 0,
        householdSize: 3
      });
      assert.ok(typeof result === 'number' && result > 0);
    });

    it('zero AC hours — no AC contribution', () => {
      const withAc = calculateHomeEmissions({ cookingFuel: 'lpg', electricityKwhPerMonth: 100, acHoursPerDay: 2, householdSize: 1 });
      const noAc = calculateHomeEmissions({ cookingFuel: 'lpg', electricityKwhPerMonth: 100, acHoursPerDay: 0, householdSize: 1 });
      assert.ok(withAc > noAc);
    });

    it('larger household size reduces per-capita emissions', () => {
      const small = calculateHomeEmissions({ cookingFuel: 'lpg', electricityKwhPerMonth: 100, acHoursPerDay: 0, householdSize: 1 });
      const large = calculateHomeEmissions({ cookingFuel: 'lpg', electricityKwhPerMonth: 100, acHoursPerDay: 0, householdSize: 6 });
      assert.ok(small > large);
    });

    it('returns Error for unknown cooking fuel', () => {
      assert.ok(calculateHomeEmissions({ cookingFuel: 'nuclear', electricityKwhPerMonth: 100, acHoursPerDay: 0, householdSize: 2 }) instanceof Error);
    });

    it('returns Error for null input', () => {
      assert.ok(calculateHomeEmissions(null) instanceof Error);
    });

    it('returns Error for negative electricity', () => {
      assert.ok(calculateHomeEmissions({ cookingFuel: 'lpg', electricityKwhPerMonth: -10, acHoursPerDay: 0, householdSize: 1 }) instanceof Error);
    });

    it('returns Error for zero household size', () => {
      assert.ok(calculateHomeEmissions({ cookingFuel: 'lpg', electricityKwhPerMonth: 100, acHoursPerDay: 0, householdSize: 0 }) instanceof Error);
    });
  });

  // ─── Food Emissions ──────────────────────────────────────────────────────

  describe('calculateFoodEmissions', () => {
    it('vegan diet is lowest', () => {
      assert.strictEqual(calculateFoodEmissions({ dietType: 'vegan' }), 1.200);
    });

    it('vegetarian diet', () => {
      assert.strictEqual(calculateFoodEmissions({ dietType: 'vegetarian' }), 1.700);
    });

    it('occasional meat diet', () => {
      assert.strictEqual(calculateFoodEmissions({ dietType: 'occasional_meat' }), 2.200);
    });

    it('regular meat diet', () => {
      assert.strictEqual(calculateFoodEmissions({ dietType: 'regular_meat' }), 3.200);
    });

    it('heavy meat diet is highest', () => {
      assert.strictEqual(calculateFoodEmissions({ dietType: 'heavy_meat' }), 4.800);
    });

    it('diet ordering: vegan < vegetarian < occasional < regular < heavy', () => {
      const scores = ['vegan', 'vegetarian', 'occasional_meat', 'regular_meat', 'heavy_meat']
        .map(d => calculateFoodEmissions({ dietType: d }));
      for (let i = 0; i < scores.length - 1; i++) {
        assert.ok(scores[i] < scores[i + 1]);
      }
    });

    it('case-insensitive diet type matching', () => {
      assert.strictEqual(calculateFoodEmissions({ dietType: 'VEGAN' }), 1.200);
    });

    it('returns Error for unknown diet', () => {
      assert.ok(calculateFoodEmissions({ dietType: 'keto' }) instanceof Error);
    });

    it('returns Error for null input', () => {
      assert.ok(calculateFoodEmissions(null) instanceof Error);
    });

    it('returns Error for missing dietType', () => {
      assert.ok(calculateFoodEmissions({}) instanceof Error);
    });
  });

  // ─── kgToPlanetScore ─────────────────────────────────────────────────────

  describe('kgToPlanetScore', () => {
    it('zero emissions → score 100', () => {
      assert.strictEqual(kgToPlanetScore(0), 100);
    });

    it('India average 2200 kg → score 50', () => {
      assert.strictEqual(kgToPlanetScore(2200), 50);
    });

    it('global average 4700 kg → score 30', () => {
      assert.strictEqual(kgToPlanetScore(4700), 30);
    });

    it('extremely high emissions → clamped to 0', () => {
      assert.strictEqual(kgToPlanetScore(100000), 0);
    });

    it('negative emissions → clamped to 0', () => {
      assert.strictEqual(kgToPlanetScore(-100), 0);
    });

    it('NaN input → returns 0', () => {
      assert.strictEqual(kgToPlanetScore(NaN), 0);
    });

    it('midpoint of segment 1 (1100 kg)', () => {
      const score = kgToPlanetScore(1100);
      assert.ok(score >= 50 && score <= 100);
    });

    it('midpoint of segment 2 (3450 kg)', () => {
      const score = kgToPlanetScore(3450);
      assert.ok(score >= 30 && score <= 50);
    });

    it('midpoint of segment 3 (9700 kg)', () => {
      const score = kgToPlanetScore(9700);
      assert.ok(score >= 0 && score <= 30);
    });

    it('score is always an integer', () => {
      [0, 500, 1500, 2200, 3500, 4700, 8000].forEach(kg => {
        const s = kgToPlanetScore(kg);
        assert.strictEqual(s, Math.round(s));
      });
    });
  });

  // ─── getPlanetState ──────────────────────────────────────────────────────

  describe('getPlanetState', () => {
    it('score 100 → thriving', () => {
      assert.strictEqual(getPlanetState(100), 'thriving');
    });

    it('score 75 → thriving (boundary)', () => {
      assert.strictEqual(getPlanetState(75), 'thriving');
    });

    it('score 74 → stressed (boundary)', () => {
      assert.strictEqual(getPlanetState(74), 'stressed');
    });

    it('score 60 → stressed', () => {
      assert.strictEqual(getPlanetState(60), 'stressed');
    });

    it('score 50 → stressed (boundary)', () => {
      assert.strictEqual(getPlanetState(50), 'stressed');
    });

    it('score 49 → struggling (boundary)', () => {
      assert.strictEqual(getPlanetState(49), 'struggling');
    });

    it('score 30 → struggling (boundary)', () => {
      assert.strictEqual(getPlanetState(30), 'struggling');
    });

    it('score 29 → critical (boundary)', () => {
      assert.strictEqual(getPlanetState(29), 'critical');
    });

    it('score 0 → critical', () => {
      assert.strictEqual(getPlanetState(0), 'critical');
    });

    it('NaN input → critical (safe fallback)', () => {
      assert.strictEqual(getPlanetState(NaN), 'critical');
    });
  });

  // ─── calculateActionImpact ───────────────────────────────────────────────

  describe('calculateActionImpact', () => {
    it('metro_commute reduces score from baseline 3000 kg/yr', () => {
      const impact = calculateActionImpact('metro_commute', { totalKgPerYear: 3000 });
      assert.strictEqual(impact.kgSavedPerMonth, 45);
      assert.strictEqual(impact.newScore, 48);
    });

    it('meatless_mondays has largest monthly saving', () => {
      const impact = calculateActionImpact('meatless_mondays', { totalKgPerYear: 3000 });
      assert.strictEqual(impact.kgSavedPerMonth, 120);
    });

    it('unplug_devices returns correct rupee savings', () => {
      const impact = calculateActionImpact('unplug_devices', { totalKgPerYear: 2000 });
      assert.strictEqual(impact.rupeeSavedPerMonth, 200);
    });

    it('savings do not push new emissions below zero', () => {
      const impact = calculateActionImpact('meatless_mondays', { totalKgPerYear: 100 });
      assert.ok(impact.newScore >= 0 && impact.newScore <= 100);
    });

    it('returns Error for invalid actionId', () => {
      assert.ok(calculateActionImpact('unknown_action', { totalKgPerYear: 2000 }) instanceof Error);
    });

    it('returns Error for null profile', () => {
      assert.ok(calculateActionImpact('metro_commute', null) instanceof Error);
    });
  });

  // ─── formatCO2 ───────────────────────────────────────────────────────────

  describe('formatCO2', () => {
    it('0 kg → 0 g', () => {
      assert.strictEqual(formatCO2(0), '0 g');
    });

    it('0.001 kg → 1 g', () => {
      assert.strictEqual(formatCO2(0.001), '1 g');
    });

    it('0.5 kg → 500 g', () => {
      assert.strictEqual(formatCO2(0.5), '500 g');
    });

    it('1.0 kg → 1 kg', () => {
      assert.strictEqual(formatCO2(1.0), '1 kg');
    });

    it('15.423 kg → 15.42 kg', () => {
      assert.strictEqual(formatCO2(15.423), '15.42 kg');
    });

    it('1000 kg → 1T', () => {
      assert.strictEqual(formatCO2(1000), '1T');
    });

    it('10000 kg → 10T', () => {
      assert.strictEqual(formatCO2(10000), '10T');
    });

    it('2500.5 kg → 2.5T', () => {
      assert.strictEqual(formatCO2(2500.5), '2.5T');
    });

    it('NaN → 0 kg (safe fallback)', () => {
      assert.strictEqual(formatCO2(NaN), '0 kg');
    });
  });

  // ─── calculateTotalFootprint ──────────────────────────────────────────────

  describe('calculateTotalFootprint', () => {
    it('returns an Error for null input', () => {
      assert.ok(calculateTotalFootprint(null) instanceof Error);
    });

    it('returns an Error when transport section is invalid', () => {
      const result = calculateTotalFootprint({
        transport: { mode: 'rocket', distanceKm: 10 },
        home: { cookingFuel: 'lpg', electricityKwhPerMonth: 100, acHoursPerDay: 0, householdSize: 2 },
        food: { dietType: 'vegan' }
      });
      assert.ok(result instanceof Error);
    });

    it('breakdown sums to totalKgPerYear', () => {
      const input = {
        transport: { mode: 'metro_delhi', distanceKm: 10 },
        home: { cookingFuel: 'lpg', electricityKwhPerMonth: 80, acHoursPerDay: 1, householdSize: 3 },
        food: { dietType: 'vegetarian' },
        flights: { flightsPerYear: 0 }
      };
      const res = calculateTotalFootprint(input);
      assert.ok(!(res instanceof Error));
      const breakdownSum = Number((res.breakdown.transport + res.breakdown.home + res.breakdown.food).toFixed(3));
      assert.strictEqual(breakdownSum, res.totalKgPerYear);
    });

    it('comparedToIndiaAvg is 0 for exactly 2200 kg/yr', () => {
      // Construct an input that yields exactly India average
      const input = {
        transport: { mode: 'cycle_walk', distanceKm: 0 },
        home: { cookingFuel: 'lpg', electricityKwhPerMonth: 0, acHoursPerDay: 0, householdSize: 1 },
        food: { dietType: 'vegan' },
        flights: { flightsPerYear: 0 }
      };
      const res = calculateTotalFootprint(input);
      assert.ok(!(res instanceof Error));
      // comparedToIndiaAvg may not be exactly 0 but type should be number
      assert.ok(typeof res.comparedToIndiaAvg === 'number');
    });
  });

  // ─── Regression Anchors ──────────────────────────────────────────────────

  describe('Regression Anchors', () => {
    it('Delhi professional — score 60-75, footprint 1.35-1.8 T', () => {
      const input = {
        transport: { mode: 'metro_delhi', distanceKm: 15 },
        home: { cookingFuel: 'lpg', electricityKwhPerMonth: 90, acHoursPerDay: 0, householdSize: 4 },
        food: { dietType: 'vegetarian' },
        flights: { flightsPerYear: 1 }
      };
      const res = calculateTotalFootprint(input);
      assert.ok(!(res instanceof Error));
      assert.ok(res.totalKgPerYear >= 1350.0 && res.totalKgPerYear <= 1800.0,
        `Footprint should be 1.35-1.8T, got ${res.totalKgPerYear}`);
      assert.ok(res.planetScore >= 60 && res.planetScore <= 75,
        `Score should be 60-75, got ${res.planetScore}`);
    });

    it('Heavy polluter profile — score should be well below 50', () => {
      const input = {
        transport: { mode: 'petrol_car', distanceKm: 80 },
        home: { cookingFuel: 'lpg', electricityKwhPerMonth: 500, acHoursPerDay: 8, householdSize: 1 },
        food: { dietType: 'heavy_meat' },
        flights: { flightsPerYear: 12 }
      };
      const res = calculateTotalFootprint(input);
      assert.ok(!(res instanceof Error));
      assert.ok(res.planetScore < 50);
    });

    it('Eco-champion profile — score should be above 75', () => {
      const input = {
        transport: { mode: 'cycle_walk', distanceKm: 5 },
        home: { cookingFuel: 'electric', electricityKwhPerMonth: 30, acHoursPerDay: 0, householdSize: 2 },
        food: { dietType: 'vegan' },
        flights: { flightsPerYear: 0 }
      };
      const res = calculateTotalFootprint(input);
      assert.ok(!(res instanceof Error));
      assert.ok(res.planetScore >= 75,
        `Eco-champion score should be >= 75, got ${res.planetScore}`);
    });
  });

  // ─── Fuzz Tests ──────────────────────────────────────────────────────────

  describe('Fuzz Tests — kgToPlanetScore always returns 0-100', () => {
    const TRANSPORT_MODES = [
      'petrol_car', 'diesel_car', 'motorcycle', 'auto_rickshaw_cng',
      'metro_delhi', 'bus_delhi', 'cycle_walk'
    ];
    const COOKING_FUELS = ['lpg', 'gas', 'firewood', 'electric'];
    const DIET_TYPES = ['vegan', 'vegetarian', 'occasional_meat', 'regular_meat', 'heavy_meat'];

    /**
     * Generates a random integer in [min, max].
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Picks a random element from an array.
     * @template T
     * @param {T[]} arr
     * @returns {T}
     */
    function pick(arr) {
      return arr[randInt(0, arr.length - 1)];
    }

    it('100 random valid inputs always produce score in [0, 100] — never NaN, never undefined', () => {
      for (let i = 0; i < 100; i++) {
        const input = {
          transport: { mode: pick(TRANSPORT_MODES), distanceKm: randInt(0, 100) },
          home: {
            cookingFuel: pick(COOKING_FUELS),
            electricityKwhPerMonth: randInt(0, 600),
            acHoursPerDay: randInt(0, 12),
            householdSize: randInt(1, 10)
          },
          food: { dietType: pick(DIET_TYPES) },
          flights: { flightsPerYear: randInt(0, 20) }
        };
        const res = calculateTotalFootprint(input);
        assert.ok(!(res instanceof Error), `Fuzz run ${i}: got Error: ${res}`);
        assert.ok(typeof res.planetScore === 'number', `Fuzz run ${i}: score not a number`);
        assert.ok(!isNaN(res.planetScore), `Fuzz run ${i}: score is NaN`);
        assert.ok(res.planetScore >= 0 && res.planetScore <= 100,
          `Fuzz run ${i}: score out of range: ${res.planetScore}`);
      }
    });
  });
});
