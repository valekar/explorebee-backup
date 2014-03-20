def template(from,to)
  erb = File.read(File.expand_path("../templates/#{from}",__FILE__))
  result = ERB.new(erb).result(binding), to
end


def set_default(name,*args,&block)
  set(name,*args,&block) unless exists?(name)
end



namespace :deploy do
  task :install do
    run "#{sudo} apt-get -y update"
    run "#{sudo} apt-get -y python-software-properties"
    run "#{sudo} apt-get -y software-properties-common"
  end
end