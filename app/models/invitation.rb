class Invitation < ActiveRecord::Base
  belongs_to :user
  belongs_to :trip
  attr_accessible :user_id,:trip_id,:invitee_id,:acceptance

end
