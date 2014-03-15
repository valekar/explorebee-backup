class Album < ActiveRecord::Base
  attr_accessible :photo_image
  belongs_to :user
  mount_uploader :photo_image,ImageUploader
end
