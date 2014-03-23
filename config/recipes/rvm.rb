set_default :ruby_version, "2.1.1"

namespace :rvm do
  desc "Install rvm, Ruby, and the Bundler gem"
  task :install, roles: :app do
    run "#{sudo} apt-get -y install curl git-core"
    run "#{sudo} curl -L get.rvm.io | bash -s stable"
    run " source ~/.rvm/scripts/rvm"
    run "rvm requirements"
    run "sudo apt-get install build-essential bison openssl libreadline6 libreadline6-dev curl git-core zlib1g zlib1g-dev libssl-dev libyaml-dev
          libsqlite3-0 libsqlite3-dev sqlite3 libxml2-dev libxslt-dev autoconf libc6-dev ncurses-dev"

    run "rvm install #{ruby_version}"
    run "rvm --default use #{ruby_version}"
    run "gem install bundler --no-ri --no-rdoc"



  end
  after "deploy:install", "rvm:install"
end