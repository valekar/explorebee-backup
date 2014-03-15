class Affinity < ActiveRecord::Base
  belongs_to :user

  attr_accessible :other_user_id, :affinity_measure
end
