class Video < ActiveRecord::Base
  belongs_to :user
  belongs_to :interest

  attr_accessible :description,:file
  belongs_to :attachable,polymorphic: true

  has_many :comments, as: :commentable, dependent: :destroy


  mount_uploader :file, VideoUploader



end
