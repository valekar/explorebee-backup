class CreateStoryAndPlaces < ActiveRecord::Migration
  def change
    create_table :story_and_places do |t|
      t.belongs_to :story, index: true
      t.belongs_to :place, index: true

      t.timestamps
    end
  end
end
