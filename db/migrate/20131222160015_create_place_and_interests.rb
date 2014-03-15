class CreatePlaceAndInterests < ActiveRecord::Migration
  def change
    create_table :place_and_interests do |t|
      t.belongs_to :place, index: true
      t.belongs_to :interest, index: true

      t.timestamps
    end
  end
end
