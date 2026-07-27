// Shared helpers for rendering the trainings picker.
// Note: these are display-only. The persisted training string formats differ
// per form and are intentionally left alone here.

export const formatTrainingLabel = (training) =>
  `${training.name} - $${training.price}`;

// Groups trainings into price tiers, highest price first, so the picker can
// separate e.g. the $450 courses from the $350 ones. Anything without a usable
// price falls into a trailing "Other" bucket so nothing silently disappears.
export function groupTrainingsByPrice(trainings = []) {
  const buckets = new Map();
  const other = [];

  trainings.forEach((training) => {
    const price = parseFloat(training?.price);
    if (Number.isNaN(price)) {
      other.push(training);
      return;
    }
    if (!buckets.has(price)) buckets.set(price, []);
    buckets.get(price).push(training);
  });

  const groups = Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([price, items]) => ({ price, label: `$${price}`, items }));

  if (other.length > 0) {
    groups.push({ price: null, label: "Other", items: other });
  }

  return groups;
}
