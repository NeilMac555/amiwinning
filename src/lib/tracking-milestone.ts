export const TRACKING_MILESTONES = [
  { minimum: 5000, label: "Tracking master" },
  { minimum: 1000, label: "Tracking veteran" },
  { minimum: 500, label: "Consistent tracker" },
  { minimum: 100, label: "Record keeper" },
] as const;

export function trackingMilestone(count: number) {
  return TRACKING_MILESTONES.find((milestone) => count >= milestone.minimum);
}
