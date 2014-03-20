namespace :carrierwave do

  desc "installing rmagick dependencies"
  task :install do
    run "#{sudo} apt-get install libmagickwand-dev"
  end

  after "deploy:install","carrierwave:install"

  namespace :ffmpegthumbnailer do
    desc "adding ffmpegthumbnailer"
    task :install do
      run "#{sudo} apt-get install ffmpegthumbnailer"
    end
    after "carrierwave:install", "ffmpegthumbnailer:install"
  end



  desc "Symlink the public/loads file into latest release"
  task :symlink, roles: :app do
    run "ln -nfs #{shared_path}/uploads #{release_path}/public/uploads"
  end
  after "deploy:finalize_update", "carrierwave:symlink"

end