class Post < ActiveRecord::Base
  attr_accessible :name,:description,:postImage,:interest_tokens,:detail_description#:interest_ids


  mount_uploader :postImage, ImageUploader

  has_many :post_and_interests
  has_many :interests, :through => :post_and_interests

  belongs_to :user
  # this is very important because the the active reputation model depends on this
  default_scope -> { order('created_at DESC') }
  has_many :comments, as: :commentable, dependent: :destroy
  has_reputation :votes,source: :user,aggregated_by: :sum

  attr_reader :interest_tokens

  def interest_tokens=(ids)
    self.interest_ids = ids.split(",")
  end


end
