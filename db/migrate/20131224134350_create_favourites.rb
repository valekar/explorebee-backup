class CreateFavourites < ActiveRecord::Migration
  def change
    create_table :favourites do |t|
      t.belongs_to :favouritable, polymorphic: true
      t.integer :user_id

      t.timestamps
    end
  end
end
