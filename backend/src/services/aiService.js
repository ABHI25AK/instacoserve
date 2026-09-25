const axios = require('axios');
const env = require('../config/env');
const db = require('../config/database');

/**
 * Two-tier Natural Language Intent Extractor:
 * Maps free-text query (e.g., "water leaking in bathroom ceiling urgently") to:
 * { category, mode, urgency, confidence, clarifyingQuestion }
 */
async function extractSearchIntent(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return {
      category: 'Plumber',
      mode: 'household',
      urgency: 'normal',
      confidence: 0.5,
      clarifyingQuestion: null
    };
  }

  // Tier 1: Real LLM API if key is configured
  if (env.OPENAI_API_KEY) {
    try {
      const response = await axios.post(
        `${env.OPENAI_BASE_URL}/chat/completions`,
        {
          model: env.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an AI intent extractor for a gig services cooperative platform (InstaCoServe).
Categories available: Electrician, Plumber, Carpenter, Domestic Help, Caregiver, Painter.
Modes available: household, community (for institutions, schools, panchayats, societies).
Urgency: normal, emergency.
Respond ONLY with a valid JSON object:
{
  "category": "Electrician"|"Plumber"|"Carpenter"|"Domestic Help"|"Caregiver"|"Painter",
  "mode": "household"|"community",
  "urgency": "normal"|"emergency",
  "confidence": number between 0 and 1,
  "clarifyingQuestion": string or null
}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const parsed = JSON.parse(response.data.choices[0].message.content);
      return parsed;
    } catch (err) {
      console.warn('[AI Service] LLM API call failed, using rule-based fallback:', err.message);
    }
  }

  // Tier 2: Rule-Based Fallback
  return fallbackIntentExtraction(prompt);
}

function fallbackIntentExtraction(prompt) {
  const text = prompt.toLowerCase();

  // Mode detection
  const isCommunity = /panchayat|school|hospital|office|institution|community hall|society complex|government/i.test(text);
  const mode = isCommunity ? 'community' : 'household';

  // Urgency detection
  const isEmergency = /emergency|urgent|immediate|right now|sparking|flooding|water pipe burst|fire hazard|shock|asap/i.test(text);
  const urgency = isEmergency ? 'emergency' : 'normal';

  // Category heuristics
  let category = 'Plumber';
  let confidence = 0.85;
  let clarifyingQuestion = null;

  if (/electric|light|fan|switch|short circuit|wire|fuse|power|ac repair|mcb/i.test(text)) {
    category = 'Electrician';
  } else if (/plumb|leak|tap|pipe|drain|sink|toilet|water tank|flush|faucet|sewage/i.test(text)) {
    category = 'Plumber';
  } else if (/carpent|wood|door|window|furniture|table|chair|lock|hinge|cabinet/i.test(text)) {
    category = 'Carpenter';
  } else if (/clean|maid|cook|domestic|sweep|mop|utensils|housekeep|washing/i.test(text)) {
    category = 'Domestic Help';
  } else if (/care|nurse|elderly|patient|baby|infant|attendant|disabled|senior/i.test(text)) {
    category = 'Caregiver';
  } else if (/paint|whitewash|wall color|waterproof|primer|distemper|texture/i.test(text)) {
    category = 'Painter';
  } else {
    confidence = 0.45;
    category = 'Plumber';
    clarifyingQuestion = 'Could you specify what kind of service or repair you need? (e.g., electrical, plumbing, carpentry, cleaning)';
  }

  return {
    category,
    mode,
    urgency,
    confidence,
    clarifyingQuestion
  };
}

/**
 * Two-tier Conversational Assistant:
 */
async function generateChatbotResponse(userMessage, conversationHistory = []) {
  if (!userMessage || typeof userMessage !== 'string') {
    return 'How can I assist you with your cooperative services today?';
  }

  // Tier 1: Real LLM API if key configured
  if (env.OPENAI_API_KEY) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are SahakarBot, the intelligent assistant for SahakarSeva / InstaCoServe, a cooperative gig platform backed by the Ministry of Cooperation.
Explain pricing transparency (zero commissions, workers keep >95% earnings, flat subscription), booking steps, dispute rules, and worker welfare fund benefits.`
        },
        ...conversationHistory.slice(-5),
        { role: 'user', content: userMessage }
      ];

      const response = await axios.post(
        `${env.OPENAI_BASE_URL}/chat/completions`,
        {
          model: env.OPENAI_MODEL,
          messages,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.data.choices[0].message.content;
    } catch (err) {
      console.warn('[AI Service] LLM chatbot failed, using rule-based fallback:', err.message);
    }
  }

  // Tier 2: Rule-Based Fallback
  return fallbackChatbotResponse(userMessage);
}

function fallbackChatbotResponse(message) {
  const text = message.toLowerCase();

  if (/hi|hello|namaste|hey/i.test(text)) {
    return "Namaste! Welcome to SahakarSeva / InstaCoServe. I'm your cooperative assistant. You can ask me about booking verified workers, pricing splits, dispute policies, or emergency requests.";
  }

  if (/price|pricing|cost|commission|fee|split/i.test(text)) {
    return "At InstaCoServe, our cooperative model eliminates private middlemen. 96% of the service fee goes directly to the verified cooperative worker, 2% covers payment gateway charges, and 2% feeds the Federation Worker Welfare & Insurance Fund. No hidden surge pricing!";
  }

  if (/emergency|urgent|immediate/i.test(text)) {
    return "When you toggle 'Emergency Request' during booking, our matching engine immediately prioritizes the closest available verified worker using proximity-first routing within a tight radius.";
  }

  if (/dispute|complaint|refund|bad service|problem/i.test(text)) {
    return "If you're unsatisfied with a service (under 3 stars), you can raise a dispute in 'My Bookings' with photo evidence. The booking payment is automatically frozen in escrow while your local Labour Cooperative Federation Admin reviews and resolves the case.";
  }

  if (/welfare|fund|insurance|benefit/i.test(text)) {
    return "Every completed booking contributes 2% to the Federation Welfare Fund. This fund supports worker healthcare, accident coverage, and skill upskilling programs administered by the federation.";
  }

  if (/worker|join|register as worker|verification/i.test(text)) {
    return "Workers can register by choosing their affiliated Labour Cooperative Federation and primary trade. Your federation admin will verify your credentials, after which you can toggle 'Available' to receive direct bookings.";
  }

  if (/institutional|panchayat|bulk|school|society/i.test(text)) {
    return "For community or institutional projects (e.g. panchayat maintenance, school repairs), select 'Community / Institutional' mode. Your Federation Admin will inspect the requirement and assign an official skilled crew.";
  }

  return "I'm here to help with all cooperative service questions. You can ask about booking a service, worker verification, payment splits, welfare funds, or raising a dispute.";
}

/**
 * AI Demand Forecasting using Ordinary Least Squares (OLS) Linear Regression:
 * 
 * Takes historical daily booking counts for a given category & federation,
 * computes slope (beta) and intercept (alpha), and predicts the next 7 days volume
 * along with trend direction ('rising', 'falling', 'stable').
 */
function forecastDemand(federationId, category) {
  // Query past 30 days daily counts
  const history = db.prepare(`
    SELECT 
      date(created_at) as booking_date,
      COUNT(*) as count
    FROM bookings b
    JOIN workers w ON w.user_id = b.worker_id
    WHERE w.federation_id = ? 
      AND LOWER(b.category) = LOWER(?)
      AND b.created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY booking_date ASC
  `).all(federationId, category);

  // If no history, provide baseline based on overall platform metrics
  let dataPoints = history.map((row, idx) => ({ x: idx + 1, y: row.count, date: row.booking_date }));

  if (dataPoints.length < 2) {
    // Generate synthesized realistic 14-day history for cold-start demo
    dataPoints = Array.from({ length: 14 }, (_, i) => ({
      x: i + 1,
      y: Math.max(1, Math.round(3 + (i * 0.25) + (Math.sin(i) * 1.2))),
      date: new Date(Date.now() - (14 - i) * 86400000).toISOString().split('T')[0]
    }));
  }

  // OLS Linear Regression Computation:
  // n = number of points
  // beta = (n*sum(x*y) - sum(x)*sum(y)) / (n*sum(x^2) - (sum(x))^2)
  // alpha = (sum(y) - beta*sum(x)) / n
  const n = dataPoints.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const { x, y } = dataPoints[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = (n * sumXX) - (sumX * sumX);
  const slope = denominator !== 0 ? ((n * sumXY) - (sumX * sumY)) / denominator : 0;
  const intercept = (sumY - (slope * sumX)) / n;

  // Determine trend direction
  let trendDirection = 'stable';
  if (slope > 0.08) {
    trendDirection = 'rising';
  } else if (slope < -0.08) {
    trendDirection = 'falling';
  }

  // Generate 7-day forecast
  const forecast = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const forecastX = n + i;
    const predictedValue = Math.max(0, Math.round((intercept + slope * forecastX) * 10) / 10);
    const forecastDate = new Date(today.getTime() + i * 86400000).toISOString().split('T')[0];

    forecast.push({
      day: `Day +${i}`,
      date: forecastDate,
      predicted_bookings: predictedValue
    });
  }

  return {
    category,
    federation_id: federationId,
    trend_direction: trendDirection,
    growth_rate_per_day: Math.round(slope * 100) / 100,
    historical_data: dataPoints.slice(-10),
    forecast_7_days: forecast,
    total_predicted_next_week: Math.round(forecast.reduce((acc, f) => acc + f.predicted_bookings, 0))
  };
}

module.exports = {
  extractSearchIntent,
  generateChatbotResponse,
  forecastDemand
};
