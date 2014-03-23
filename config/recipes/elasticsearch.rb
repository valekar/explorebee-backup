namespace :elasticsearch do

  desc "Installing elasticsearch after redis installation"
  task :install do
    run "#{sudo} apt-get update"
    run "echo | #{sudo} apt-get install openjdk-7-jre-headless -y"
    run "#{sudo} wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.0.1.deb"
    run "echo | #{sudo} dpkg -i elasticsearch-1.0.1.deb"
    restart
  end
  after "redis:install", "elasticsearch:install"


  %w[start stop restart].each do |command|
    desc "#{command} elasticsearch"
    task command,roles: :web do
      run "#{sudo} service elasticsearch #{command}"
    end
  end

end