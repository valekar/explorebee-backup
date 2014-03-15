class CreateTrips < ActiveRecord::Migration
  def change
    create_table :trips do |t|
      t.string :name
      t.text :description
      t.text :destination
      t.datetime :when_at
      t.integer :no_of_days
      t.integer :budget

      t.timestamps
    end
  end
end
