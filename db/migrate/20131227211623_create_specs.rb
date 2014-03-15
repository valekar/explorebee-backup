class CreateSpecs < ActiveRecord::Migration
  def change
    create_table :specs do |t|
      t.string :workplace
      t.belongs_to :user, index: true
      t.string :gender
      t.integer :phone
      t.text :address

      t.timestamps
    end
  end
end
