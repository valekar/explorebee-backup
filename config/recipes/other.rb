set :whenever_command, "bundle exec whenever"
require "whenever/capistrano"

namespace :other do
  task :sidekick do
    run "bundle exec sidekiq"
  end
end