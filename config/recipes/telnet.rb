namespace :telnet do
  desc "Installing telnet after postgreSQL installation"
  task :install,roles: :mail do
    run "#{sudo} apt-get -y install telnet postfix"
  end

  after "postgresql:install","telnet:install"
end