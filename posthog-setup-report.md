<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Braza Scent Next.js App Router application. The following changes were made:

- **`instrumentation-client.ts`** (new): Client-side PostHog initialization using the Next.js 15.3+ instrumentation API, with EU host, reverse proxy, and exception tracking enabled.
- **`src/lib/posthog-server.ts`** (new): Server-side PostHog Node.js client for use in API routes and webhooks.
- **`next.config.ts`**: Added `/ingest` reverse proxy rewrites routing to `eu.i.posthog.com` and `eu-assets.i.posthog.com` to reduce ad-blocker interference.
- **`.env.local`**: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables set.
- **`src/store/cart.ts`**: `add_to_cart` and `remove_from_cart` events on every cart mutation.
- **`src/store/wishlist.ts`**: `wishlist_item_added` event when a product is added to the wishlist.
- **`src/store/auth.ts`**: `user_signed_up` and `user_signed_in` events with `posthog.identify()` to link events to known users; `posthog.reset()` on sign out.
- **`src/app/checkout/page.tsx`**: `checkout_started` event (with cart contents, totals, and shipping method) before Stripe redirect; `promo_code_applied` event on successful promo validation; `posthog.captureException` on payment errors.
- **`src/app/checkout/confirmation/page.tsx`**: `order_completed` event fired on the confirmation page.
- **`src/components/NewsletterPopup.tsx`**: `newsletter_subscribed` event on successful popup subscription.
- **`src/components/StockAlertForm.tsx`**: `stock_alert_subscribed` event on successful stock alert registration.
- **`src/app/quiz/page.tsx`**: `quiz_completed` event with all answers and top recommendation when the olfactive quiz finishes.
- **`src/app/api/webhook/stripe/route.ts`**: Server-side `order_created` event (with order number, totals, items count) and `payment_failed` event via the PostHog Node SDK.

## Events

| Event | Description | File |
|---|---|---|
| `add_to_cart` | User adds a product to the cart | `src/store/cart.ts` |
| `remove_from_cart` | User removes a product from the cart | `src/store/cart.ts` |
| `wishlist_item_added` | User adds a product to their wishlist | `src/store/wishlist.ts` |
| `user_signed_up` | User creates a new account (with identify) | `src/store/auth.ts` |
| `user_signed_in` | User signs into their account (with identify) | `src/store/auth.ts` |
| `checkout_started` | User submits checkout and is redirected to Stripe | `src/app/checkout/page.tsx` |
| `promo_code_applied` | User successfully applies a promo code | `src/app/checkout/page.tsx` |
| `order_completed` | User lands on the order confirmation page | `src/app/checkout/confirmation/page.tsx` |
| `newsletter_subscribed` | User subscribes via the newsletter popup | `src/components/NewsletterPopup.tsx` |
| `stock_alert_subscribed` | User subscribes to a stock-back-in-stock alert | `src/components/StockAlertForm.tsx` |
| `quiz_completed` | User completes the olfactive quiz | `src/app/quiz/page.tsx` |
| `order_created` | Server-side: order created after Stripe webhook | `src/app/api/webhook/stripe/route.ts` |
| `payment_failed` | Server-side: Stripe payment intent failed | `src/app/api/webhook/stripe/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/700839)
- [Checkout Conversion Funnel](/insights/woW8xgCG) — add_to_cart → checkout_started → order_completed steps
- [Orders Created Over Time](/insights/PWvS71hM) — daily order volume (server-side)
- [New User Signups](/insights/ZwfSYyw9) — daily unique signups bar chart
- [Newsletter & Stock Alert Subscriptions](/insights/k2soTZRs) — engagement lead-capture trend
- [Add to Cart vs Orders (Conversion Rate)](/insights/K0ojDALX) — weekly cart-to-purchase % formula

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
