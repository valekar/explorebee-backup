class AddLocationIdToSpec < ActiveRecord::Migration
  def change
    add_column :specs, :location_id, :integer
  end
end
