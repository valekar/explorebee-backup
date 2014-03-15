class FileAndInterest < ActiveRecord::Base
  belongs_to :interest
  belongs_to :attachment
  attr_accessible :interest_id,:attachment_id
end
