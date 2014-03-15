class CreateUserAndWorkplaces < ActiveRecord::Migration
  def change
    create_table :user_and_workplaces do |t|
      t.belongs_to :user, index: true
      t.belongs_to :workplace, index: true

      t.timestamps
    end
  end
end
