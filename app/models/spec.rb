class Spec < ActiveRecord::Base
  belongs_to :user
  attr_accessible :phone,:address,:gender,:workplace, :location,:location_id

end
