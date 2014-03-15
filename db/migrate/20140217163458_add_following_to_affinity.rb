class AddFollowingToAffinity < ActiveRecord::Migration
  def change
    add_column :affinities, :following, :boolean, :default => false
  end
end
