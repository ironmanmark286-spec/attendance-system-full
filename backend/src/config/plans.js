// Single source of truth for subscription plan pricing (amounts in paise)
const PLANS = {
  MONTHLY: {
    label: "Monthly",
    amount: 499 * 100,
    months: 1,
    employeeLimit: 50,
  },
  YEARLY: {
    label: "Yearly",
    amount: 4999 * 100,
    months: 12,
    employeeLimit: null, // unlimited
  },
};

module.exports = PLANS;
