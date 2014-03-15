class CreateInterestships < ActiveRecord::Migration
  def change
    create_table :interestships do |t|
      t.belongs_to :user, index: true
      t.belongs_to :interest, index: true

      t.timestamps
    end
  end
end
