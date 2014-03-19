class VideoAttachment < ActiveRecord::Base
  #belongs_to :attachable


  attr_accessible :description,:file,:remove_file
  belongs_to :attachable,polymorphic: true

  has_many :comments, as: :commentable, dependent: :destroy


  mount_uploader :file, VideoUploader

  has_many :video_and_interests
  has_many :interest,:through => :video_and_interests


  has_reputation :votes,source: :user,aggregated_by: :sum


end
