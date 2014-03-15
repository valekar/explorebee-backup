class StoryAndPlace < ActiveRecord::Base
  belongs_to :story
  belongs_to :place

  attr_accessible :story_id, :place_id

end
