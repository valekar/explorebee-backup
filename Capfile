=begin
load 'deploy'
# Uncomment if you are using Rails' asset pipeline
 #load 'deploy/assets'
load 'config/deploy' # remove this line to skip loading any of the default tasks

=end

load 'deploy' if respond_to?(:namespace) # cap2 differentiator
Dir['vendor/bundles/*/*/recipes/*.rb'].each { |bundle| load(bundle) }
load Gem.find_files('capifony_symfony2.rb').last.to_s
load 'app/config/deploy'