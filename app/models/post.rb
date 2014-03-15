class Post < ActiveRecord::Base
  attr_accessible :name,:description,:postImage,:interest_tokens#:interest_ids


  mount_uploader :postImage, ImageUploader

  has_many :post_and_interests
  has_many :interests, :through => :post_and_interests

  attr_reader :interest_tokens

  def interest_tokens=(ids)
    self.interest_ids = ids.split(",")
  end


end
