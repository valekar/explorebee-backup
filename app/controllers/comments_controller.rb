class CommentsController < ApplicationController
  before_action :load_commentable

  def index
    @comments = @commentable.comments
  end

  def new
    @comment = @commentable.comments.new
  end

  def show
    @comment = Comment.find_by(params[:id])
  end

  #its compulsory to add image....So we should add dummy if image is not provided
  def create
    @content = params[:content]
    @user = current_user

    @comment = @commentable.comments.new(content:@content,user_name:@user.name,
                                         user_image: current_user.image_url(:small).to_s)
    if @comment.save
     # track_activity @comment
      render status: 200,
             json:
                 @comment

    end

  end


  private

    def load_commentable
      resource, id = request.path.split("/")[1,2]
      @commentable = resource.singularize.classify.constantize.find(id)
    end
end
