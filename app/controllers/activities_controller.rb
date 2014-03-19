class ActivitiesController < ApplicationController

  #Here we are checking the conditions whether the user is following before displaying the trackable
  #records to him
  def index
    @activities = Activity.order("created_at desc") #.where(user_id:current_user.followed_users)
    .where(["created_at <= ?", 3.days.ago])
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



#removes activity ,attachement and the micropost posted by the current user
  def remove_activity
    #@other_user = User.find_by(id:params[:user_id])
    @model_string = params[:trackable_type]
    @model_id = params[:trackable_id]

    @model = @model_string.singularize.classify.constantize

    Activity.where(trackable_id: @model_id,trackable_type: @model,user_id: current_user.id).first.destroy

    if(@model_string == "video_attachment")
      @model.find(@model_id).remove_file
    end

    @model.find(@model_id).destroy


    render status: 200,
           json:{
               success:true
           }


  end


end
