class Comment < ActiveRecord::Base
  belongs_to :commentable ,polymorphic: true
  belongs_to :user
  attr_accessible :content,:user_name,:user_image
end
