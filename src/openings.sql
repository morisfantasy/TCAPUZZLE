CREATE TABLE IF NOT EXISTS opening_products (
 slug text PRIMARY KEY, name text NOT NULL, description text NOT NULL, cover text NOT NULL,
 price integer NOT NULL CHECK(price BETWEEN 400 AND 1000000), published boolean NOT NULL DEFAULT false,
 current_version integer NOT NULL, revision integer NOT NULL DEFAULT 1,
 stats jsonb NOT NULL, preview jsonb NOT NULL, preview_ref jsonb NOT NULL, preview_depth integer NOT NULL
);
CREATE TABLE IF NOT EXISTS opening_versions (
 product text NOT NULL REFERENCES opening_products(slug), version integer NOT NULL,
 side char(1) NOT NULL, fingerprint text NOT NULL, pgn text NOT NULL, model jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(product,version)
);
CREATE TABLE IF NOT EXISTS opening_orders (
 id uuid PRIMARY KEY, user_id bigint NOT NULL REFERENCES users(id), product text NOT NULL,
 version integer NOT NULL, amount integer NOT NULL, name text NOT NULL, mode text NOT NULL,
 status text NOT NULL DEFAULT 'pending', stripe_id text UNIQUE, checkout_url text, expires_at timestamptz,
 intent text UNIQUE, refund_amount integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(product,version) REFERENCES opening_versions(product,version)
);
CREATE UNIQUE INDEX IF NOT EXISTS opening_one_checkout ON opening_orders(user_id,product) WHERE status='pending';
CREATE TABLE IF NOT EXISTS opening_access (
 user_id bigint NOT NULL REFERENCES users(id), product text NOT NULL, version integer NOT NULL, source text NOT NULL,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,product,source),
 FOREIGN KEY(product,version) REFERENCES opening_versions(product,version)
);
CREATE TABLE IF NOT EXISTS opening_progress (
 user_id bigint NOT NULL REFERENCES users(id), product text NOT NULL REFERENCES opening_products(slug),
 card text NOT NULL, state jsonb NOT NULL, PRIMARY KEY(user_id,product,card)
);
CREATE TABLE IF NOT EXISTS opening_sessions (
 id uuid PRIMARY KEY, user_id bigint NOT NULL REFERENCES users(id), product text NOT NULL, version integer NOT NULL,
 active boolean NOT NULL, state jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(product,version) REFERENCES opening_versions(product,version)
);
CREATE UNIQUE INDEX IF NOT EXISTS opening_session_active ON opening_sessions(user_id,product) WHERE active;
CREATE TABLE IF NOT EXISTS opening_stripe_events (id text PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS opening_stripe_refunds (intent text PRIMARY KEY, amount integer NOT NULL);
