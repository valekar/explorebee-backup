class AddDetailDescriptionToPost < ActiveRecord::Migration
  def change
    add_column :posts, :detail_description, :text
  end
end
