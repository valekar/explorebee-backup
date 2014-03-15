class AddLocationToSpec < ActiveRecord::Migration
  def change
    add_column :specs, :location, :string
  end
end
