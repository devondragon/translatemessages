require 'net/http'
require 'uri'
require 'json'
require 'fileutils'
require 'optparse'

# Define the Worker URL
WORKER_URL = "https://your-worker-url.workers.dev"

# Default languages to translate to
DEFAULT_LANGUAGES = ["fr", "es", "de"]

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
end.parse!

# Set the file to upload (default to messages.properties)
file_to_upload = options[:file] || "messages.properties"

# Set the languages to translate to (default to DEFAULT_LANGUAGES)
languages = options[:languages] || DEFAULT_LANGUAGES

# Upload file and download translated files
def translate_and_download(file, languages)
  languages.each do |language|
	uri = URI(WORKER_URL)
	
	# Prepare the request
	request = Net::HTTP::Post::Multipart.new uri.path,
	  "file" => UploadIO.new(file, "text/plain", file),
	  "language" => language

	puts "Translating to #{language}..."
	# Perform the request
	response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
	  http.request(request)
	end

	# Handle the response
	if response.is_a?(Net::HTTPSuccess)
	  filename = "messages_#{language}.properties"
	  File.open(filename, 'w') { |f| f.write(response.body) }
	  puts "Translated file saved as #{filename}"
	else
	  puts "Failed to translate to #{language}. HTTP Status: #{response.code}"
	end
  end
end

# Ensure the file exists
unless File.exist?(file_to_upload)
  puts "File #{file_to_upload} does not exist."
  exit 1
end

# Create translations and download them
translate_and_download(file_to_upload, languages)
