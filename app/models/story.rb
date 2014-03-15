class Story < ActiveRecord::Base

  attr_accessible :name,:description

  has_many :story_photoses

  has_one :user_and_story
  has_one :user,through: :user_and_story


  has_one :story_and_place
  has_one :place, through: :story_and_place

end
