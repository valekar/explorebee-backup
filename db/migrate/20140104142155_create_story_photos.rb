class CreateStoryPhotos < ActiveRecord::Migration
  def change
    create_table :story_photos do |t|
      t.string :image
      t.belongs_to :story, index: true

      t.timestamps
    end
  end
end
