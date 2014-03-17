require "bundler/capistrano"
load 'deploy/assets'
load "config/recipes/assets"




server "107.170.58.44", :web, :app, :db, primary: true

set :application, "explorebee"
set :user, "deployer"
set :deploy_to, "/home/#{user}/apps/#{application}"
set :deploy_via, :remote_cache
#set :bundle_gemfile, "app/Gemfile"
#set :deploy_via, :copy
set :use_sudo, false
#set :keep_releases, 5
#set :rvm_type, :system

set :scm, "git"
set :repository, "git@github.com:valekar/#{application}.git"
set :branch, "master"

default_run_options[:pty] = true
ssh_options[:forward_agent] = true

set :rvm_ruby_string, :local              # use the same ruby as used locally for deployment
set :rvm_autolibs_flag, "read-only"       # more info: rvm help autolibs

before 'deploy:setup', 'rvm:install_rvm'  # install/update RVM
before 'deploy:setup', 'rvm:install_ruby'


after "deploy", "deploy:cleanup" # keep only the last 5 releases


namespace :deploy do
  %w[start stop restart].each do |command|
    desc "#{command} unicorn server"
    task command, roles: :app, except: {no_release: true} do
      run "/etc/init.d/unicorn_#{application}me #{command}"
    end
  end
  #have "me" becareful
  task :setup_config, roles: :app do
    sudo "ln -nfs #{current_path}/config/nginx.conf /etc/nginx/sites-enabled/#{application}me"
    sudo "ln -nfs #{current_path}/config/unicorn_init.sh /etc/init.d/unicorn_#{application}me"
    run "mkdir -p #{shared_path}/config"
    put File.read("config/database.example.yml"), "#{shared_path}/config/database.yml"
    puts "Now edit the config files in #{shared_path}."
  end
  after "deploy:setup", "deploy:setup_config"

  task :symlink_config, roles: :app do
    run "ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml"
    run "ln -nfs #{shared_path}/uploads #{release_path}/public/uploads"
  end
  after "deploy:finalize_update", "deploy:symlink_config"

  desc "Make sure local git is in sync with remote."
  task :check_revision, roles: :web do
    unless `git rev-parse HEAD` == `git rev-parse origin/master`
      puts "WARNING: HEAD is not the same as origin/master"
      puts "Run `git push` to sync changes."
      exit
    end
  end
=begin
before "deploy", "deploy:check_revision"
  namespace :carrierwave do
  task :symlink, roles: :app do
   run "ln -nfs #{shared_path}/uploads/ #{release_path}/public/uploads"
  end
  after "deploy:finalize_update", "carrierwave:symlink"
  end
=end



=begin
  namespace :carrierwave do
    task :uploads_folder do
      run "mkdir -p #{shared_path}/uploads"
      run "#{sudo} chmod 775 #{shared_path}/uploads"
    end
    after 'deploy:setup', 'carrierwave:uploads_folder'

    task :symlink do
      run "ln -nfs #{shared_path}/uploads #{release_path}/public/uploads"
    end
    after 'deploy', 'carrierwave:symlink'
  end
=end



end



require "rvm/capistrano"
