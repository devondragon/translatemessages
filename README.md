# Messages Translation Project

This project provides a Cloudflare Worker and a Ruby CLI script for translating `messages.properties` files into different languages. The primary use case is to assist developers working with internationalization in Java Spring Boot applications by automating the process of translating message files.

## Purpose

The goal of this project is to simplify the process of translating message properties files into multiple languages using a combination of Cloudflare Workers and a Ruby CLI script. This allows for easy and efficient handling of translations directly from your development environment.

## See It In Action

[Demo Site](https://translatemessages.pages.dev)

## Valid Languages
The AI model being used is the m2m100, and you can see the languages supported here: https://huggingface.co/facebook/m2m100_1.2B#languages-covered
Currently dialects are not supported, such as Brazilian Portuguese versus European Portuguese, or the Hong Kong or Taiwanese dialects of Chinese.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) with Workers AI enabled

## Getting Started

```bash
npm install
```

### Development

```bash
npm run dev      # Start local development server
npm test         # Run tests (Vitest with Cloudflare Workers pool)
```

## Cloudflare Worker

### Deployment Instructions

To deploy the Cloudflare Worker that handles the translation of `messages.properties` files, follow these detailed steps:

#### 1. Set Up the Wrangler CLI

Log in to your Cloudflare account:

```bash
npx wrangler login
```

This command will open a browser window for you to authenticate your Cloudflare account.

#### 2. Deploy the Worker

Once everything is set up, you can deploy your Worker to Cloudflare:

```bash
npm run deploy
```

This command will bundle your project and deploy it to Cloudflare Workers. Wrangler will provide you with a URL where your Worker is hosted.

To deploy to the staging environment:
```bash
npx wrangler deploy --env staging
```

#### 3. Testing the Worker

After deploying, you can test your Worker by sending a request to the provided URL. Ensure that your Worker correctly handles the `POST` requests, translates the messages file, and returns the translated content.

### Example Request

To interact with your deployed Worker, you can use tools like `curl` or the provided Ruby CLI script.

```bash
curl -X POST -F "file=@messages.properties" -F "language=fr" https://your-worker-url.workers.dev
```

This command uploads `messages.properties` and requests a translation to French. The Worker responds with a translated file.

### Continuous Integration

This project includes a GitHub Actions CI workflow (`.github/workflows/ci.yml`) that:
- Runs TypeScript type checking (source and test files)
- Executes the test suite
- Deploys to staging on push to main

To enable automatic staging deployments, add a `CLOUDFLARE_API_TOKEN` secret to your GitHub repository.

### Troubleshooting

- **Deployment Errors**:
  If you encounter issues during deployment, check the output in your terminal for error messages. Common issues include incorrect bindings, missing environment variables, or authentication issues.

- **Log and Debug**:
  Use the `wrangler tail` command to stream logs from your deployed Worker, which can help with debugging:
  ```bash
  wrangler tail
  ```
- **403 Errors**:
  If you configure your Worker to use a Custom Domain, you may encounter 403 errors depending on how Cloudflare is configured to protect that domain. Test with the default Route (which ends in workers.dev) to see if this is the issue.

## Cloudflare Pages Deployment

This project includes a `pages` directory containing an `index.html` file and a `script.js` file, which together serve as a front-end form for interacting with the Cloudflare Worker. The form allows users to upload a `messages.properties` file and specify a target language for translation.

This is completely optional!

### Editing the Form Action

Before deploying the `pages` directory as a Cloudflare Pages application, you need to update the `index.html` file to point the form's action to your Cloudflare Worker URL.

1. **Locate the `index.html` File**:
   - The file is located in the `pages` directory: `pages/index.html`.

2. **Edit the Form Action**:
   - Open `pages/index.html` in your preferred text editor.
   - Find the `<form>` element in the HTML code. It will look something like this:

	 ```html
	 <form action="https://your-worker-url.workers.dev" method="post" enctype="multipart/form-data">
	 ```

   - Replace `https://your-worker-url.workers.dev` with the actual URL of your deployed Cloudflare Worker. This URL is where the form will submit the uploaded file and target language.

3. **Save the Changes**:
   - After updating the form action, save the `index.html` file.

### Allowing Your Pages Origin (CORS)

The form submits via `fetch()`, so the Worker and the Pages site are two different
origins and the browser will discard the Worker's response unless the Worker names
your Pages origin explicitly. Set `ALLOWED_ORIGINS` in `wrangler.toml` to the origin
your form is served from, then redeploy the Worker:

```toml
[vars]
ALLOWED_ORIGINS = "https://your-project.pages.dev"
```

Multiple origins are comma-separated. Any `http://localhost:<port>` origin is always
allowed, so `local.html` and `npm run dev` need no configuration.

This affects browsers only — the Ruby CLI and `curl` send no `Origin` header and are
unaffected by this setting.

### Rate Limiting

The Worker binds Cloudflare's rate limiting API per client IP. Configure it in
`wrangler.toml`:

```toml
[[ratelimits]]
name = "RATE_LIMITER"
namespace_id = "1001"

  [ratelimits.simple]
  limit = 20
  period = 60      # the runtime accepts only 10 or 60
```

Omit the binding entirely and no limiting happens, which is what a private
single-user deployment wants. A limiter that errors fails open — a broken limiter is
not a reason to refuse translations.

**This is burst protection, not a spending cap.** The window maxes out at 60 seconds
and the counters are per Cloudflare location rather than global, so a client spread
across locations gets proportionally more than the configured limit. The daily spend
cap below is what actually bounds a day's spend.

