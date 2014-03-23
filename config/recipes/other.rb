set :whenever_command, "bundle exec whenever"
require "whenever/capistrano"

namespace :other do
  task :sidekick do
    run "bundle exec sidekiq"
  end
end


namespace :patron do
  task :install do
    run "echo | #{sudo} apt-get install libcurl3-deV"
  end
end