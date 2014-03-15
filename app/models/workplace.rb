class Workplace < ActiveRecord::Base
  attr_accessible :name,:description,:city,:state,:country, :workplace_tokens
  has_many :user_and_workplaces
  has_many :users,through: :user_and_workplaces

  attr_reader :workplace_tokens

  def workplace_tokens=(ids)
    self.workplace_ids = ids.split(",")
  end

end
