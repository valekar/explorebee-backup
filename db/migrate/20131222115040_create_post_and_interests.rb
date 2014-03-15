class CreatePostAndInterests < ActiveRecord::Migration
  def change
    create_table :post_and_interests do |t|
      t.belongs_to :post, index: true
      t.belongs_to :interest, index: true

      t.timestamps
    end
  end
end
