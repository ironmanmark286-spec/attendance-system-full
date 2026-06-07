const DEFAULT_COMPANY_SETTINGS = {
  ai_assistant: true,
  payslips: true,
  leave_management: true,
  notice_board: true,
  overtime_tracking: true,
  bulk_employee_gen: false,
};

function getSettingsForPlan(plan) {
  const settings = { ...DEFAULT_COMPANY_SETTINGS };
  if (plan === "YEARLY") {
    settings.bulk_employee_gen = true;
  }
  return settings;
}

module.exports = { DEFAULT_COMPANY_SETTINGS, getSettingsForPlan };
