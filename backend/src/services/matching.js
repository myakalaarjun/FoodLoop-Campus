const WEIGHTS = Object.freeze({ pickupFeasibility: 0.35, capacity: 0.30, deadline: 0.25, dietary: 0.10 });

export function scoreMatch(listing, recipient, now = new Date()) {
  const availability = recipient.organization?.pickupAvailability ?? [];
  const pickupStart = new Date(listing.pickupStart).getTime();
  const deadlineTime = new Date(listing.deadline).getTime();
  const pickupFeasibility = availability.length === 0 || availability.some(slot => {
    const time = new Date(slot).getTime();
    return Number.isFinite(time) && time >= pickupStart && time <= deadlineTime;
  }) ? 100 : 0;
  const capacity = recipient.organization?.capacity > 0
    ? Math.min(100, (recipient.organization.capacity / listing.quantity) * 100)
    : 0;
  const hoursLeft = (new Date(listing.deadline).getTime() - now.getTime()) / 3_600_000;
  const deadline = hoursLeft <= 0 ? 0 : Math.max(0, Math.min(100, 100 - (hoursLeft / 168) * 100));
  const needs = (recipient.organization?.dietaryNeeds ?? []).map(value => value.toLowerCase());
  const allergens = (listing.allergens ?? []).map(value => value.toLowerCase());
  const dietary = needs.some(need => allergens.includes(need)) ? 0 : 100;
  const components = { pickupFeasibility, capacity, deadline, dietary };
  const score = Math.round(Object.entries(WEIGHTS).reduce((total, [key, weight]) => total + components[key] * weight, 0));
  return {
    score,
    eligible: hoursLeft > 0 && listing.quantityAvailable > 0 && (recipient.organization?.capacity ?? 0) > 0 && dietary > 0 && pickupFeasibility > 0,
    components,
    weights: WEIGHTS,
    explanation: [
      `Pickup feasibility ${pickupFeasibility}/100 (35%)`,
      `Capacity ${capacity}/100 (30%)`,
      `Deadline urgency ${deadline}/100 (25%)`,
      `Dietary compatibility ${dietary}/100 (10%)`
    ]
  };
}
