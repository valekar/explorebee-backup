class CreateWorkplaces < ActiveRecord::Migration
  def change
    create_table :workplaces do |t|
      t.string :name
      t.text :description
      t.string :city
      t.string :state
      t.string :country

      t.timestamps
    end
  end
end
