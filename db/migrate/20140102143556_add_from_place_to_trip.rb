class AddFromPlaceToTrip < ActiveRecord::Migration
  def change
    add_column :trips, :from_place, :string
  end
end
