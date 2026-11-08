# TCA opening repertoires

The shop lives at `/openings`. A coach can create a product in **Manage repertoires**, upload a PGN, validate it, choose the training side and specify the exact line and number of half-moves available in the free preview. The editor accepts built-in covers and PNG, JPEG or WebP uploads. Prices are entered in HKD, with a minimum of HKD 4. A withdrawn product stays available to its owners. The suggested initial price for Aggressive Sicilian is HKD 29.

## Import and versions

The PGN parser checks the legality of every move from its chapter's actual FEN. It preserves the original chapter tree, nested alternatives, comments, annotations and drawings. Each root-to-leaf path counts as a line. The free preview returns a separate bounded array without alternate continuations or the study source URL. The backend checks the account before serving a full course, study or session. Coach access to the editor comes from the existing account role.

The initial `aggressive-sicilian` import reads a gzip-compressed, base64-encoded PGN from the private service variable `TCA_SICILIAN_PGN_GZIP`. Startup creates the sample only when that product does not exist. Product edits and later versions live in PostgreSQL. The paid PGN is excluded from the public repository and web assets. Set the seed variable locally to verify the actual six-chapter import in browser tests.

Changing the PGN or training side creates an immutable content version. Prices, covers and publication settings can be edited without creating a content version. An active purchase or grant includes its original version and subsequent updates. The dashboard version selector can reopen the purchased version. Progress is keyed by user, product and card, so an update preserves equivalent positions. A paused session continues on the version on which it started.

## Review policy

A card belongs to the learner's side. Its identity uses piece placement, side to move, castling rights, a legally available en-passant capture and the sorted set of expected UCI moves. Move counters do not affect identity. Equivalent transpositions share progress. All replies listed at the current fork are correct. A reply listed for the same position in a different context gets a context message and no penalty. Illegal moves also leave the review state unchanged.

Each card stores successes, misses, consecutive successes, the last twelve graded results with timestamps, mastery level, last review, interval in minutes and next due time. A new card initially has no persisted attempts. On consecutive correct answers the base intervals are 1 hour, 1 day, 3 days, 7 days, 14 days, 30 days, 60 days and 90 days. Later successes repeat at 90 days. Each miss among the last five answers reduces the base by 12%, with a 30-minute floor for a correct answer. A miss resets the streak and schedules the next review in 12 minus twice the number of recent misses, with a 2-minute floor. The first miss therefore schedules a 10-minute review. A missed card also returns once after up to two intervening prompts in its current session.

| Level | Condition |
| --- | --- |
| New | No graded answer |
| Learning | A miss or one consecutive success |
| In progress | Two or three consecutive successes |
| Mastered | Four or five consecutive successes |
| Consolidated | Six or more consecutive successes |

The learned percentage counts the last three levels. Mastered includes consolidated cards. Recent accuracy uses the latest 30 available timestamped results across the repertoire. The default session selects the oldest overdue cards first, followed by new cards in PGN order, up to 12 total and 8 new. Both limits are adjustable. When possible, new material follows the continuation actually chosen on the board. **Train this line** restricts the queue to the selected PGN path. Learning mode is ungraded. Session state and grades commit together. Duplicate answers at the same step cannot advance twice.

## Stripe configuration

The backend uses Stripe-hosted Checkout for single card payments in HKD. Card data stays with Stripe. Configure these variables on the existing TCA Railway service in the merchant's environment:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | The appropriate Stripe secret key for test or live mode |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint in the same Stripe mode |
| `TCA_STRIPE_MODE` | Defaults to `test` |
| `TCA_STRIPE_TEST_USERS` | Comma-separated TCA usernames allowed to use test checkout |
| `TCA_OPENINGS_ORIGIN` | Canonical HTTPS origin. Defaults to `https://` followed by `RAILWAY_PUBLIC_DOMAIN` |
| `TCA_OPENINGS_ALLOW_LIVE` | Set to `true` only after explicit commercial approval, together with live mode and live credentials |

Register `https://tcapuzzle-production.up.railway.app/api/openings/webhook` in the relevant Stripe dashboard. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` and `charge.refunded`. A signed paid event matching the stored order, purchaser, version, amount, currency and mode activates access. The browser return URL only displays status. Missing credentials keep checkout closed. A coach can grant a test learner access directly.

Test checkout is restricted to designated accounts. Use a dedicated learner for merchant testing. A successful Stripe test purchase grants that tester access and the order is marked as test in their purchase history. Coaches can request a full refund for an eligible order. Access from that order is revoked when Stripe confirms a full refund. A partial refund keeps access active. Staff can separately revoke or grant an account's access.

## Verification

Run `npm test` for the parser, scheduler, transpositions, alternate moves and billing configuration. Run `npm run test:e2e` with `TCA_TEST_DATABASE_URL` pointing at a local PostgreSQL database. Each run creates and drops a separate schema. The suite exercises administrative editing, access checks, study and training, a database-backed restart, independent login sessions and a local Checkout adapter using signed Stripe test webhook payloads. A merchant sandbox checkout against Stripe requires that merchant's test key and endpoint signing secret.
