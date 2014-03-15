class PlaceAndInterest < ActiveRecord::Base
  belongs_to :place
  belongs_to :interest
  attr_accessible  :interest_id
end
