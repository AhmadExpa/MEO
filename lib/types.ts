export type PaymentLinkType = "one_time" | "recurring";

export type RecurringInterval = "week" | "month" | "year";

export type OneTimePreset = {
  id: string;
  label: string;
  amountCents: number;
};

export type CustomAmountBounds = {
  minCents: number;
  maxCents: number;
};

export type RecurringPlan = {
  id: string;
  label: string;
  amountCents: number;
  interval: RecurringInterval;
  intervalCount: number;
  stripePriceId: string;
};

export type PaymentLinkConfig = {
  version: 1;
  reference: string;
  type: PaymentLinkType;
  title: string;
  description: string;
  currency: "usd";
  oneTime?: {
    presets: OneTimePreset[];
    custom?: CustomAmountBounds;
  };
  recurring?: {
    plans: RecurringPlan[];
  };
  expiresAt: number;
};

export type PublicPaymentLinkConfig = Omit<PaymentLinkConfig, "recurring"> & {
  recurring?: {
    plans: Omit<RecurringPlan, "stripePriceId">[];
  };
};

export type PaymentLinkCreateInput = {
  type: PaymentLinkType;
  title: string;
  description: string;
  presetAmounts?: string[];
  allowCustomAmount?: boolean;
  customMin?: string;
  customMax?: string;
  recurringPlans?: Array<{
    label: string;
    amount: string;
    interval: RecurringInterval;
    intervalCount: number;
  }>;
  expiresInHours?: number;
};

export type PaymentAttemptStatus =
  | "paid"
  | "pending"
  | "failed"
  | "cancelled"
  | "requires_action";

export type StripePaymentRow = {
  id: string;
  amountCents: number;
  currency: string;
  status: "succeeded" | "refunded" | "disputed" | "failed" | "uncaptured" | "pending";
  paymentMethod: string;
  description: string;
  customer: string;
  createdAt: string;
  refundedAt: string | null;
  declineReason: string | null;
};

export type StripeSummary = {
  all: number;
  succeeded: number;
  refunded: number;
  disputed: number;
  failed: number;
  cancelled: number;
  uncaptured: number;
};
