class UsersController < ApplicationController
  before_action :signed_in_user,
                only: [:index, :edit, :update, :destroy, :following, :followers]
  before_action :correct_user,   only: [:edit, :update]
  before_action :admin_user,     only: :destroy

  load_and_authorize_resource
  skip_authorize_resource except:[:destroy]

  def show
    # this is used to show profile
    @user = User.find_by(id:params[:id])
    @microposts = @user.microposts.paginate(page: params[:page])


  end


  #used for user activities http://webserver:3000/activities
  def show_others_details
    @other_user = User.find_by(id:params[:user_id])
    @model = params[:trackable_type]

    if @model === 'Micropost'
      @feed = Micropost.where(id:params[:trackable_id],user_id:params[:user_id]).first
      p "MMIIIIIIICCCCCRRROoOO VVVOOOOOTTTTEEESssss"
      p @feed.reputation_for(:votes).to_i
      @comments = @feed.comments
    end

    if @model === "Attachment"
      @feed = @other_user.attachments.where(id:params[:trackable_id]).first
      @comments = @feed.comments
    end

    if @model === "VideoAttachment"
      @feed = @other_user.video_attachments.where(id:params[:trackable_id]).first
      p " VVVVIIIIIIDDEEEOOO VVVOOOOOTTTTEEESssss"
      p @feed.reputation_for(:votes).to_i
      @comments = @feed.comments
    end

    modified_model = @model.underscore.pluralize

    respond_to do |f|

      f.js {
        render status: 200,
               json:{
                   success:true,
                   feed:@feed,
                   otherUser:@other_user,
                   otherUserPhoto:user_photo_url(@other_user),
                   otherUserPhotoEnable:true,
                   currentUserPhoto:user_photo_url(current_user),
                   currentUserPhotoEnable:false,
                   feedModel:modified_model,
                   comments:@comments,
                   #this is sent in this format coz in the front end and while updating the vote I have sent this format refer
                   # Refer attachments_controller#vote method
                   vote:{
                       success:true,
                       reputation:@feed.reputation_for(:votes).to_i
                   }

               }
      }
    end
  end








  def new
     @user = User.new()
  end

  def index
    @users = User.paginate(page: params[:page])
  end

  def create
    @user = User.new(user_params)


    if @user.save
      @user.relationships.create!(followed_id:@user.id)
      #UserMailer.signup_confirmation(@user).deliver

    ConfirmationMail.perform_async(@user.id)

      sign_in @user
      flash[:success] = "Welcome to the Sample App!"
      redirect_to show_interests_path
    else
      render 'new'
    end
  end


  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if @user.update_attributes(user_params)
      flash[:success] = "Profile updated"
      sign_in @user
      redirect_to root_url
    else
      render 'edit'
    end
  end


  def destroy
    User.find(params[:id]).destroy
    flash[:success] = "User destroyed."
    redirect_to users_url
  end

  def following
    @title = "Following"
    @user = User.find(params[:id])
    @users = @user.followed_users.paginate(page: params[:page])
    render 'show_follow'
  end

  def followers
    @title = "Followers"
    @user = User.find(params[:id])
    @users = @user.followers.paginate(page: params[:page])
    render 'show_follow'
  end


  def profile_upload
    photo = params[:file]
    #@user = current_user
    email = current_user.email

    #@user = User.where(email:email).first

    current_user.update_attribute(:image,photo)

    render status: 200,
           json: {
               photo_url:current_user.image_url(:thumb).to_s
           }

  end




  def create_user_and_work
    workplace_ids = params[:workplace_ids]
    user_id = params[:user_id]

    location_ids = params[:location_ids]

    p "Location id :::------ #{location_ids}"
    p workplace_ids

    if user_id.blank?
      @user = current_user
    else
      @user = User.find(params[:user_id])
      current_user = @user
    end

    p @user
    p current_user

    if @user.user_and_workplaces.blank?

=begin
      if current_user.spec.blank?
        @workplace = Workplace.find(workplace_ids.first)
        @spec = current_user.build_spec(workplace:@workplace.name)
        @spec.save
      end

=end
=begin
      ActiveRecord::Base.transaction do
        workplace_ids.each do |workplace_id|
          @user.user_and_workplaces.create!(workplace_id:workplace_id)
        end
      end
=end
      @user.user_and_workplaces.create!(workplace_id:workplace_ids)

    end


    if @user.spec.blank?
      @user.create_spec(location_id:location_ids)
    else
      @spec = @user.spec
      @spec.update_attribute(:location_id,location_ids)
    end


    unless user_id.blank?
      @user = User.find(user_id)
      sign_in @user
    end

    respond_to do |f|
      f.json {
        render status: 200,
               json: {
                   success:true
               }
      }
    end

  end


  def getFollowers
    @users = current_user.followed_users#.paginate(page:params[:page],:per_page=>2)



    respond_to do |f|
      f.json {
        render status: 200,
               json: {
                   success:"true",
                   users:@users
               }
      }
    end
  end


  def relate

    other_user_id = params[:other_id].to_i
    affinity_id = params[:affinity_id]

    if current_user.id_following? other_user_id
      current_user.id_unfollow! other_user_id
      @affinity = Affinity.find(affinity_id)
      @affinity.update_attribute(:following,false)
    else
      current_user.id_follow! other_user_id
      @affinity = Affinity.find(affinity_id)
      @affinity.update_attribute(:following,true)

    end

    respond_to do |f|
      f.json { render json: @affinity }

    end
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password,
                                 :password_confirmation,:image)
  end

  # Before filters
  def correct_user
    @user = User.find(params[:id])
    redirect_to(root_path) unless current_user?(@user)
  end

  def admin_user
    redirect_to(root_path) unless current_user.admin?
  end

  def user_photo_url(user)
    user.image_url(:small).to_s
  end

end
