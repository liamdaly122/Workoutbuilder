# Setup Guide (for complete beginners)

This app needs two free online accounts to work: one to hold your database
(**Supabase**), and one to host the actual website (**Vercel**). Neither
costs anything. This guide assumes you've never done this before, so it
spells out every click.

Total time: roughly 15-20 minutes, done once.

---

## Part 1: Create your database (Supabase)

1. Go to **supabase.com** and click **Start your project** (or **Sign up**).
   Sign up with GitHub or an email address - whichever's easier.
2. Once signed in, click **New project**.
3. Fill in:
   - **Name**: anything, e.g. `workout-builder`
   - **Database Password**: click "Generate a password" and then **copy it
     somewhere safe** (a notes app is fine) - you likely won't need it again,
     but it's good practice to keep it.
   - **Region**: pick whichever is closest to you.
4. Click **Create new project**. It takes 1-2 minutes to set up - just wait
   on this page until it's ready.

### Get your project's keys

5. Once the project is ready, look at the left-hand sidebar and click the
   **gear/Settings icon**, then click **API** in the settings menu.
6. You'll see a page with some values. You need three of them:
   - **Project URL** (looks like `https://something.supabase.co`)
   - **anon public** key (a long string of letters/numbers) - this one is
     *safe to share*, it's designed to be public in a browser app.
   - **service_role secret** key (another long string) - keep this one
     **private**. It's only used once, by a setup script, never by the
     live website.

Copy all three somewhere handy - you'll paste them in a minute.

> If Claude is helping you set this up in the same conversation, you can
> paste all three values directly into the chat and it can use them to
> finish the remaining steps below on your behalf.

---

## Part 2: Create the database tables

7. In the Supabase left sidebar, click the **SQL Editor** icon.
8. Click **New query**.
9. Open the file `supabase/schema.sql` from this project, copy its entire
   contents, and paste it into the SQL Editor.
10. Click **Run** (bottom right). You should see "Success. No rows returned."
    This one paste creates every table the app needs.

---

## Part 3: Set up your local copy

11. In this project's folder, copy the file `.env.example` to a new file
    named `.env.local` (same folder). If you're not sure how: duplicate the
    file and rename the copy.
12. Open `.env.local` and fill in the three values from Part 1:
    ```
    VITE_SUPABASE_URL=<your Project URL>
    VITE_SUPABASE_ANON_KEY=<your anon public key>
    SUPABASE_SERVICE_ROLE_KEY=<your service_role secret key>
    ```
13. This file is already set up to be ignored by git, so it will never be
    uploaded to GitHub or shared publicly. Never share the service_role key
    outside of this file.

---

## Part 4: Load the exercise library

14. In a terminal, in this project's folder, run:
    ```bash
    npm install
    npm run seed:supabase
    ```
15. This uploads the built-in library of ~870 exercises into your database.
    It only needs to be run once. You should see it count up to "Done -
    seeded 873 exercises."

(If Claude is running this for you in a session where you've shared the
keys, it will do this step for you - you can skip it.)

---

## Part 5: Put the app on the internet (Vercel)

16. Go to **vercel.com** and click **Sign Up**. Choose **Continue with
    GitHub** (easiest, since this project's code lives on GitHub).
17. Click **Add New...** → **Project**.
18. Find and **Import** this repository from the list.
19. Before clicking Deploy, expand **Environment Variables** and add two:
    | Name | Value |
    |---|---|
    | `VITE_SUPABASE_URL` | your Project URL from Part 1 |
    | `VITE_SUPABASE_ANON_KEY` | your anon public key from Part 1 |

    Do **not** add the service_role key here - it's not needed by the
    deployed site.
20. Click **Deploy**. Wait about a minute. Vercel will give you a live web
    address (something like `workout-builder-yourname.vercel.app`).

That's your app's permanent internet address - bookmark it, and you can
"Add to Home Screen" on your phone's browser so it opens like an app.

---

## Part 6: Create your login

21. Open the live address from step 20.
22. Click **Don't have an account? Sign up**, enter an email and a password
    (at least 6 characters), and click **Sign up**.
23. You're in. Go through the onboarding (goal, equipment, review your plan)
    and you're ready to train.

You can sign into this same account from your phone, laptop, or any other
device/browser, and your workout history will always be the same, because
it all lives in the one Supabase database from Part 1.

---

## Part 7 (optional but recommended): Lock the door behind you

Once you've created your one account, you can stop anyone else from ever
signing up:

24. Back in Supabase, click **Authentication** in the left sidebar, then
    **Providers** (or **Sign In / Providers**, depending on the current
    Supabase layout).
25. Find **Email**, and turn off **Allow new users to sign up**.

This isn't strictly necessary - even if a stranger somehow found your app's
address and signed up, they'd only ever see their own empty account, never
your data - but it's a nice extra lock on the door.

---

## Troubleshooting

- **"Failed to fetch" or a blank page after deploying**: double-check the
  two environment variables in Vercel (Part 5, step 19) exactly match your
  Supabase Project URL and anon key, with no extra spaces, then redeploy
  (Vercel → your project → Deployments → "..." → Redeploy).
- **"relation \"exercises\" does not exist" or similar database errors**:
  the SQL from Part 2 wasn't run yet, or didn't complete - go back to the
  Supabase SQL Editor and run `supabase/schema.sql` again.
- **Signed up but the exercise catalog looks empty**: Part 4 (the seed
  script) hasn't been run yet, or failed partway - re-run
  `npm run seed:supabase` (it's safe to run more than once).
- **Forgot your password**: on the Login screen there's no "forgot
  password" flow built in for this personal app - simplest fix is to go to
  Supabase → Authentication → Users, delete your user, and sign up again
  (you'll need to re-do onboarding, but your Supabase project itself doesn't
  need touching).

## A few terms explained

- **Supabase**: a company that gives you a free hosted database plus a
  built-in login system, so you don't need to build or pay for either.
- **Database / table**: think of it as a set of spreadsheets that the app
  reads from and writes to (your workouts, your settings, etc.).
- **SQL**: the language used to create/query database tables. You don't need
  to understand it - you're just pasting a ready-made block once.
- **Environment variable**: a named setting (like `VITE_SUPABASE_URL`) that
  tells the app which database to talk to, kept outside the actual code.
- **anon key vs service_role key**: the anon key is safe to expose in the
  browser (it's protected by database rules that only let you see your own
  data). The service_role key bypasses those rules entirely, which is why
  it's only ever used once, locally, by the setup script - never in the
  deployed app.
- **Vercel**: a company that hosts the website itself (the part you see and
  click on) for free, and automatically updates it whenever the code changes.
