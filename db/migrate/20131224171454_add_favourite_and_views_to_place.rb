class AddFavouriteAndViewsToPlace < ActiveRecord::Migration
  def change
    add_column :places, :favourite, :integer,:default => 0
    add_column :places, :views, :integer,default: 0
  end
end
