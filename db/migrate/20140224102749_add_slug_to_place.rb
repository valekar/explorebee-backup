class AddSlugToPlace < ActiveRecord::Migration
  def change
    add_column :places, :slug, :string
    add_column :places, :detail_description, :text
  end
end
