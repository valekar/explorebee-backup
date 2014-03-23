namespace :telnet do
  desc "Installing telnet after postgreSQL installation"
  task :install do
    run "echo | #{sudo} apt-get -y install telnet postfix"
  end

 # after "postgresql:install","telnet:install"
end