class CreateFileAndInterests < ActiveRecord::Migration
  def change
    create_table :file_and_interests do |t|
      t.belongs_to :interest, index: true
      t.belongs_to :attachment, index: true

      t.timestamps
    end
  end
end
