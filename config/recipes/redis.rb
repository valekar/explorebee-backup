namespace :redis do

  desc "Adding redis database"
  task :install, :roles=> :db do
   run "#{sudo} apt-get update"
   run "echo | #{sudo} apt-get install build-essential"

   run "echo |#{sudo} apt-get install tcl8.5"

   run "#{sudo} wget http://redis.googlecode.com/files/redis-2.4.16.tar.gz"
   run "#{sudo} tar xzf redis-2.4.16.tar.gz"
   run " cd redis-2.4.16"
   run "#{sudo} make"
   run " #{sudo}make test"
   run "#{sudo} make install"
   run " cd utils"
   run "#{sudo} ./install_server.sh"
   restart
  end

 # after "telnet:install","redis:install"


  %w[start stop restart].each do |command|
    desc "#{command} redis_6379"
    task command,roles: :web do
      run "#{sudo} service redis_6379 #{command}"
    end
  end


end