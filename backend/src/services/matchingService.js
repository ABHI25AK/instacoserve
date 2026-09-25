const db = require('../config/database');
const { calculateHaversineDistance } = require('./geoService');

/**
 * Standard matching: weighted score of distance, rating, and current workload.
 * Formula: score = w1 * (1 / distance) + w2 * (rating / 5) + w3 * (1 / (1 + active_jobs))
 * 
 * @param {string} category - Service category (Electrician, Plumber, etc.)
 * @param {number} customerLat - Customer latitude
 * @param {number} customerLng - Customer longitude
 * @param {number} [federationId] - Optional federation filter
 * @returns {Array} List of matched verified workers ranked by composite score descending
 */
function findStandardMatch(category, customerLat, customerLng, federationId = null) {
  const w1 = 0.5; // Distance weight
  const w2 = 0.3; // Rating weight
  const w3 = 0.2; // Workload weight

  let query = `
    SELECT 
      w.user_id,
      w.federation_id,
      w.skill_category,
      w.rating_avg,
      w.jobs_completed,
      w.lat,
      w.lng,
      w.available,
      u.name as worker_name,
      u.phone as worker_phone,
      u.email as worker_email,
      f.name as federation_name,
      (
        SELECT COUNT(*) 
        FROM bookings b 
        WHERE b.worker_id = w.user_id 
          AND b.status IN ('matched', 'in_progress')
      ) as active_jobs
    FROM workers w
    JOIN users u ON u.id = w.user_id
    JOIN federations f ON f.id = w.federation_id
    WHERE w.verified = 1
      AND w.available = 1
      AND LOWER(w.skill_category) = LOWER(?)
  `;

  const params = [category];
  if (federationId) {
    query += ` AND w.federation_id = ?`;
    params.push(federationId);
  }

  const candidateWorkers = db.prepare(query).all(...params);

  if (!candidateWorkers || candidateWorkers.length === 0) {
    return [];
  }

  // Calculate composite score for each candidate
  const scoredWorkers = candidateWorkers.map((worker) => {
    const distanceKm = calculateHaversineDistance(
      customerLat,
      customerLng,
      worker.lat,
      worker.lng
    );

    // Safeguard against 0 distance
    const safeDistance = Math.max(distanceKm, 0.2);
    const distanceScore = 1 / safeDistance;
    const ratingScore = (worker.rating_avg || 5.0) / 5.0;
    const workloadScore = 1 / (1 + (worker.active_jobs || 0));

    const compositeScore = (w1 * distanceScore) + (w2 * ratingScore) + (w3 * workloadScore);

    // Estimate ETA based on 25 km/h urban speed + 5 min buffer
    const etaMinutes = Math.max(5, Math.round((distanceKm / 25) * 60) + 5);

    return {
      ...worker,
      distance_km: distanceKm,
      score: Math.round(compositeScore * 1000) / 1000,
      eta_minutes: etaMinutes,
      match_type: 'standard'
    };
  });

  // Sort descending by score
  scoredWorkers.sort((a, b) => b.score - a.score);

  return scoredWorkers;
}

/**
 * Emergency matching: distance-only ranking within a fixed radius (e.g. 10 km),
 * prioritizing emergency response time over optimality.
 * 
 * @param {string} category - Service category
 * @param {number} customerLat - Customer latitude
 * @param {number} customerLng - Customer longitude
 * @param {number} [maxRadiusKm=15] - Maximum search radius
 * @param {number} [federationId] - Optional federation filter
 * @returns {Array} List of matched verified workers ranked strictly by distance ascending
 */
function findEmergencyMatch(category, customerLat, customerLng, maxRadiusKm = 15, federationId = null) {
  let query = `
    SELECT 
      w.user_id,
      w.federation_id,
      w.skill_category,
      w.rating_avg,
      w.jobs_completed,
      w.lat,
      w.lng,
      w.available,
      u.name as worker_name,
      u.phone as worker_phone,
      u.email as worker_email,
      f.name as federation_name,
      (
        SELECT COUNT(*) 
        FROM bookings b 
        WHERE b.worker_id = w.user_id 
          AND b.status IN ('matched', 'in_progress')
      ) as active_jobs
    FROM workers w
    JOIN users u ON u.id = w.user_id
    JOIN federations f ON f.id = w.federation_id
    WHERE w.verified = 1
      AND w.available = 1
      AND LOWER(w.skill_category) = LOWER(?)
  `;

  const params = [category];
  if (federationId) {
    query += ` AND w.federation_id = ?`;
    params.push(federationId);
  }

  const candidateWorkers = db.prepare(query).all(...params);

  if (!candidateWorkers || candidateWorkers.length === 0) {
    return [];
  }

  const mappedWorkers = candidateWorkers
    .map((worker) => {
      const distanceKm = calculateHaversineDistance(
        customerLat,
        customerLng,
        worker.lat,
        worker.lng
      );
      const etaMinutes = Math.max(3, Math.round((distanceKm / 35) * 60) + 3);

      return {
        ...worker,
        distance_km: distanceKm,
        eta_minutes: etaMinutes,
        match_type: 'emergency'
      };
    })
    .filter((worker) => worker.distance_km <= maxRadiusKm);

  // Strictly proximity-first sort ascending by distance
  mappedWorkers.sort((a, b) => a.distance_km - b.distance_km);

  return mappedWorkers;
}

/**
 * Institutional matching (Phase 2 scaffold):
 * Routes institutional/community bookings to Federation Admin for manual / skill-matrix crew assignment.
 */
function assignInstitutionalCrew(bookingId, crewUserIds, note, approvedByAdminId) {
  // TODO: Phase 2 - Full crew roster assignment & multi-stage milestone tracking
  console.log(`[Institutional Matching Stub] Assigning crew to booking ${bookingId}:`, {
    crewUserIds,
    note,
    approvedByAdminId
  });

  const contract = db.prepare(`
    INSERT INTO institutional_contracts (booking_id, stage, assigned_crew_note, approved_by_user_id)
    VALUES (?, 'inspection', ?, ?)
    ON CONFLICT(booking_id) DO UPDATE SET
      assigned_crew_note = excluded.assigned_crew_note,
      approved_by_user_id = excluded.approved_by_user_id,
      updated_at = datetime('now')
  `).run(bookingId, note || 'Crew dispatched by federation admin', approvedByAdminId);

  return { success: true, contractId: contract.lastInsertRowid };
}

module.exports = {
  findStandardMatch,
  findEmergencyMatch,
  assignInstitutionalCrew
};
