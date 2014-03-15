class ActivitiesController < ApplicationController

  #Here we are checking the conditions whether the user is following before displaying the trackable
  #records to him
  def index
    @activities = Activity.order("created_at desc")
    .where(user_id:current_user.followed_users).where(["created_at <= ?", 3.days.ago])
    .paginate(page: params[:page], :per_page => 10)


    respond_to do |f|
      f.html {render :index}

      f.js {
        render status: 200,
               json: {
                   success:true,
                   activities:@activities
               }
      }

    end
  end


  #this method is being used for now
  def index_pagination
    @activities = Activity.order("created_at desc")
    .where(["created_at >= ?", 3.days.ago])  #.where(user_id:current_user.followed_users)
    .paginate(page: params[:page], :per_page => 3)

    @flag=true

    if @activities.empty?
      @flag = false
    end

    render status: 200,
           json: {
               success:@flag,
               activities:@activities
           }


  end

end
