class RateAndUser < ActiveRecord::Base
  belongs_to :user
  belongs_to :rating

  attr_accessible :user_id,:rating_id
end
