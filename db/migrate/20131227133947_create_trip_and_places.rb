class CreateTripAndPlaces < ActiveRecord::Migration
  def change
    create_table :trip_and_places do |t|
      t.belongs_to :trip, index: true
      t.belongs_to :place, index: true

      t.timestamps
    end
  end
end
