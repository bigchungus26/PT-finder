# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## AI Study Assistant (open-source friendly)

The in-app AI assistant uses an **OpenAI-compatible** API so you can choose any provider; no API keys are stored in this repo.

1. **Supabase Dashboard** → your project → **Edge Functions** → **Secrets**.
2. Add:
   - **`OPENAI_API_KEY`** (required): Your API key from your chosen provider.
   - **`OPENAI_BASE_URL`** (optional): Defaults to `https://api.openai.com/v1`. Set to another base URL to use a different provider.
   - **`OPENAI_MODEL`** (optional): e.g. `gpt-4o-mini`, `llama-3.1-70b-versatile`. Defaults to `gpt-4o-mini`.

**Options (all open-source friendly):**

- **OpenAI** – Use your OpenAI key; base URL can stay default.
- **Groq** – Free tier, open models. `OPENAI_BASE_URL` = `https://api.groq.com/openai/v1`, model e.g. `llama-3.1-70b-versatile`, key from [console.groq.com](https://console.groq.com).
- **Ollama (local)** – 100% local, no cloud. Run `ollama serve`, then `OPENAI_BASE_URL` = `http://localhost:11434/v1` (or your host), model e.g. `llama3.2`, and set any non-empty string for the key if the server doesn’t require auth.
- **Together / OpenRouter** – Use their OpenAI-compatible endpoint and model names in the same way.

Deploy the Edge Function so the app can call it:

```sh
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase functions deploy ai-chat
```

`supabase/config.toml` sets `verify_jwt = false` for `ai-chat`, so you don't need `--no-verify-jwt`; future deploys use that by default. If no API key is set in Edge Function secrets, the UI shows a short message explaining how to configure it.
