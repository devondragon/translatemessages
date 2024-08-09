# Messages Translation Project

This project provides a Cloudflare Worker and a Ruby CLI script for translating `messages.properties` files into different languages. The primary use case is to assist developers working with internationalization in Java Spring Boot applications by automating the process of translating message files.

## Purpose

The goal of this project is to simplify the process of translating message properties files into multiple languages using a combination of Cloudflare Workers and a Ruby CLI script. This allows for easy and efficient handling of translations directly from your development environment.

## See It In Action

[Demo Site](https://translatemessages.pages.dev)

## Cloudflare Worker

### Deployment Instructions

To deploy the Cloudflare Worker that handles the translation of `messages.properties` files, follow these detailed steps:

#### 1. Set Up the Wrangler CLI

If you haven't already, you'll need to install the Wrangler CLI, which is used to manage and deploy Cloudflare Workers.

- **Install Wrangler**:
  ```bash
  npm install -g wrangler
  ```

- **Login to Cloudflare**:
  After installing Wrangler, log in to your Cloudflare account:
  ```bash
  wrangler login
  ```

This command will open a browser window for you to authenticate your Cloudflare account.

#### 2. Deploy the Worker

Once everything is set up, you can deploy your Worker to Cloudflare.

  ```bash
  wrangler publish
  ```

  This command will bundle your project and deploy it to Cloudflare Workers. Wrangler will provide you with a URL where your Worker is hosted.

#### 3. Testing the Worker

After deploying, you can test your Worker by sending a request to the provided URL. Ensure that your Worker correctly handles the `POST` requests, translates the messages file, and returns the translated content.

### Example Request

To interact with your deployed Worker, you can use tools like `curl` or the provided Ruby CLI script.

```bash
curl -X POST -F "file=@messages.properties" -F "language=fr" https://your-worker-url.workers.dev
```

This command uploads `messages.properties` and requests a translation to French. The Worker responds with a translated file.

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

This project includes a `pages` directory containing an `index.html` file, which serves as a front-end form for interacting with the Cloudflare Worker. This HTML form allows users to upload a `messages.properties` file and specify a target language for translation.

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
	 wrangler pages publish pages --project-name <your-project-name>
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
   ruby translate_messages.rb
   ```

2. **Specify a Custom File**:
   - You can specify a different file to upload using the `-f` or `--file` option:

   ```bash
   ruby translate_messages.rb -f custom_messages.properties
   ```

3. **Specify Custom Target Languages**:
   - You can specify a comma-separated list of target languages using the `-l` or `--languages` option. This overrides the default languages:

   ```bash
   ruby translate_messages.rb -l fr,es,it
   ```

4. **Combine Options**:
   - You can combine the file and language options to customize both the file to be uploaded and the target languages:

   ```bash
   ruby translate_messages.rb -f custom_messages.properties -l fr,es,it
   ```

### Customization

- **Target Languages**: You can modify the list of default target languages by editing the `DEFAULT_LANGUAGES` array within the script. This allows you to customize which languages the file will be translated into by default.

- **Worker URL**: You can also replace the `WORKER_URL` in the script with the URL of your Translate Messages Cloudflare Worker.


### Example Output

When the script runs successfully, you will see messages indicating that the translated files have been saved in the current directory. Each file will have the appropriate language suffix.

## Project Structure

- **Cloudflare Worker**: Handles the actual translation logic.
- **Cloudflare Pages HTML**: An example HTML page form to upload a message.properties file for translation.
- **Ruby CLI Script**: Facilitates interaction with the Worker and automates the translation process.

## Conclusion

This project provides a streamlined and automated solution for translating Java properties files across multiple languages, using the power of Cloudflare Workers and a simple Ruby CLI. It is ideal for developers working on internationalized applications, providing a seamless workflow for managing translations.

For more details and to view the source code, please refer to the files in this GitHub repository.
