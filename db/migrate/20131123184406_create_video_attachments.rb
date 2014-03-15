class CreateVideoAttachments < ActiveRecord::Migration
  def change
    create_table :video_attachments do |t|
      t.text :description
      t.string :file
      t.belongs_to :attachable, polymorphic: true

      t.timestamps
    end
  end
end
