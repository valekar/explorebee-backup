class StaticPagesController < ApplicationController
  def home

    if signed_in?
      #used to create new micropost
      @micropost  = current_user.microposts.build
      #this collects all the microposts
      @feed_items = current_user.feed.paginate(page: params[:page])
      @user = current_user
      @comment = Comment.new
      #@user_new = User.new

    else
      @user = User.new

      @places = Place.includes(:place_albums).order("created_at asc").limit 10


    end
  end

  def help
  end

  def about
  end

  def contact

  end





  def get_place_photos


    places = Place.includes(:place_albums).order("created_at asc").limit 10

    @places = Array.new

    places.each do |place|
      @mod = Hash.new

      #@mod = place
      @mod[:id] = place.id
      @mod[:name] = place.name
      @mod[:description] = place.description
      @mod[:created_at]=place.created_at
      @mod[:images] =  place.place_albums
      #place[:images] =

      @places << @mod
    end



      render json: @places



  end



end
