# Carbon Mirror — Research & Design Findings

## 1. Problem Statement Analysis

The PromptWars Challenge 3 goal is building a carbon footprint
*awareness and behaviour-change* platform — not a precise calculator.
The primary user journey is: Unaware → Aware → Action → Habit.

Key insight: India's per-capita footprint (2.2T CO₂/year) is already
8× lower than the US average. The framing must be empowerment, not
guilt. "You're already doing well — here's how to lead."

## 2. User Pain Points Identified

- **Measurement fatigue**: Users disengage when required to enter
  precise numbers ("12.4 km driven", "250g beef eaten").
  Design decision: category-based quiz with sliders, not free text.

- **Abstraction deficit**: "1.4 kg CO₂" means nothing to most users.
  Design decision: planet health score (0-100) + relatable equivalents
  ("equivalent to charging 580 smartphones").

- **Guilt-driven churn**: High-emission alerts cause users to stop
  logging to avoid negative feedback.
  Design decision: visual metaphor (planet healing) over red warning bars.

- **Delayed gratification**: Individual actions seem pointless against
  global scale. Design decision: Community Forest shows collective city
  impact in real time.

## 3. India-First Design Decisions

Carbon Mirror is built for Indian users, not adapted from a Western template:
- Emission factors from CEA 2023 (Indian grid: 0.708 kg CO₂/kWh),
  not the US EPA default
- Quiz options: LPG cylinder, auto-rickshaw, Delhi/Mumbai/Bengaluru
  metro — not "natural gas furnace" or "subway"
- AI Coach advice references Indian products: Ola Electric S1 Pro,
  Ather 450X, BEE star ratings, UJALA LED program
- Currency: all savings shown in ₹ (Indian Rupee), not USD

## 4. Architecture Decisions & Trade-offs

| Decision | Chosen | Alternative | Reason |
|----------|--------|-------------|--------|
| State | Firestore + localStorage | Firebase Realtime DB | Better offline support, cost |
| Animation | Canvas API | WebGL / Three.js | Lighter, more accessible |
| AI | Gemini via Cloud Functions | Direct client API call | Security (key never exposed) |
| Auth | Firebase Auth (Google) | Supabase Auth | All-Google stack requirement |
| Testing | Jest + Node test runner | Playwright only | Lighter CI, faster unit feedback |

## 5. Emission Factors & Data Sources

| Category | Factor | Value | Unit | Source |
|----------|--------|-------|------|--------|
| Transport | Delhi Metro | 0.025 | kg CO₂/km | Delhi Metro Rail Corp. 2023 |
| Transport | Petrol car | 0.171 | kg CO₂/km | IPCC AR6, India average |
| Transport | Auto-rickshaw (CNG) | 0.058 | kg CO₂/km | IPCC AR6 |
| Energy | Indian grid electricity | 0.708 | kg CO₂/kWh | CEA 2023 |
| Energy | LPG | 2.983 | kg CO₂/kg | IPCC EFDB |
| Food | Beef | 27.0 | kg CO₂/kg | Our World in Data |
| Food | Vegetarian meal | 0.4–0.9 | kg CO₂/kg | FAO 2021 |

## 6. MVP Scope Decisions

**Included**: Footprint quiz, Planet visualisation, Action Lab,
AI Coach, Community Forest, Shareable card, Firebase full-stack

**Excluded (future roadmap)**:
- Google Fit sync for automatic activity logging
- Real-time electricity grid carbon intensity (CEA live API)
- Push notifications for daily logging streaks
- Multiplayer planet comparisons
