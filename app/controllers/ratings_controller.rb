class RatingsController < ApplicationController

  def rating
    trackable_id = params[:trackable_id]
    trackable_type = params[:trackable_type]
    rating = params[:rating]

    #p "#{trackable_id}++++++++++++#{trackable_type}"

    @rateable = trackable_type.singularize.classify.constantize.find(trackable_id)

    # this is for used for getting the place rating for instance
    @rating = @rateable.rating

    if @rating.nil?

      @rateable.build_rating(rate:rating,user_id:current_user.id)
      @rateable.save
      @rating = @rateable.rating
      @rating.rate_and_users.create(user_id:current_user.id)

    else
      #checking if the user has already rated
      unless @rating.rate_and_users.where(user_id:current_user.id).blank?
        current_rate = @rating.rate
        average_rating = (current_rate+rating)/2

        @rating.update_attributes rate:average_rating
      end
    end

    render json: @rating


  end



end
