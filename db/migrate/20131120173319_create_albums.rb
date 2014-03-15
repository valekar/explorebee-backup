class CreateAlbums < ActiveRecord::Migration
  def change
    create_table :albums do |t|
      t.string :photo_image
      t.belongs_to :user
      t.timestamps
    end
  end
end
