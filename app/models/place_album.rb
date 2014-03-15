class PlaceAlbum < ActiveRecord::Base
  attr_accessible :image,:caption

  mount_uploader :image, ImageUploader

  #has_many :place_and_albums
  #has_many :places,through: :place_and_albums
  belongs_to :place
end
