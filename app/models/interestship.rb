class Interestship < ActiveRecord::Base
  belongs_to :user
  belongs_to :interest
  attr_accessible :interest_id

end
