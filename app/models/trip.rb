class Trip < ActiveRecord::Base
  attr_accessible :name,:destination,:no_of_days,:when_at,:budget,:description,:place_tokens,
                  :seats,:phone,:userIds,:from_place, :from_tokens

  validates :name,:no_of_days,:when_at,:budget,:description , :presence => true
  validates :no_of_days,:budget, :numericality => true

  has_many :trip_and_places ,:dependent=> :destroy
  has_many :places, through: :trip_and_places


  has_one :user_and_trip ,:dependent=> :destroy
  has_one :user, :through => :user_and_trip


  attr_reader :place_tokens
  attr_reader :from_tokens
  attr_reader :userIds


  has_one :invitation



  def place_tokens=(ids)
    self.place_ids = ids.split(",")
  end

  def from_tokens=(ids)
    self.place_ids = ids.split(",")
  end


  def userIds=(ids)
    #self.user_ids = ids.split(",")
  end



end
