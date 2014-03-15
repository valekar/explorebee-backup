class VideoAndPlace < ActiveRecord::Base
  belongs_to :place

  attr_accessible :place_id,:file,:description

  mount_uploader :file, VideoUploader

end
