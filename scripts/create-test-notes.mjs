import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "/Users/julian.ellehauge/personal/test-repo";
mkdirSync(DIR, { recursive: true });

const START = 1772700000;
const DAY = 86400;

const notes = [
  {
    title: "Project idea: local-first recipe manager",
    body: `Been thinking about building a recipe manager that works entirely offline. Store everything in markdown with YAML frontmatter for ingredients and cook time.

Key features:
- **Offline-first** with sync when connected
- Ingredient scaling (double, halve recipes)
- Shopping list generation from selected recipes

Could use CRDTs for conflict resolution if multiple devices edit the same recipe.`,
  },
  {
    title: "Morning standup notes",
    body: `Discussed the auth token refresh bug. Sarah found the root cause - we were caching expired tokens in localStorage without checking the \`exp\` claim.

Action items:
1. Fix token refresh logic (me, by EOD)
2. Add integration test for token expiry (Sarah, tomorrow)
3. Update the auth docs (deferred to next sprint)`,
  },
  {
    title: "Quick thought",
    body: `Need to remember to check the server logs before Friday. Something is eating disk space.`,
  },
  {
    title: "Reading notes: Designing Data-Intensive Applications",
    body: `## Chapter 5 - Replication

Three main replication strategies:

1. **Single-leader replication** - one node accepts writes, replicates to followers
2. **Multi-leader replication** - multiple nodes accept writes, must handle conflicts
3. **Leaderless replication** - any node accepts reads/writes (Dynamo-style)

> "The major difference between a thing that might go wrong and a thing that cannot possibly go wrong is that when a thing that cannot possibly go wrong goes wrong it usually turns out to be impossible to get at or repair."

Key insight: replication lag is not just a performance issue, it is a correctness issue. Read-after-write consistency matters more than people think.

### Questions to revisit
- How does CockroachDB handle multi-region replication?
- What are the practical limits of eventual consistency for user-facing apps?
- Compare Raft vs Paxos for leader election

The section on "happens-before" relationships and vector clocks was dense. Need to re-read with paper and pen.`,
  },
  {
    title: "Sourdough bread recipe",
    body: `## Ingredients

- 500g bread flour
- 350g water (70% hydration)
- 100g active starter
- 10g salt

## Method

1. Mix flour and water, autolyse for 30 minutes
2. Add starter and salt, mix thoroughly
3. Bulk ferment 4-6 hours at room temp, with stretch and folds every 30 min for first 2 hours
4. Shape and place in banneton
5. Cold retard in fridge 12-18 hours
6. Preheat dutch oven at 250C for 45 min
7. Bake covered 20 min, uncovered 20-25 min

**Tips:**
- The dough should feel like a wet pillow after bulk ferment
- Score decisively - hesitation makes ragged cuts
- Listen for the "singing" crackle when it comes out of the oven`,
  },
  {
    title: "Debugging the WebSocket reconnection",
    body: `Found the bug. The reconnection backoff was resetting to 0 on every failed attempt instead of incrementing.

\`\`\`javascript
// Before (broken)
function reconnect() {
  const delay = 0; // oops
  setTimeout(() => ws.connect(), delay);
}

// After (fixed)
let attempts = 0;
function reconnect() {
  const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
  attempts++;
  setTimeout(() => ws.connect(), delay);
}
\`\`\`

Also added a jitter factor to prevent thundering herd when the server restarts.`,
  },
  {
    title: "Weekend trip to Gothenburg",
    body: `Planning a quick weekend trip.

**Friday**
- Train departs 16:30 from Stockholm Central
- Check in at hotel by 21:00

**Saturday**
- Breakfast at Da Matteo (Magasinsgatan)
- Walk through Haga district
- Lunch at Feskekörka (the fish church market)
- Afternoon: Universeum or Konstmuseet depending on weather
- Dinner reservation at Sjöbaren, 19:00

**Sunday**
- Sleep in
- Brunch somewhere in Linné
- Train back at 15:00

Need to book: train tickets, hotel (check Scandic or Comfort), dinner reservation.`,
  },
  {
    title: "Vim keybindings I keep forgetting",
    body: `- \`ci"\` - change inside quotes
- \`da(\` - delete around parentheses
- \`gq\` - reflow text to textwidth
- \`ctrl-a\` / \`ctrl-x\` - increment/decrement number`,
  },
  {
    title: "Architecture decision: event sourcing for audit log",
    body: `## Context

We need a reliable audit log for compliance. Current approach of writing to a \`logs\` table is fragile - schema changes break old entries, and there is no way to reconstruct state at a given point in time.

## Decision

Adopt event sourcing for the audit subsystem only. Not for the whole app - that would be overkill.

## Consequences

**Positive:**
- Immutable event stream gives us perfect auditability
- Can replay events to reconstruct any past state
- Natural fit for the compliance team's query patterns

**Negative:**
- Additional infrastructure (event store, projections)
- Team needs to learn event sourcing patterns
- Eventual consistency between event store and read models

## Implementation notes

Use PostgreSQL with an append-only events table. No need for Kafka at our scale. Projections rebuild nightly or on-demand.

\`\`\`sql
CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actor_id UUID NOT NULL
);

CREATE INDEX idx_audit_aggregate ON audit_events(aggregate_id, created_at);
\`\`\`

Review with the team next Wednesday.`,
  },
  {
    title: "Grocery list",
    body: `- Oat milk
- Eggs
- Spinach
- Cherry tomatoes
- Feta cheese
- Olive oil (running low)
- Sourdough bread`,
  },
  {
    title: "Reflections on the quarter",
    body: `Three months in and the team velocity has genuinely improved. Not because we are working more hours but because we cut scope more aggressively and stopped context-switching between projects.

The biggest win was killing the notification microservice rewrite. It was a vanity project that would have taken two more months with marginal user impact. Instead we patched the existing service and moved on to the search improvements that users actually asked for.

Things to keep doing:
- Weekly scope reviews with the PM
- Saying no to "while we're at it" requests
- Pairing on complex PRs instead of async review

Things to improve:
- Still too many meetings on Tuesdays and Thursdays
- On-call rotation needs better runbooks
- Technical debt in the payments module is becoming a real drag`,
  },
  {
    title: "SSH config snippet for jump hosts",
    body: `\`\`\`
Host bastion
  HostName bastion.example.com
  User deploy
  IdentityFile ~/.ssh/id_ed25519

Host internal-*
  ProxyJump bastion
  User deploy
  IdentityFile ~/.ssh/id_ed25519

Host internal-db
  HostName 10.0.1.50

Host internal-api
  HostName 10.0.1.51
\`\`\`

This lets you \`ssh internal-db\` and it automatically jumps through the bastion.`,
  },
  {
    title: "Book recommendation: The Pragmatic Programmer",
    body: `Revisited this after five years and it holds up remarkably well. The "tracer bullet" metaphor is still one of the best ways to explain iterative development to non-engineers.

Favourite takeaways this time around:

> "Don't live with broken windows."

> "Be a catalyst for change."

The DRY principle chapter is worth re-reading annually. Not because the concept is hard, but because it is so easy to let duplication creep in when you are moving fast.`,
  },
  {
    title: "API rate limiting strategy",
    body: `We need rate limiting before the public API launch. Current thinking:

## Approach: Token bucket

- Each API key gets a bucket of 100 tokens
- Tokens replenish at 10/second
- Burst capacity: up to 100 requests instantly, then throttled
- Return \`429 Too Many Requests\` with \`Retry-After\` header

## Implementation

Redis-based counter with Lua script for atomicity:

\`\`\`lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, window)
end

if current > limit then
  return 0
end
return 1
\`\`\`

## Open questions

- Should we have different tiers? (free: 10/s, pro: 100/s, enterprise: custom)
- Do we count websocket messages against the limit?
- How do we handle rate limits for internal services?

Need to benchmark Redis performance under load before committing to this.`,
  },
  {
    title: "Morning pages",
    body: `Woke up early today. The light in March is starting to feel different - not quite spring but you can tell the days are getting longer.

Need to be more intentional about how I spend evenings. Too much doomscrolling. Maybe pick up the watercolour set again.`,
  },
  {
    title: "Docker compose for local dev",
    body: `\`\`\`yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  pgdata:
\`\`\`

Run with \`docker compose up -d\`. Access MailHog UI at http://localhost:8025.`,
  },
  {
    title: "Meeting: Q2 planning",
    body: `## Attendees
Product, engineering leads, design

## Key decisions

1. **Search overhaul** is the top priority for Q2
   - Full-text search with Elasticsearch
   - Faceted filtering
   - Search analytics dashboard
2. **Mobile app** pushed to Q3 - not enough design bandwidth
3. **Hiring**: approved one senior backend role, posting next week

## My action items
- Draft technical spec for search by March 15
- Review the Elasticsearch vs Meilisearch comparison Sarah put together
- Set up interviews for senior backend candidates`,
  },
  {
    title: "Tailwind CSS tips",
    body: `Some patterns I keep reaching for:

**Truncate text with ellipsis:**
\`\`\`html
<p class="truncate">Long text here...</p>
\`\`\`

**Responsive grid that actually works:**
\`\`\`html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
\`\`\`

**Sticky header with backdrop blur:**
\`\`\`html
<header class="sticky top-0 bg-white/80 backdrop-blur-sm">
\`\`\``,
  },
  {
    title: "Thinking about note-taking systems",
    body: `I have tried Notion, Obsidian, Bear, Apple Notes, and plain text files. Every system works for about three months before I abandon it.

The pattern is always the same:
1. Get excited about the tool
2. Spend too much time organizing instead of writing
3. The organizational overhead becomes a burden
4. Stop using it
5. Repeat

Maybe the answer is something radically simple. Just timestamped markdown files with no folders, no tags, no links. Search when you need to find something. The filesystem is the database.

That is basically what I am building with Soten. Let us see if I actually use it.`,
  },
  {
    title: "Postgres query optimization",
    body: `The dashboard query was taking 3.2 seconds. After adding a composite index and rewriting the subquery as a lateral join, it is down to 45ms.

**Before:**
\`\`\`sql
SELECT u.*, (
  SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.created_at > NOW() - INTERVAL '30 days'
) as recent_orders
FROM users u
WHERE u.active = true;
\`\`\`

**After:**
\`\`\`sql
SELECT u.*, COALESCE(o.cnt, 0) as recent_orders
FROM users u
LEFT JOIN LATERAL (
  SELECT COUNT(*) as cnt
  FROM orders o
  WHERE o.user_id = u.id
    AND o.created_at > NOW() - INTERVAL '30 days'
) o ON true
WHERE u.active = true;
\`\`\`

\`\`\`sql
CREATE INDEX idx_orders_user_recent ON orders(user_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '90 days';
\`\`\`

The partial index is the real hero here. Keeps the index small and focused.`,
  },
  {
    title: "Packing list for cabin trip",
    body: `**Clothing:**
- Wool base layers (top + bottom)
- Fleece jacket
- Shell jacket
- Warm hat and gloves
- Thick socks x3

**Gear:**
- Headlamp + extra batteries
- Thermos
- Map of the trail (do not rely on phone)

**Food:**
- Oatmeal packets
- Trail mix
- Dried sausage
- Coffee
- Chocolate`,
  },
  {
    title: "TypeScript utility types I actually use",
    body: `\`\`\`typescript
// Make specific properties optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Extract the resolved type of a Promise
type Awaited<T> = T extends Promise<infer U> ? U : T;

// Make all properties deeply readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Non-nullable version of a type
type Defined<T> = T extends undefined | null ? never : T;
\`\`\`

The \`PartialBy\` type is useful for builder patterns where some fields have defaults.`,
  },
  {
    title: "Feedback for the design review",
    body: `Overall the new dashboard design is strong. A few notes:

- The chart colours need better contrast for accessibility - the light blue and light green are nearly indistinguishable at small sizes
- Love the sparkline idea for the KPI cards
- The filter panel should probably be collapsible on mobile
- Consider adding a "last updated" timestamp somewhere prominent - users have asked for this twice`,
  },
  {
    title: "Learning Rust: ownership and borrowing",
    body: `## The three rules

1. Each value has exactly one owner
2. When the owner goes out of scope, the value is dropped
3. You can have either one mutable reference OR any number of immutable references (not both)

## Example that clicked

\`\`\`rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 is MOVED, not copied
    // println!("{}", s1); // ERROR: s1 no longer valid

    let s3 = s2.clone(); // explicit deep copy
    println!("{} {}", s2, s3); // both valid
}
\`\`\`

## Borrowing

\`\`\`rust
fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope but doesn't drop the String because it doesn't own it

fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1); // borrow s1
    println!("{} has length {}", s1, len); // s1 still valid
}
\`\`\`

The borrow checker is frustrating at first but it catches real bugs. Had a use-after-free in a C project last month that Rust would have caught at compile time.

Still struggling with lifetimes. Need to work through more examples.`,
  },
  {
    title: "Quick note: DNS propagation",
    body: `Changed the A record for api.example.com at 14:30. TTL was set to 3600 so it should propagate within an hour. Check with:

\`\`\`bash
dig +short api.example.com
\`\`\`

If it is still showing the old IP after an hour, flush the local DNS cache:
\`\`\`bash
sudo dscacheutil -flushcache
\`\`\``,
  },
  {
    title: "Film notes: Stalker (1979)",
    body: `Rewatched Tarkovsky's Stalker last night. It gets better every time.

The Zone is not really a place - it is a state of mind. The Stalker is the only one who truly believes in it, and his faith is what makes it real for him. The Writer and the Professor are too cynical, too attached to their intellectual frameworks to let go.

The long tracking shots through water and ruins are hypnotic. There is one shot where the camera drifts over submerged objects - coins, a syringe, a religious icon, a gun - that feels like archaeology of the unconscious.

> "Weakness is a great thing, and strength is nothing."

Need to watch Solaris again next.`,
  },
  {
    title: "Git workflow for feature branches",
    body: `Our branching strategy:

1. Create feature branch from \`main\`
2. Work in small commits
3. Before PR, rebase onto latest \`main\`
4. Squash merge into \`main\`
5. Delete feature branch after merge

**Useful commands:**
\`\`\`bash
# Start feature
git checkout -b feat/my-feature main

# Rebase before PR
git fetch origin
git rebase origin/main

# Interactive rebase to clean up commits
git rebase -i origin/main
\`\`\`

**Rules:**
- Never force-push to \`main\`
- Feature branches are ephemeral - do not treat them as long-lived
- If a branch lives longer than a week, something is wrong with the scope`,
  },
  {
    title: "Lunch spot: Kalf & Hansen",
    body: `Excellent sandwiches on Majstångsbacken. The roast beef with pickled onions is the move. Cash only (or Swish). Open until 15:00.`,
  },
  {
    title: "Ideas for the hackathon",
    body: `The company hackathon is in two weeks. Some ideas:

1. **CLI tool for our API** - generate a full CLI from the OpenAPI spec, would save devs from using curl
2. **Slack bot for deploy status** - polls the CI pipeline and posts updates to a channel
3. **Dark mode for the admin panel** - users have asked, it is mostly a Tailwind config change
4. **Automated changelog** - parse conventional commits and generate a changelog for each release

Leaning towards #1. It is useful, demo-able, and I can probably get a working prototype in a day using \`commander\` and \`inquirer\`.`,
  },
  {
    title: "Stretching routine",
    body: `Do this every morning, takes 10 minutes:

1. Cat-cow (1 min)
2. Downward dog to cobra flow (2 min)
3. Hip flexor stretch, each side (1 min each)
4. Hamstring stretch with strap (1 min each)
5. Shoulder stretch across body (30s each)
6. Neck rolls (1 min)

The hip flexor stretch is the most important one if you sit all day.`,
  },
  {
    title: "Refactoring plan: extract auth module",
    body: `The auth logic is scattered across five files. Time to consolidate.

## Current state

- \`src/api/middleware/auth.ts\` - JWT verification
- \`src/api/routes/login.ts\` - login endpoint
- \`src/api/routes/register.ts\` - registration endpoint
- \`src/lib/tokens.ts\` - token generation
- \`src/lib/passwords.ts\` - hashing and comparison

## Target state

\`\`\`
src/auth/
  index.ts          # public API
  middleware.ts      # JWT verification middleware
  routes.ts          # login + register endpoints
  tokens.ts          # token generation + verification
  passwords.ts       # hashing + comparison
  types.ts           # shared types
\`\`\`

## Migration steps

1. Create \`src/auth/\` directory
2. Move files, updating imports
3. Create \`index.ts\` barrel export
4. Update all consumers to import from \`src/auth\`
5. Run tests
6. Delete old files

Estimate: 2-3 hours. Should be a single PR.`,
  },
  {
    title: "Espresso dial-in notes",
    body: `**Beans:** Ethiopia Yirgacheffe, light roast, roasted 10 days ago
**Dose:** 18g in, 36g out (1:2 ratio)
**Grind:** Setting 12 on the Niche (finer than usual for this origin)
**Time:** 28 seconds

Taste: bright, floral, slight blueberry. A touch sour on the first few shots - went one step finer and it balanced out. The 28-second shot was the sweet spot.

Next time try a longer ratio (1:2.5) to see if it opens up more sweetness.`,
  },
  {
    title: "Monitoring checklist for production deploy",
    body: `Before deploying to production, verify:

- [ ] All CI checks pass (lint, types, tests, build)
- [ ] Staging environment tested manually
- [ ] Database migrations reviewed and tested
- [ ] Feature flags configured correctly
- [ ] Rollback plan documented
- [ ] On-call engineer notified

After deploying:

- [ ] Check error rates in Grafana (should not spike)
- [ ] Verify key user flows (login, search, checkout)
- [ ] Monitor response times for 15 minutes
- [ ] Check Sentry for new exceptions
- [ ] Update deploy log in Notion

If error rate exceeds 1% or p99 latency exceeds 2s, rollback immediately.`,
  },
  {
    title: "Random thought about abstractions",
    body: `Every abstraction is a bet that the things it hides will not matter. Good abstractions win that bet most of the time. Bad abstractions lose it constantly, forcing you to reach through the abstraction to fix things.

The trick is knowing when to abstract and when to leave things concrete. Too early and you abstract the wrong thing. Too late and duplication has already calcified.`,
  },
  {
    title: "Node.js streams cheat sheet",
    body: `\`\`\`javascript
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";
import { Transform } from "node:stream";

// Simple pipeline: read -> transform -> gzip -> write
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
});

await pipeline(
  createReadStream("input.txt"),
  upperCase,
  createGzip(),
  createWriteStream("output.txt.gz")
);
\`\`\`

Key things to remember:
- Always use \`pipeline\` instead of \`.pipe()\` - it handles errors and cleanup
- \`pipeline\` from \`stream/promises\` returns a promise (no callback needed)
- Backpressure is handled automatically by \`pipeline\`
- For object mode streams, set \`objectMode: true\` in the Transform options`,
  },
  {
    title: "Garden plan for spring",
    body: `Start seeds indoors by mid-March:
- Tomatoes (cherry and roma)
- Basil
- Peppers

Direct sow in May:
- Lettuce
- Radishes
- Carrots
- Dill

The raised bed needs new soil. Mix: 1/3 compost, 1/3 vermiculite, 1/3 peat moss (or coco coir as a sustainable alternative).

Last frost date here is usually around May 10. Do not put tomatoes out before then.`,
  },
  {
    title: "Debugging memory leak in production",
    body: `## Symptoms

Memory usage climbing steadily over 24 hours. RSS goes from 200MB to 1.2GB before the process gets OOM-killed.

## Investigation

1. Took heap snapshots at 0h, 6h, 12h
2. Compared snapshots in Chrome DevTools
3. Found growing array of event listener references in the WebSocket manager

## Root cause

Every time a client reconnects, we add a new \`message\` listener without removing the old one:

\`\`\`javascript
// Bug: listeners accumulate
ws.on("reconnect", () => {
  ws.on("message", handleMessage); // adds another listener every time
});
\`\`\`

## Fix

\`\`\`javascript
// Remove old listener before adding new one
ws.on("reconnect", () => {
  ws.removeAllListeners("message");
  ws.on("message", handleMessage);
});
\`\`\`

Or better, register the message handler once outside the reconnect callback.

## Lesson

Always check for listener leaks when dealing with reconnection logic. Node.js will warn you with "MaxListenersExceededWarning" if you set the threshold low enough:

\`\`\`javascript
ws.setMaxListeners(2); // will warn immediately on leak
\`\`\``,
  },
  {
    title: "Favourite command-line tools",
    body: `Tools I use daily that are not the obvious ones:

- **ripgrep** (\`rg\`) - faster grep, respects .gitignore
- **fd** - faster find with sane defaults
- **bat** - cat with syntax highlighting
- **jq** - JSON processing in the terminal
- **httpie** (\`http\`) - curl for humans
- **delta** - better git diff viewer
- **zoxide** (\`z\`) - smarter cd that learns your habits
- **fzf** - fuzzy finder for everything`,
  },
  {
    title: "Interview question bank",
    body: `Good questions I have been asked or have asked in interviews:

**System design:**
- Design a URL shortener (classic, good for gauging depth)
- Design a real-time collaborative editor
- How would you migrate a monolith to microservices?

**Behavioural:**
- Tell me about a time you shipped something you were not proud of
- How do you handle disagreements about technical direction?
- Describe a project where requirements changed significantly mid-way

**Coding:**
- Implement a debounce function
- LRU cache (tests understanding of data structures)
- Parse a cron expression (good for string manipulation + edge cases)

The best interviews feel like conversations, not interrogations.`,
  },
  {
    title: "CSS container queries",
    body: `Finally a way to make components responsive to their container, not just the viewport.

\`\`\`css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
\`\`\`

Browser support is good now - works in Chrome, Firefox, and Safari. No more ResizeObserver hacks for responsive components.`,
  },
  {
    title: "Weekly review",
    body: `## What went well
- Shipped the search feature on time
- Good pairing session with Alex on the caching layer
- Managed to keep Friday meeting-free

## What did not go well
- Underestimated the complexity of the CSV export
- Got pulled into an urgent bug that derailed Wednesday
- Did not exercise at all this week

## Next week priorities
1. Finish CSV export (max 2 days)
2. Start on the notification preferences page
3. Review Sarah's auth refactor PR
4. Actually go for a run at least twice`,
  },
  {
    title: "Nginx reverse proxy config",
    body: `\`\`\`nginx
upstream api {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

The \`keepalive 32\` and \`proxy_http_version 1.1\` are important for performance - without them, nginx opens a new connection for every request.`,
  },
  {
    title: "Thoughts on technical debt",
    body: `Not all technical debt is bad. Some of it is a deliberate trade-off: ship faster now, clean up later. The problem is when "later" never comes.

I think the metaphor breaks down because financial debt has clear terms - interest rate, repayment schedule. Technical debt is more like credit card debt where you do not know the interest rate until the bill arrives.

Three categories that help me prioritize:

1. **Reckless debt** - we did not know better. Fix ASAP, it will only get worse.
2. **Prudent debt** - we knew the trade-off. Schedule cleanup when the area is next touched.
3. **Bit rot** - the world changed around the code. Libraries updated, patterns evolved. Address during planned maintenance windows.

The worst kind is debt that lives in code nobody touches. It sits there for years until someone needs to modify it, and then it takes a week instead of a day.`,
  },
  {
    title: "Useful jq recipes",
    body: `\`\`\`bash
# Pretty print JSON
cat data.json | jq .

# Extract specific field from array of objects
cat users.json | jq '.[].name'

# Filter array
cat users.json | jq '[.[] | select(.age > 30)]'

# Transform shape
cat data.json | jq '{name: .title, count: .items | length}'

# Group by field
cat orders.json | jq 'group_by(.status) | map({status: .[0].status, count: length})'

# Flatten nested arrays
cat data.json | jq '[.. | .email? // empty]'
\`\`\`

The \`//\` operator is the alternative operator (like \`??\` in JS). Very useful for providing defaults.`,
  },
  {
    title: "Sleep hygiene notes",
    body: `Things that actually help me sleep better:

- No screens after 21:30 (hard but worth it)
- Room temperature around 18C
- Read fiction before bed, not non-fiction (non-fiction activates problem-solving mode)
- No caffeine after 14:00
- Consistent wake time, even on weekends`,
  },
  {
    title: "Kubernetes pod debugging",
    body: `Quick reference for when things go wrong:

\`\`\`bash
# Get pod status and events
kubectl describe pod <name>

# Stream logs
kubectl logs -f <pod-name> --tail=100

# Get logs from previous crashed container
kubectl logs <pod-name> --previous

# Exec into running pod
kubectl exec -it <pod-name> -- /bin/sh

# Check resource usage
kubectl top pods

# Get all events sorted by time
kubectl get events --sort-by='.lastTimestamp'

# Force delete stuck pod
kubectl delete pod <name> --grace-period=0 --force
\`\`\`

Most common issues:
- **CrashLoopBackOff** - check logs, usually a missing env var or bad config
- **ImagePullBackOff** - wrong image name or missing registry credentials
- **Pending** - not enough resources, check node capacity`,
  },
  {
    title: "Recipe: quick weeknight pasta",
    body: `**Aglio e olio (garlic and oil pasta)**

Takes 15 minutes. Feeds 2.

1. Boil 200g spaghetti in well-salted water
2. While pasta cooks: slice 4 cloves garlic thinly, heat 4 tbsp olive oil in a large pan over medium-low
3. Add garlic to oil, cook until just golden (not brown - it goes bitter)
4. Add a pinch of red pepper flakes
5. When pasta is 1 minute from done, transfer directly to the pan with tongs (bring some pasta water)
6. Toss vigorously, adding pasta water a splash at a time until you get a silky sauce
7. Finish with chopped parsley and more olive oil

The key is the pasta water - the starch emulsifies with the oil to create the sauce. Do not drain the pasta in a colander, transfer it directly.`,
  },
  {
    title: "Cloudflare Workers gotchas",
    body: `Things I have learned the hard way:

1. **No Node.js APIs** - no \`fs\`, no \`path\`, no \`child_process\`. Use Web APIs instead.
2. **CPU time limit is 10ms** on the free plan (50ms on paid). This is CPU time, not wall time - awaiting fetch does not count.
3. **No global mutable state between requests** - the runtime may reuse an isolate but you cannot depend on it.
4. **Request body can only be read once** - if you need to read it twice, clone the request first.
5. **Subrequests are limited** - 50 per request on free, 1000 on paid.

\`\`\`javascript
// Wrong: trying to read body twice
const body1 = await request.json();
const body2 = await request.json(); // throws

// Right: clone first
const clone = request.clone();
const body1 = await request.json();
const body2 = await clone.json();
\`\`\``,
  },
  {
    title: "Year goals check-in",
    body: `Reviewing my goals from January:

1. **Ship Soten** - In progress. Core features working, need polish.
2. **Read 24 books** - On track (6 finished by March).
3. **Run a half marathon** - Behind. Only running twice a week, need to increase.
4. **Learn Rust basics** - Started. Working through the Rust book, on chapter 10.
5. **Save X amount** - On track thanks to the bonus.
6. **Write 12 blog posts** - Behind. Only 1 published. Need to lower the bar for what counts as "good enough to publish."

Overall: 2 on track, 2 in progress, 2 behind. Not terrible for mid-March but need to pick up the pace on running and writing.`,
  },
  {
    title: "Colour theory basics for UI",
    body: `Notes from the design workshop:

**60-30-10 rule:**
- 60% dominant colour (background, large surfaces)
- 30% secondary colour (cards, sidebars)
- 10% accent colour (buttons, links, highlights)

**Contrast ratios (WCAG AA):**
- Normal text: minimum 4.5:1
- Large text (18px+ or 14px+ bold): minimum 3:1
- UI components and graphical objects: minimum 3:1

Useful tool: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

When in doubt, test with the Chrome DevTools accessibility panel. It shows contrast ratios right in the inspector.`,
  },
];

for (let i = 0; i < notes.length; i++) {
  const ts = START + i * DAY;
  const filename = `${ts}.md`;
  const content = `# ${notes[i].title}\n\n${notes[i].body}\n`;
  writeFileSync(join(DIR, filename), content);
}

console.log(`Created ${notes.length} notes in ${DIR}`);
