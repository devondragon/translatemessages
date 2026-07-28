require 'net/http'
require 'uri'
require 'json'
require 'fileutils'
require 'optparse'
require 'rubygems'
require 'net/http/post/multipart'

# Define the Worker URL, using an environment variable if set
WORKER_URL = ENV['WORKER_URL'] || "https://your-worker-url.workers.dev"

# Default languages to translate to
DEFAULT_LANGUAGES = ["fr", "es", "de"]

# Optional translation model. Left unset, the Worker uses whatever its deployment
# defaults to. A personal instance deployed with `wrangler deploy --env personal`
# already defaults to llama-4-scout, so this only needs setting when pointing the
# CLI at an instance whose default you want to override -- and the instance must
# list the model in ALLOWED_MODELS or it will answer 400.
MODEL = ENV['MODEL']

# Parse command-line arguments
options = {}
OptionParser.new do |opts|
  opts.banner = "Usage: translate_messages.rb [options]"

  opts.on("-f", "--file FILENAME", "Specify the file to upload") do |f|
	options[:file] = f
  end

  opts.on("-l", "--languages LANGUAGES", "Specify a comma-separated list of target languages (e.g., fr,es,de)") do |langs|
	options[:languages] = langs.split(",")
  end

  opts.on("-m", "--model MODEL", "Translation model to request (e.g., llama-4-scout). Defaults to the Worker's own default.") do |m|
	options[:model] = m
  end
end.parse!

# Set the file to upload (default to messages.properties)
file_to_upload = options[:file] || "messages.properties"

# Set the languages to translate to (default to DEFAULT_LANGUAGES)
languages = options[:languages] || DEFAULT_LANGUAGES

# Set the model, if any. Nil means "let the Worker decide".
model = options[:model] || MODEL

# Upload file and download translated files
def translate_and_download(file, languages, model)
  uri = URI(WORKER_URL)
  puts "URI: #{uri}"

  if uri.scheme.nil?
  puts "Invalid WORKER_URL '#{WORKER_URL}'. Include http:// or https://."
  return
  end

  languages.each do |language|
	# Record start time
	start_time = Time.now

	# Prepare the request. The model field is omitted entirely when not set, so the
	# Worker applies its own default rather than being pinned by the client.
	fields = {
	  "file" => UploadIO.new(file, "text/plain"),
	  "language" => language
	}
	fields["model"] = model if model && !model.empty?

	request = Net::HTTP::Post::Multipart.new uri, fields

	puts "Translating to #{language}#{model ? " using #{model}" : ""}..."

	# Perform the request with increased read timeout
	port = uri.port || (uri.scheme == 'https' ? 443 : 80)
	http = Net::HTTP.new(uri.host, port)
	http.use_ssl = uri.scheme == 'https'
	http.read_timeout = 600 # Increase read timeout to 600 seconds

	response = http.start do |http|
	  http.request(request)
	end

	# Record end time
	end_time = Time.now
	elapsed_time = end_time - start_time

	# Handle the response
	if response.is_a?(Net::HTTPSuccess)
	  filename = "messages_#{language}.properties"
	  File.open(filename, 'w') { |f| f.write(response.body) }
	  puts "Translated file saved as #{filename} (took #{elapsed_time.round(2)} seconds)"
	else
	  puts "Failed to translate to #{language}. HTTP Status: #{response.code}. Response: #{response.body} (took #{elapsed_time.round(2)} seconds)"
	end
  end
end

# Ensure the file exists
unless File.exist?(file_to_upload)
  puts "File #{file_to_upload} does not exist."
  exit 1
end

# Create translations and download them
translate_and_download(file_to_upload, languages, model)
