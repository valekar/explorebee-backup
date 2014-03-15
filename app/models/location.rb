class Location < ActiveRecord::Base
  attr_accessible :name, :description, :location_tokens


  attr_reader :location_tokens

  def location_tokens=(ids)
    self.location_ids = ids.split(",")
  end


end
