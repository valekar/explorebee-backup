class CreateRateAndUsers < ActiveRecord::Migration
  def change
    create_table :rate_and_users do |t|
      t.belongs_to :user, index: true
      t.belongs_to :rating, index: true

      t.timestamps
    end
  end
end
