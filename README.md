# A Little Place for Us — Birthday Edition

A pink, floral keepsake website with:
- A larger bouquet with eight little `click me` notes. Clicking a note reveals only that note.
- A larger decorative birthday box as the main visual focus.
- A live countdown to **May 22, 2027 at 5:33 AM Philippines time (UTC+8)**.
- A private writing code that allows the holder to add a letter to the box.
- Letters remain unreadable through the website until the exact opening time. The database enforces the reading lock too.
- No sign-in, accounts, or two-person approval workflow in this edition.

## 1. Supabase setup (Free plan)

1. Create a Supabase project on the Free plan.
2. Open **Project Settings → API** (or API Keys).
3. Copy the Project URL and the `anon` / `publishable` key.
4. Put them in `config.js`:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "YOUR_ACTUAL_PROJECT_URL",
  SUPABASE_ANON_KEY: "YOUR_ACTUAL_ANON_OR_PUBLISHABLE_KEY"
};
```

Never use the `service_role` key in the website.

## 2. Set the private writing code

1. Open `supabase/schema.sql` in a text editor.
2. Find `SET_A_PRIVATE_WRITING_CODE`.
3. Replace it with a unique code of your choice. Use a long code that is difficult to guess.
4. Do NOT put the real code in GitHub. The SQL file contains the placeholder only until you edit it.
5. In Supabase, open **SQL Editor → New query**.
6. Paste the complete updated SQL file and click **Run**.
7. Keep the real code private. Only the person who should be able to add letters needs it.

The SQL stores a bcrypt hash of the code in a private schema. The browser calls a database function to submit a letter; it cannot directly insert rows.

If you later need to change the writing code, update the hash in Supabase SQL Editor with:

```sql
update private.app_settings
set writing_code_hash = crypt('YOUR_NEW_PRIVATE_CODE', gen_salt('bf'))
where id = 1;
```

Do not paste the real code into a public repository or chat.

## 3. Publish on GitHub Pages

1. Upload `index.html`, `style.css`, `app.js`, `config.js`, and the `supabase` folder to the root of your GitHub repository.
2. Keep `index.html` at the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
5. Wait for the Pages URL and open it over HTTPS.

If you already published the previous version, replace the old files with these updated files and commit the changes. You do not need to create a new repository.

## 4. How the birthday box works

- Writing code: opens the letter-writing form. The code authorizes submitting a letter; it does not unlock reading.
- Before opening time: letters cannot be read through the public website.
- Opening time: **May 22, 2027 at 5:33 AM Philippines time (UTC+8)**.
- At and after opening time: the site loads all letters from Supabase.
- The database policy enforces the same time gate, so changing the countdown display in the browser does not unlock the letters early.

The writing form is closed after the opening time.

## Important privacy notes

- GitHub Pages source files are public when using a public repository. Do not place the real writing code in `app.js`, `config.js`, HTML, or any committed file.
- Supabase's publishable/anon key is expected to be visible in browser code. The SQL policies and function restrict what it can do.
- Letters are stored as readable text in the Supabase database. This version protects them from being read through the website before the opening time, but a Supabase project owner/admin can access the database. Do not store highly sensitive information.
- A code can be shared or guessed if it is weak. Use a long, unique writing code and keep it private.
- This is a personal keepsake project, not a high-security confidential messaging service.
- Keep the Supabase project on the Free plan and do not enable paid add-ons or upgrade.

## Local preview

Open `index.html` in a browser for the visual design. Database letter submission and reading require the Supabase setup and an HTTPS-hosted site.