### Daily Spend Cap

A deployment-wide ceiling on how many entries are sent to the model per UTC day.
Configure both halves in `wrangler.toml`:

```toml
[vars]
DAILY_ENTRY_BUDGET = "20000"   # entries per UTC day, not requests

[[durable_objects.bindings]]
name = "DAILY_SPEND"
class_name = "DailySpendCounter"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["DailySpendCounter"]
```

Omit either half and no capping happens, which is what the single-user personal
instance wants. Named environments inherit neither vars nor migrations, so each one
that wants a cap repeats all three blocks.

The unit is entries rather than requests because that is what cost scales with: a
3,000-entry upload would otherwise count the same as a three-line file. Comments and
blank lines are never sent to the model and so are never charged, and neither is a
request rejected for a bad language code, an oversized file, or one where every call
to the model failed.

Once the budget is spent the Worker answers `503` with a `Retry-After` pointing at
the next UTC midnight — deliberately distinct from the rate limiter's `429`, so
"wait a minute and try again" is never shown for a limit that lasts the rest of the
day. The window matches Cloudflare's Neuron allocation, which also resets at 00:00
UTC.

The budget is checked before a request runs and charged after it finishes, because
what a request costs is not known until then; the day's last request can therefore
overshoot by its own size. A counter that errors fails open and logs, exactly as the
rate limiter does.

### Deploying to Cloudflare Pages

Once you have edited the `index.html` file, you can deploy the `pages` directory as a Cloudflare Pages application.

1. **Install Wrangler CLI**:
   - If you haven't already, install the Wrangler CLI, which is used to manage Cloudflare Workers and Pages:

	 ```bash
	 npm install -g wrangler
	 ```

2. **Login to Cloudflare**:
   - Log in to your Cloudflare account using Wrangler:

	 ```bash
	 wrangler login
	 ```

3. **Deploy the Pages Application**:
   - Navigate to the root of your project directory in your terminal.
   - Use the following command to deploy the `pages` directory:

	 ```bash
	 npx wrangler pages deploy pages --project-name <your-project-name>
	 ```

   - Replace `<your-project-name>` with a unique name for your Cloudflare Pages project.

4. **Access Your Deployed Pages App**:
   - Once the deployment is complete, Wrangler will provide you with a URL where your Cloudflare Pages application is hosted. Visit this URL to access the form and use it to upload and translate `messages.properties` files.

### Example Usage

After deploying, your form should be accessible via the URL provided by Cloudflare Pages. Users can visit this URL, upload their `messages.properties` file, and receive translated versions directly through the form.


## Ruby CLI Script

### Overview

The Ruby CLI script automates the interaction with the Cloudflare Worker, allowing you to upload a `messages.properties` file, specify multiple target languages, and download the translated files directly to your local machine.

### Prerequisites

- Ensure you have Ruby installed on your system.
- Install the `multipart-post` gem, which is used for handling file uploads in HTTP requests:

  ```bash
  gem install multipart-post
  ```

### Usage

If you haven't edited the WORKER_URL in the script itself, you should set an environment variable WORKER_URL pointing to your Worker:

  ```bash
  export WORKER_URL="https://yourworker.hostname.com"
  ```

The script provides several options to customize its behavior:

1. **Default Behavior**:
   - By default, the script uploads `messages.properties` from the current directory and translates it into the languages specified in the `DEFAULT_LANGUAGES` list:

   ```bash
   ruby cli/translate_messages.rb
   ```

2. **Specify a Custom File**:
   - You can specify a different file to upload using the `-f` or `--file` option:

   ```bash
   ruby cli/translate_messages.rb -f custom_messages.properties
   ```

3. **Specify Custom Target Languages**:
   - You can specify a comma-separated list of target languages using the `-l` or `--languages` option. This overrides the default languages:

   ```bash
   ruby cli/translate_messages.rb -l fr,es,it
   ```

4. **Combine Options**:
   - You can combine the file and language options to customize both the file to be uploaded and the target languages:

   ```bash
   ruby cli/translate_messages.rb -f custom_messages.properties -l fr,es,it
   ```

### Customization

- **Target Languages**: You can modify the list of default target languages by editing the `DEFAULT_LANGUAGES` array within the script. This allows you to customize which languages the file will be translated into by default.

- **Worker URL**: You can also replace the `WORKER_URL` in the script with the URL of your Translate Messages Cloudflare Worker.


### Example Output

When the script runs successfully, you will see messages indicating that the translated files have been saved in the current directory. Each file will have the appropriate language suffix.

## Project Structure

- **`src/index.ts`** — Cloudflare Worker handling the translation logic
- **`pages/`** — Cloudflare Pages frontend (`index.html` + `script.js`)
- **`cli/translate_messages.rb`** — Ruby CLI script for batch translations
- **`test/`** — Test suite (`index.spec.ts`, `parsing.spec.ts`) using Vitest with Cloudflare Workers pool
- **`wrangler.toml`** — Cloudflare Worker configuration (includes staging environment)
- **`.github/workflows/ci.yml`** — CI pipeline (type check, test, staging deploy)

## Conclusion

This project provides a streamlined and automated solution for translating Java properties files across multiple languages, using the power of Cloudflare Workers and a simple Ruby CLI. It is ideal for developers working on internationalized applications, providing a seamless workflow for managing translations.

For more details and to view the source code, please refer to the files in this GitHub repository.
