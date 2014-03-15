class Rating < ActiveRecord::Base
  belongs_to :rateable ,polymorphic: true
  attr_accessible :rate, :user_id

  has_many :rate_and_users
  has_many :users, through: :rate_and_users

end
