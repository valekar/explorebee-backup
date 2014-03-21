require "bundler/capistrano"
load 'deploy/assets'
#load "config/recipes/assets"


load "config/recipes/base"
load "config/recipes/nginx"
load "config/recipes/unicorn"
load "config/recipes/postgresql"
load "config/recipes/telnet"
load "config/recipes/redis"
load "config/recipes/elasticsearch"
load "config/recipes/nodejs"
load "config/recipes/rvm"
load "config/recipes/carrierwave"
load "config/recipes/check"
load "config/recipes/monit"



server "107.170.58.44", :web, :app, :db, primary: true

set :application, "explorebee"
set :postgres_name, "explorebee"
set :unicorn_name,"explorebeeme"
set :nginx_name, "explorebeeme"
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

after "deploy", "deploy:cleanup" # keep only the last 5 releases
require "rvm/capistrano"




# To setup new Ubuntu 12.04 server:
# ssh root@serverIP
# adduser deployer
# echo "deployer ALL=(ALL:ALL) ALL" >> /etc/sudoers
# exit
# ssh-copy-id deployer@69.164.192.207
# cap deploy:install
# cap deploy:setup
# cap deploy:cold