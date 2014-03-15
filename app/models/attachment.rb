class Attachment < ActiveRecord::Base
  attr_accessible :description,:file
  belongs_to :attachable,polymorphic: true

  has_many :comments, as: :commentable, dependent: :destroy


  mount_uploader :file, FileUploader

  has_many :file_and_interests
  has_many :interests,:through => :file_and_interests

  has_reputation :votes,source: :user,aggregated_by: :sum
end
