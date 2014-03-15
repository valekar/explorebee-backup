class UserAndTrip < ActiveRecord::Base
  belongs_to :user
  belongs_to :trip

  attr_accessible :trip_id,:user_id ,:acceptance

end
