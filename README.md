# ElevenOrbits Checkout

Stateless public payment portal for ElevenOrbits. Customers visit one URL, choose a one-time or recurring amount, and continue to Stripe-hosted Checkout. Stripe is the source of truth: the app does not use a customer/payment database and does not run recurring billing jobs.

## What the app does

- Public customer portal at `/` for one-time or recurring payments.
- Customers choose from presets or enter a bounded custom amount.
- Recurring checkout creates the Stripe Product/Price for that request; Stripe owns all future billing.
- Optional legacy payment links remain available through the merchant dashboard API.
- Customers do not create accounts and never receive Stripe credentials.
- Stripe-hosted Checkout collects card details, billing address, CVC, and any required 3DS/issuer verification.
- Stripe Billing owns recurring invoices, charges, retries, payment methods, and subscriptions.
- The read-only dashboard queries Stripe directly and does not mirror data locally.

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local`.
3. Add a Stripe test secret key and long random `PAYMENT_LINK_SECRET`/`AUTH_SECRET` values.
4. Generate a merchant password hash:

   ```bash
   npm run hash-password -- "replace-with-a-strong-password"
   ```

5. Put the printed value in `MERCHANT_PASSWORD_HASH`.
6. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Open http://localhost:3000/ for the customer portal or http://localhost:3000/login for the merchant dashboard.

## Customer payment flow

1. Send customers the public portal URL.
2. They choose one-time or recurring, select an amount, and continue.
3. Stripe-hosted Checkout collects their details and handles card verification.
4. The result page shows whether the payment succeeded, failed, was cancelled, or needs more verification.

No payment link needs to be created or sent for the normal customer flow.

## Stripe configuration before live mode

In the ElevenOrbits Stripe Dashboard:

- Set the business/public name and Checkout branding to ElevenOrbits.
- Set an accurate statement descriptor close to `ELEVENORBITS`; Stripe and card issuers may shorten or format it.
- Configure support email, support phone, website, terms, privacy, and refund/cancellation policies.
- Enable Stripe Billing Customer Portal.
- Enable Smart Retries and appropriate failed-payment emails.
- Use test mode first, including successful payments, declines, and 3DS.

Checkout Sessions also apply ElevenOrbits display name, colors, font, rounded controls, and an optional logo URL. For live Checkout logos, set `ELEVENORBITS_LOGO_URL` to an HTTPS URL reachable by Stripe. The bundled `/elevenorbits-logo.svg` can be used after deploying the app at an HTTPS domain.

The static statement descriptor and receipt/invoice business identity are account-level Stripe settings. They are intentionally not changed by customer requests: configure them in Stripe Dashboard so Stripe can validate them against your verified business or DBA name.

The app intentionally uses card Checkout only in v1. It does not collect OTPs, full card numbers, CVVs, or Stripe passwords itself.
