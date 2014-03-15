class UserAndWorkplace < ActiveRecord::Base
  belongs_to :user
  belongs_to :workplace

  attr_accessible :user_id,:workplace_id
end
