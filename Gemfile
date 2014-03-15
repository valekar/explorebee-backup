source 'http://rubygems.org'
#ruby '2.1.1'
#ruby-gemset=railstutorial_rails_4_0

gem 'rails', '4.0.0'
#gem 'bootstrap-sass', '2.3.2.0'
gem 'bcrypt-ruby', '3.0.1'
gem 'faker', '1.1.2'
gem 'will_paginate', '3.0.4'
#gem 'bootstrap-will_paginate', '0.0.9'

gem 'redis'
gem 'execjs'
gem 'therubyracer', :platforms => :ruby
gem 'ng-rails-csrf'
gem 'ngmin-rails'
gem 'angularjs-rails'
gem 'gon'
#gem 'foundation-datetimepicker-rails'
#gem 'compass'
#gem 'zurb-foundation'
gem "remotipart", "~> 1.0"

#masonry and isoope included
gem 'masonry-rails' ,"~> 0.2.1"

#added for running the back ground processes
gem 'sidekiq'
#added for searching
gem "searchkick"

#added these three for chat purpose
gem 'thin'
gem 'faye'

gem 'friendly_id'

gem 'private_pub', :git => 'git://github.com/ryanb/private_pub.git'
gem 'omniauth',"~> 1.0"
gem 'omniauth-facebook'
gem 'omniauth-linkedin'

#authorization
gem 'cancan'
gem 'sprockets', '2.11.0'
gem 'rmagick'
gem 'carrierwave'
gem 'carrierwave-video'
gem 'carrierwave-video-thumbnailer'
gem 'streamio-ffmpeg'
gem 'protected_attributes'
gem 'dalli'
gem 'activerecord-reputation-system',:require => "reputation_system"
gem 'foundation-icons-sass-rails'
group :development, :test do
  gem 'sqlite3', '1.3.7'
  gem 'rspec-rails', '2.13.1'
  # The following optional lines are part of the advanced setup.
  # gem 'guard-rspec', '2.5.0'
  # gem 'spork-rails', github: 'sporkrb/spork-rails'
  # gem 'guard-spork', '1.5.0'
  # gem 'childprocess', '0.3.6'
end
gem 'rack-mini-profiler'
group :development do
  gem 'better_errors'
  #gem 'binding_of_caller'


end

group :test do
  gem 'selenium-webdriver', '2.0.0'
  gem 'capybara', '2.1.0'
  gem 'factory_girl_rails', '4.2.0'
  gem 'cucumber-rails', '1.3.0', :require => false
  gem 'database_cleaner', github:'bmabey/database_cleaner'


  # Uncomment this line on OS X.
  # gem 'growl', '1.0.3'

  # Uncomment these lines on Linux.
  # gem 'libnotify', '0.8.0'

  # Uncomment these lines on Windows.
  # gem 'rb-notifu', '0.0.4'
  # gem 'win32console', '1.3.2'
end

gem 'sass-rails', '~> 4.0.0'
gem 'uglifier', '2.1.1'
gem 'coffee-rails', '4.0.0'
gem 'jquery-rails', '2.2.1'
#gem 'turbolinks', '1.1.1'
gem 'jbuilder', '1.0.2'

group :doc do
  gem 'sdoc', '0.3.20', require:false
end




group :production do
  gem 'pg', '0.17.1'
  gem 'rails_12factor', '0.0.2'
  gem 'unicorn'
  gem "net-ssh", "~> 2.7.0"
  gem 'capistrano'
  gem 'actionpack','4.0.0'

  gem 'rvm-capistrano'
end
