=begin
This is used for logging in through different providers
Referenced from https://github.com/intridea/omniauth/wiki/Managing-Multiple-Providers
=end

class Identity < ActiveRecord::Base
=begin
  belongs_to :user
  validates :uid,:provider,presence: true
  validates_uniqueness_of :uid, :scope => :provider


  def self.find_from_hash(hash)
    find_by_provider_and_uid(hash['provider'], hash['uid'])
  end

  def self.create_from_hash(hash, user)
    if user.nil?
      user ||= User.create_from_hash!(hash)
    end

    Identity.create(:user => user, :uid => hash['uid'], :provider => hash['provider'])
  end

=end


end
