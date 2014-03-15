class VideoAndInterest < ActiveRecord::Base
  belongs_to :video_attachment
  belongs_to :interest

  attr_accessible :interest_id,:video_attachment_id
end
