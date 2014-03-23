namespace :swap_area do
  task :setup do
    run "#{sudo} swapon -s"
    run "#{sudo} df"
    run "#{sudo} dd if=/dev/zero of=/swapfile bs=1024 count=512k"
    run "#{sudo} mkswap /swapfile"
    run "#{sudo} swapon /swapfile"
    # we got to automate this process
    #run "#{sudo} nano /etc/fstab"
    #paste the below lines in the opened file
    # /swapfile       none    swap    sw      0       0
    run "echo 10 | #{sudo} tee /proc/sys/vm/swappiness"
    run "echo vm.swappiness = 10 | #{sudo} tee -a /etc/sysctl.conf"

    run "#{sudo} chown root:root /swapfile"
    run "#{sudo} chmod 0600 /swapfile"
  end

  #after "deploy:setup", "swap_area:setup"

end