class ShowInterestsController < ApplicationController
  before_filter :signed_in_user

  def index

      gon.user_id = params[:id]

     @interests = Interest.all

     respond_to do |f|
       f.html {

       }

     end

  end

  def getIndex
    @interests = Interest.all
      render status: 200,
             json:{
                 success:true,
                 interests:@interests
             }

  end

  def add_interest
    interestId = params[:id]
    user_id = params[:user_id]
     #I am accessing user like this coz of the omniauth n rails 4 compatibility problem
     if current_user
      @user = current_user
     else
      @user = User.find(user_id)

     end


    @interestship = @user.interestships.build(interest_id:interestId)


    sign_in @user
    if @user.interests.find_by(id:interestId).blank?
      if @interestship.save
        respond_to do |f|
          f.html {
               redirect_to root_url
          }
        end
      end
    else
      respond_to do |f|
        f.js {
          render status: 200,
                 json: {
                     success:false
                 }
        }
        end

    end


  end

end
