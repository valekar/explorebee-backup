class StoryPhotos < ActiveRecord::Base
  belongs_to :story

  attr_accessible :image

  mount_uploader :image, ImageUploader

end
