class UtilityController < ApplicationController
  respond_to :json

  def getPhoto
    render status:200,
                 json:{
                     success:true,
                     currentUserPhoto:profile_photo_url
                 }
  end

  def getCurrentUser
    render status: 200,
           json:{
               success:true,
               currentUser:current_user
           }
  end

  def upload_photo
    @user = current_user
    myObj = params[:file]
    photo = @user.albums.create(photo_image:myObj)


    render status: 200,
           json: {

               albums:photo
           }
  end


  #used for getting the suggestions
  def get_friend_suggestions

    @affinities = current_user.affinities.where(following:false).order("affinity_measure desc").limit 5



    if @affinities.blank?
      @affinities = Array.new
    end

    @suggested_users = Array.new
    @affinities.each do |affinity|
      @u =  User.find(affinity.other_user_id)
      @hash_value = Hash.new

      @hash_value[:name] = @u.name
      @hash_value[:photo_url] = @u.image_url(:normal).to_s
      @hash_value[:user_id] = @u.id
      @hash_value[:following] = affinity.following
      @hash_value[:affinity_id] = affinity.id
      @suggested_users << @hash_value

    end


    respond_to do |f|
      f.json {
        render status: 200,
               json: {
                   affinities:@suggested_users
               }
      }
    end

  end



  def commonVote
    p "Heelloooo"

    value = params[:type] == "up"? 1:0
    model = params[:model].singularize.classify.constantize
    @model =model.find(params[:id])
    p "IDDDD"
    p params[:id]
    @model.add_or_update_evaluation(:votes,value,current_user)
    render status: 200,
           json: {
               success:true,
               value:value,
               reputation:@model.reputation_for(:votes).to_i
           }

  end


  def get_large_photo
    render status: 200,
           json:{
               success:true,
               url:current_user.image_url(:normal).to_s
           }
  end


  private
  def profile_photo_url
    current_user.image_url(:small).to_s

=begin
    User.find_by_sql(
      "select image from users where id = #{current_user.id}"
    )
=end

  end



end
