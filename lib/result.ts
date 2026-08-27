export type CustomerResultState = "paid" | "failed" | "cancelled" | "pending" | "requires_action";

export function safeFailureMessage(code: string | null): string {
  switch (code) {
    case "insufficient_funds":
    case "partner_insufficient_funds":
      return "Your bank could not approve this payment because funds or available credit were unavailable. Try another card or contact your bank.";
    case "incorrect_address":
    case "incorrect_zip":
    case "incorrect_cvc":
    case "incorrect_number":
    case "expired_card":
    case "invalid_cvc":
    case "invalid_expiry_month":
    case "invalid_expiry_year":
    case "invalid_number":
      return "Please check your card and billing details, then try again.";
    case "authentication_required":
    case "authentication_not_handled":
    case "mobile_device_authentication_required":
      return "Your bank requires an additional security verification. Return to checkout and complete the verification prompt.";
    case "do_not_honor":
    case "generic_decline":
    case "fraudulent":
    case "merchant_blacklist":
    case "transaction_not_allowed":
    default:
      return "Your bank or payment security system could not approve this payment. Try another card or contact your bank for help.";
  }
}
