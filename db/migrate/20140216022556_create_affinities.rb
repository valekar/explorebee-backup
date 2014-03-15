class CreateAffinities < ActiveRecord::Migration
  def change
    create_table :affinities do |t|
      t.belongs_to :user, index: true
      t.integer :other_user_id
      t.integer :affinity_measure

      t.timestamps
    end
  end
end
