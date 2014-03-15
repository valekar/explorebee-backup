class UserAndStory < ActiveRecord::Base
  belongs_to :user
  belongs_to :story

  attr_accessible :user_id, :story_id


end
