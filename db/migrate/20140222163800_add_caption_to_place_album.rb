class AddCaptionToPlaceAlbum < ActiveRecord::Migration
  def change
    add_column :place_albums, :caption, :string
  end
end
