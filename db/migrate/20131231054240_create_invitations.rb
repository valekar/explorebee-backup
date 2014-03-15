class CreateInvitations < ActiveRecord::Migration
  def change
    create_table :invitations do |t|
      t.belongs_to :user, index: true
      t.belongs_to :trip, index: true
      t.integer :invitee_id
      t.boolean :unread, :default=>true
      t.boolean :acceptance,:default=>false
      t.timestamps
    end
  end
end
