class CreateVideoAndPlaces < ActiveRecord::Migration
  def change
    create_table :video_and_places do |t|
      t.belongs_to :place, index: true
      t.string :file
      t.text :description

      t.timestamps
    end
  end
end
