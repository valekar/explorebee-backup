# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20140225172107) do

  create_table "activities", force: true do |t|
    t.integer  "user_id"
    t.string   "action"
    t.integer  "trackable_id"
    t.string   "trackable_type"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "activities", ["trackable_id", "trackable_type"], name: "index_activities_on_trackable_id_and_trackable_type"
  add_index "activities", ["user_id"], name: "index_activities_on_user_id"

  create_table "affinities", force: true do |t|
    t.integer  "user_id"
    t.integer  "other_user_id"
    t.integer  "affinity_measure"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "following",        default: false
  end

  add_index "affinities", ["user_id"], name: "index_affinities_on_user_id"

  create_table "albums", force: true do |t|
    t.string   "photo_image"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "attachments", force: true do |t|
    t.text     "description"
    t.string   "file"
    t.integer  "attachable_id"
    t.string   "attachable_type"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "authorizations", force: true do |t|
    t.string   "provider"
    t.string   "uid"
    t.integer  "user_id"
    t.string   "token"
    t.string   "secret"
    t.string   "email"
    t.string   "url"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "comments", force: true do |t|
    t.text     "content"
    t.integer  "commentable_id"
    t.string   "commentable_type"
    t.string   "user_name"
    t.string   "user_image"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "comments", ["commentable_id", "commentable_type"], name: "index_comments_on_commentable_id_and_commentable_type"

  create_table "favourites", force: true do |t|
    t.integer  "favouritable_id"
    t.string   "favouritable_type"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "file_and_interests", force: true do |t|
    t.integer  "interest_id"
    t.integer  "attachment_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "file_and_interests", ["attachment_id"], name: "index_file_and_interests_on_attachment_id"
  add_index "file_and_interests", ["interest_id"], name: "index_file_and_interests_on_interest_id"

  create_table "identities", force: true do |t|
    t.string   "uid"
    t.string   "provider"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "oauth_token"
    t.datetime "oauth_expires_at"
  end

  add_index "identities", ["user_id"], name: "index_identities_on_user_id"

  create_table "interests", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.string   "image"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "interestships", force: true do |t|
    t.integer  "user_id"
    t.integer  "interest_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "interestships", ["interest_id"], name: "index_interestships_on_interest_id"
  add_index "interestships", ["user_id"], name: "index_interestships_on_user_id"

  create_table "invitations", force: true do |t|
    t.integer  "user_id"
    t.integer  "trip_id"
    t.integer  "invitee_id"
    t.boolean  "unread",     default: true
    t.boolean  "acceptance", default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "invitations", ["trip_id"], name: "index_invitations_on_trip_id"
  add_index "invitations", ["user_id"], name: "index_invitations_on_user_id"

  create_table "locations", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "messages", force: true do |t|
    t.string   "content"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "microposts", force: true do |t|
    t.string   "content"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "microposts", ["user_id", "created_at"], name: "index_microposts_on_user_id_and_created_at"

  create_table "place_albums", force: true do |t|
    t.string   "image"
    t.integer  "place_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "caption"
  end

  add_index "place_albums", ["image"], name: "index_place_albums_on_image"
  add_index "place_albums", ["place_id"], name: "index_place_albums_on_place_id"

  create_table "place_and_interests", force: true do |t|
    t.integer  "place_id"
    t.integer  "interest_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "place_and_interests", ["interest_id"], name: "index_place_and_interests_on_interest_id"
  add_index "place_and_interests", ["place_id"], name: "index_place_and_interests_on_place_id"

  create_table "places", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "favourite",          default: 0
    t.integer  "views",              default: 0
    t.string   "slug"
    t.text     "detail_description"
  end

  create_table "post_and_interests", force: true do |t|
    t.integer  "post_id"
    t.integer  "interest_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "post_and_interests", ["interest_id"], name: "index_post_and_interests_on_interest_id"
  add_index "post_and_interests", ["post_id"], name: "index_post_and_interests_on_post_id"

  create_table "posts", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.string   "postImage"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "rate_and_users", force: true do |t|
    t.integer  "user_id"
    t.integer  "rating_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "rate_and_users", ["rating_id"], name: "index_rate_and_users_on_rating_id"
  add_index "rate_and_users", ["user_id"], name: "index_rate_and_users_on_user_id"

  create_table "ratings", force: true do |t|
    t.integer  "user_id"
    t.integer  "rate",          default: 0
    t.integer  "rateable_id"
    t.string   "rateable_type"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "relationships", force: true do |t|
    t.integer  "follower_id"
    t.integer  "followed_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "relationships", ["followed_id"], name: "index_relationships_on_followed_id"
  add_index "relationships", ["follower_id", "followed_id"], name: "index_relationships_on_follower_id_and_followed_id", unique: true
  add_index "relationships", ["follower_id"], name: "index_relationships_on_follower_id"

  create_table "rs_evaluations", force: true do |t|
    t.string   "reputation_name"
    t.integer  "source_id"
    t.string   "source_type"
    t.integer  "target_id"
    t.string   "target_type"
    t.float    "value",           default: 0.0
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "rs_evaluations", ["reputation_name", "source_id", "source_type", "target_id", "target_type"], name: "index_rs_evaluations_on_reputation_name_and_source_and_target", unique: true
  add_index "rs_evaluations", ["reputation_name"], name: "index_rs_evaluations_on_reputation_name"
  add_index "rs_evaluations", ["source_id", "source_type"], name: "index_rs_evaluations_on_source_id_and_source_type"
  add_index "rs_evaluations", ["target_id", "target_type"], name: "index_rs_evaluations_on_target_id_and_target_type"

  create_table "rs_reputation_messages", force: true do |t|
    t.integer  "sender_id"
    t.string   "sender_type"
    t.integer  "receiver_id"
    t.float    "weight",      default: 1.0
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "rs_reputation_messages", ["receiver_id", "sender_id", "sender_type"], name: "index_rs_reputation_messages_on_receiver_id_and_sender", unique: true
  add_index "rs_reputation_messages", ["receiver_id"], name: "index_rs_reputation_messages_on_receiver_id"
  add_index "rs_reputation_messages", ["sender_id", "sender_type"], name: "index_rs_reputation_messages_on_sender_id_and_sender_type"

  create_table "rs_reputations", force: true do |t|
    t.string   "reputation_name"
    t.float    "value",           default: 0.0
    t.string   "aggregated_by"
    t.integer  "target_id"
    t.string   "target_type"
    t.boolean  "active",          default: true
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "rs_reputations", ["reputation_name", "target_id", "target_type"], name: "index_rs_reputations_on_reputation_name_and_target", unique: true
  add_index "rs_reputations", ["reputation_name"], name: "index_rs_reputations_on_reputation_name"
  add_index "rs_reputations", ["target_id", "target_type"], name: "index_rs_reputations_on_target_id_and_target_type"

  create_table "search_suggestions", force: true do |t|
    t.string   "term"
    t.integer  "popularity"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "search_suggestions", ["term"], name: "index_search_suggestions_on_term"

  create_table "specs", force: true do |t|
    t.string   "workplace"
    t.integer  "user_id"
    t.string   "gender"
    t.integer  "phone"
    t.text     "address"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "location"
    t.integer  "location_id"
  end

  add_index "specs", ["user_id"], name: "index_specs_on_user_id"

  create_table "stories", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "story_and_places", force: true do |t|
    t.integer  "story_id"
    t.integer  "place_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "story_and_places", ["place_id"], name: "index_story_and_places_on_place_id"
  add_index "story_and_places", ["story_id"], name: "index_story_and_places_on_story_id"

  create_table "story_photos", force: true do |t|
    t.string   "image"
    t.integer  "story_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "story_photos", ["story_id"], name: "index_story_photos_on_story_id"

  create_table "trip_and_places", force: true do |t|
    t.integer  "trip_id"
    t.integer  "place_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "from_id"
    t.integer  "to_id"
  end

  add_index "trip_and_places", ["place_id"], name: "index_trip_and_places_on_place_id"
  add_index "trip_and_places", ["trip_id"], name: "index_trip_and_places_on_trip_id"

  create_table "trips", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.text     "destination"
    t.datetime "when_at"
    t.integer  "no_of_days"
    t.integer  "budget"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "phone"
    t.integer  "seats"
    t.string   "from_place"
  end

  create_table "user_and_stories", force: true do |t|
    t.integer  "user_id"
    t.integer  "story_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "user_and_stories", ["story_id"], name: "index_user_and_stories_on_story_id"
  add_index "user_and_stories", ["user_id"], name: "index_user_and_stories_on_user_id"

  create_table "user_and_trips", force: true do |t|
    t.integer  "user_id"
    t.integer  "trip_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "user_and_trips", ["trip_id"], name: "index_user_and_trips_on_trip_id"
  add_index "user_and_trips", ["user_id"], name: "index_user_and_trips_on_user_id"

  create_table "user_and_workplaces", force: true do |t|
    t.integer  "user_id"
    t.integer  "workplace_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "user_and_workplaces", ["user_id"], name: "index_user_and_workplaces_on_user_id"
  add_index "user_and_workplaces", ["workplace_id"], name: "index_user_and_workplaces_on_workplace_id"

  create_table "users", force: true do |t|
    t.string   "name"
    t.string   "email"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "password_digest"
    t.string   "remember_token"
    t.boolean  "admin",           default: false
    t.string   "image"
    t.integer  "phone"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true
  add_index "users", ["remember_token"], name: "index_users_on_remember_token"

  create_table "video_and_interests", force: true do |t|
    t.integer  "video_attachment_id"
    t.integer  "interest_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "video_and_interests", ["interest_id"], name: "index_video_and_interests_on_interest_id"
  add_index "video_and_interests", ["video_attachment_id"], name: "index_video_and_interests_on_video_attachment_id"

  create_table "video_and_places", force: true do |t|
    t.integer  "place_id"
    t.string   "file"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "video_and_places", ["place_id"], name: "index_video_and_places_on_place_id"

  create_table "video_attachments", force: true do |t|
    t.text     "description"
    t.string   "file"
    t.integer  "attachable_id"
    t.string   "attachable_type"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "workplaces", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.string   "city"
    t.string   "state"
    t.string   "country"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
