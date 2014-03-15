class PostAndInterest < ActiveRecord::Base
  belongs_to :post
  belongs_to :interest
  attr_accessible  :interest_id
end
