class AddPhoneAndSeatsToTrips < ActiveRecord::Migration
  def change
    add_column :trips, :phone, :integer
    add_column :trips, :seats, :integer
  end
end
