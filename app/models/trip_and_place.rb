class TripAndPlace < ActiveRecord::Base
  belongs_to :trip
  belongs_to :place

  attr_accessible :place_id,:trip_id,:to_id,:from_id
end
