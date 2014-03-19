class User < ActiveRecord::Base

  searchkick word: [:name]

  before_save { self.email = email.downcase }
  validates :name,presence: true, length: {maximum: 50 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
  validates :email,presence: true, format: { with: VALID_EMAIL_REGEX },uniqueness: { case_sensitive: false }
  before_create :create_remember_token

  has_many :microposts, dependent: :destroy
  has_many :relationships, foreign_key: "follower_id", dependent: :destroy
  has_many :followed_users, through: :relationships, source: :followed

  has_many :reverse_relationships, foreign_key: "followed_id",
           class_name:  "Relationship",
           dependent:   :destroy
  has_many :followers, through: :reverse_relationships, source: :follower

  has_secure_password
  validates :password, length: { minimum: 6 } , :unless => :password
  validates :password_confirmation, presence: true, :unless => :password_confirmation

  has_many :authorizations, :dependent => :destroy

  #This is for logging in through different providers
  #has_many :identities
  has_many :albums,dependent: :destroy
  has_many :attachments, as: :attachable
  has_many :video_attachments, as: :attachable
  has_many :activities, dependent: :destroy

  has_many :videos
  has_many :interestships,:class_name => "Interestship",dependent: :destroy
  has_many :interests ,:through => :interestships
  has_many :comments


  has_many :user_and_workplaces ,:dependent=> :destroy
  has_many :workplaces,through: :user_and_workplaces


  has_many :user_and_trips ,:dependent=> :destroy
  has_many :trips , :through => :user_and_trips ,:dependent=> :destroy


  has_one :spec

  has_many :rate_and_users  ,:dependent=> :destroy
  has_many :ratings, :through => :rate_and_users


  has_many :invitations


  has_many :user_and_stories
  has_many :stories, through: :user_and_stories


  has_many :affinities





  has_many :posts, dependent: :destroy

  attr_accessible :remote_image_url,:image,:name,:password,:password_confirmation,:email,:remember_token,:phone,:admin
  mount_uploader :image,ImageUploader


  def User.new_remember_token
    SecureRandom.urlsafe_base64
  end

  def User.encrypt(token)
    Digest::SHA1.hexdigest(token.to_s)
  end


  def feed
    Micropost.from_users_followed_by(self)
  end

  def following?(other_user)
    relationships.find_by(followed_id: other_user.id)
  end

  def follow!(other_user)
    relationships.create!(followed_id: other_user.id)
  end

  def unfollow!(other_user)
    relationships.find_by(followed_id: other_user.id).destroy
  end

  def self.from_omniauth(auth)
    user = User.includes(:identities)
      .where(:identities =>{uid:auth.uid,provider:auth.provider}).first
  end

  # these are the methods defined for finding the followships only with ids
  def id_following?(other_user_id)
    relationships.find_by(followed_id: other_user_id)
  end

  def id_follow!(other_user_id)
    relationships.create!(followed_id: other_user_id)
  end

  def id_unfollow!(other_user_id)
    relationships.find_by(followed_id: other_user_id).destroy
  end


  #caching
  def current_user
    Rails.cache.fetch([:user,current_user.id], expires_in: 10.minutes) do
      current_user
    end
  end


  private

  def create_remember_token
    self.remember_token = User.encrypt(User.new_remember_token)
  end



end
