  class Place < ActiveRecord::Base
    searchkick


    #extend FriendlyId

   # friendly_id :name # used later , use: :slugged


  attr_accessible :name, :description, :interest_tokens,:caption, :detail_description#, :image_tokens

  has_many :place_and_interests
  has_many :interests, :through => :place_and_interests

  attr_reader :interest_tokens
  attr_reader :caption
  #has_many :place_and_albums
  has_many :place_albums , dependent: :destroy #, through: :place_and_albums


  def interest_tokens=(ids)
    self.interest_ids = ids.split(",")
  end

  has_one :rating , as: :rateable


  has_many :trip_and_places
  has_many :trips, through: :trip_and_places


  has_one :video_and_place
  has_one :video_attachment, :through => :video_and_place


  has_many :user_and_stories
  has_many :stories, through: :user_and_stories


  accepts_nested_attributes_for :place_albums

=begin

  attr_reader :image_tokens

  def image_tokens=(images)
    self.image = images
  end


=end

end
