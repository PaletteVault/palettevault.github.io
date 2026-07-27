# Connecting Firebase Realtime Database

Step by step, roughly ten minutes. No user accounts, no authentication and no
paid plan — the free Spark tier has plenty of headroom for this.

> **Note:** the site works fine without Firebase. Likes live in `localStorage`
> and only the `/popular/` page stays empty, so this can be done at any point.

---

## Step 1. Create a project

1. Open [console.firebase.google.com](https://console.firebase.google.com/) and
   sign in.
2. **Create a project** (or **Add project**).
3. Name it, for example `palette-vault`. Firebase appends a suffix if the name
   is taken, so the final Project ID looks like `palette-vault-a1b2c`.
4. Turn Google Analytics **off** — the project has no use for it, and leaving it
   on adds an extra step for creating an Analytics account.
5. **Create project** → wait → **Continue**.

---

## Step 2. Create the Realtime Database

⚠️ **Realtime Database**, not Cloud Firestore. They are different products, and
the `increment` sentinel this project uses belongs to Realtime Database.

1. In the left menu: **Build → Realtime Database** (in the newer console layout,
   **Databases & Storage → Realtime Database**).
2. **Create Database**.
3. **Pick a region.** This is the one irreversible choice here: an existing
   database cannot be moved, only recreated.
   - `europe-west1` (Belgium) for European visitors;
   - `us-central1`, the default, for the US.
4. For the rules mode choose **Start in locked mode**. The project's own rules
   go in at the next step.

   Picking **test mode** instead leaves the database readable and writable by
   the entire internet, and after 30 days the rules flip automatically to deny
   everything — at which point likes stop working with no obvious cause. Locked
   mode plus your own rules avoids both.

5. Copy the **database URL** shown above the data view:

   ```
   https://palette-vault-a1b2c-default-rtdb.europe-west1.firebasedatabase.app
   ```

   Note the region in the hostname. Databases in `us-central1` use a different,
   historical format:

   ```
   https://palette-vault-a1b2c-default-rtdb.firebaseio.com
   ```

   This is the single most common setup mistake — copy the URL rather than
   guessing it.

---

## Step 3. Register a web app

1. Gear icon next to **Project Overview** → **Project settings**.
2. **General** tab, **Your apps** section → the **`</>`** (Web) icon.
3. App nickname — anything, for example `palette-vault-web`.
4. **Do not enable Firebase Hosting.** The site deploys as static files
   anywhere; enabling hosting only adds steps to the wizard.
5. **Register app**.
6. A `const firebaseConfig = { ... }` block appears. Map its values as follows:

   | Console field | `.env` variable |
   | --- | --- |
   | `apiKey` | `PUBLIC_FIREBASE_API_KEY` |
   | `authDomain` | `PUBLIC_FIREBASE_AUTH_DOMAIN` |
   | `databaseURL` | `PUBLIC_FIREBASE_DATABASE_URL` |
   | `projectId` | `PUBLIC_FIREBASE_PROJECT_ID` |
   | `storageBucket` | `PUBLIC_FIREBASE_STORAGE_BUCKET` |
   | `messagingSenderId` | `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
   | `appId` | `PUBLIC_FIREBASE_APP_ID` |

   The block can be reopened at any time under **Project settings → General →
   Your apps → SDK setup and configuration → Config**.

   If `databaseURL` is missing from the config, the app was registered before
   the database existed. Paste the URL from step 2 by hand.

---

## Step 4. Fill in `.env`

In the `site/` directory:

```bash
cp .env.example .env
```

Then fill in the values:

```env
PUBLIC_FIREBASE_API_KEY=AIzaSy...
PUBLIC_FIREBASE_AUTH_DOMAIN=palette-vault-a1b2c.firebaseapp.com
PUBLIC_FIREBASE_DATABASE_URL=https://palette-vault-a1b2c-default-rtdb.europe-west1.firebasedatabase.app
PUBLIC_FIREBASE_PROJECT_ID=palette-vault-a1b2c
PUBLIC_FIREBASE_STORAGE_BUCKET=palette-vault-a1b2c.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

Three things to watch:

- **The `PUBLIC_` prefix is required.** Astro only exposes prefixed variables to
  the browser. Without it `import.meta.env.PUBLIC_FIREBASE_*` is `undefined` and
  the code quietly falls back to offline mode.
- **No quotes**, no spaces around `=`.
- **Restart `npm run dev`.** Vite reads `.env` once at startup; hot reload will
  not pick up changes.

These keys are not secrets. A Firebase web config is public by design and
visible in the bundle of every site that uses one. Security comes from the
database rules, not from hiding the key — `.env` being gitignored is hygiene,
not protection.

---

## Step 5. Deploy the security rules

The rules live in `database.rules.json`. The data model is one node holding one
number:

```
/palettes/4e1f6e3e3e7545a9a998e8de = 42
```

The key is the palette slug, the same 24 hex characters used in the page URL.
Colors are not stored separately: the key is the data.

The rules allow:

- anyone to read `/palettes` (needed for the counters and the Popular page);
- writing a number under a key of exactly 24 hex characters;
- changing that number by **at most 1** per operation;
- nothing else.

That last point blocks crude inflation through direct REST calls that bypass the
client — setting a counter to 100000 is rejected by the rules.

### Option A — through the console

1. **Realtime Database → Rules** tab.
2. Replace the contents with `database.rules.json`.
3. **Publish**.

⚠️ The console rejects `//` comments in JSON. Strip them when pasting, or use
option B, where the CLI parses the file itself.

### Option B — through the CLI (rules stay in version control)

```bash
npm install -g firebase-tools
firebase login
```

Create `firebase.json` in `site/`:

```json
{
  "database": {
    "rules": "database.rules.json"
  }
}
```

Link the project and deploy:

```bash
firebase use --add          # pick your project from the list
firebase deploy --only database
```

From then on any rule change is one command: `firebase deploy --only database`.

---

## Step 6. Verify

```bash
npm run dev
```

1. Open the site and click the heart on any palette — the counter should go
   to `1`.
2. The **Data** tab in the console should now show:

   ```
   palettes
     └─ ffd6e0ffef9fc1f4c594d3ac: 1
   ```

   The key is the palette slug, which is its four HEX codes in a row.

3. Visit `/popular/` — the palette should be listed there.
4. Open the site in a private window, where `localStorage` is empty. The counter
   still reads `1` but the heart is not filled. That is correct: the counter is
   shared, the "I liked this" state is local.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Counter goes up but the console shows nothing | `.env` was not picked up. Restart the dev server. Check in DevTools that `import.meta.env.PUBLIC_FIREBASE_DATABASE_URL` is not `undefined`. |
| `PERMISSION_DENIED` in the browser console | Rules were not deployed, or the wrong ones were. Check the **Rules** tab — it should show this project's JSON, not `".read": false` from locked mode. |
| `FIREBASE FATAL ERROR: Can't determine Firebase Database URL` | `PUBLIC_FIREBASE_DATABASE_URL` is empty or wrong. Copy the URL from the Data page rather than assembling it. |
| Popular is empty while likes work | Missing index. The `palettes` node needs `".indexOn": ".value"`. Without it Firebase logs a warning in the browser console and the query fails. |
| `Index not defined, add ".indexOn": ".value"` | Same thing — redeploy the rules. |

---

## Beyond the basics

- **Limits.** The free Spark plan gives 1 GB of storage, 10 GB of egress per
  month and 100 concurrent connections. A like write is a few dozen bytes, so
  the connection limit is the only one worth watching.
- **Inflation.** The rules cap each write at ±1, but nothing stops a script from
  sending many requests in sequence. If that becomes a problem, the simplest fix
  without introducing accounts is anonymous authentication
  (`signInAnonymously`), a `/likes/{uid}/{slug}` node, and a rule denying a
  second like from the same uid.
- **Backups.** `firebase database:get / --output backup.json` dumps the whole
  database. Worth running before experimenting with rules.

---

Sources:
- [Installation & Setup in JavaScript — Firebase Realtime Database](https://firebase.google.com/docs/database/web/start)
- [Get started with Firebase Security Rules](https://firebase.google.com/docs/database/security/get-started)
- [Understand Firebase Realtime Database Security Rules](https://firebase.google.com/docs/database/security)
- [firebase — npm](https://www.npmjs.com/package/firebase)
