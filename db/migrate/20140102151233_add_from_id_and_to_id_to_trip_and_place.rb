class AddFromIdAndToIdToTripAndPlace < ActiveRecord::Migration
  def change
    add_column :trip_and_places, :from_id, :integer
    add_column :trip_and_places, :to_id, :integer
  end
end
