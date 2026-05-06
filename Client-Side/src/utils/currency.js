export const formatLkr = (amount) => {
  const numeric = Number(amount || 0);
  return numeric.toLocaleString("si-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  });
};

