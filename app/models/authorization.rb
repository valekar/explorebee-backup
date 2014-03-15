class Authorization < ActiveRecord::Base
  belongs_to :user
  attr_accessible :uid, :user_id, :token, :secret,:url,:provider
end
