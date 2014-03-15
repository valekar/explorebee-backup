class CreateVideoAndInterests < ActiveRecord::Migration
  def change
    create_table :video_and_interests do |t|
      t.belongs_to :video_attachment, index: true
      t.belongs_to :interest, index: true

      t.timestamps
    end
  end
end
