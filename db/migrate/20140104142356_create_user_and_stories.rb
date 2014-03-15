class CreateUserAndStories < ActiveRecord::Migration
  def change
    create_table :user_and_stories do |t|
      t.belongs_to :user, index: true
      t.belongs_to :story, index: true

      t.timestamps
    end
  end
end
