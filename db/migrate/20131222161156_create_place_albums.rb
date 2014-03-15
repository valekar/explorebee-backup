class CreatePlaceAlbums < ActiveRecord::Migration
  def change
    create_table :place_albums do |t|
      t.string :image
      t.belongs_to :place
      t.timestamps
    end

    add_index :place_albums ,:image
    add_index :place_albums, :place_id

  end
end
