class CreateUserAndTrips < ActiveRecord::Migration
  def change
    create_table :user_and_trips do |t|
      t.belongs_to :user, index: true
      t.belongs_to :trip, index: true
      t.timestamps
    end
  end
end
