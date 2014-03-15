class Interest < ActiveRecord::Base
  attr_accessible :name,:description,:image
  has_many :interestships,:class_name => "Interestship"
has_many :users,:through => :interestships

has_many :video_and_interests
has_many :video_attachments,:through => :video_and_interests

 has_many :file_and_interests
  has_many :attachments, :through => :file_and_interests

  has_many :post_and_interests
  has_many :posts ,:through => :post_and_interests

  has_many :place_and_interests
  has_many :places, :through => :place_and_interests


mount_uploader :image,InterestUploader
end
