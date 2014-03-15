class MicropostsController < ApplicationController
  before_action :signed_in_user, only: [:create, :destroy]
  before_action :correct_user,   only: :destroy

  respond_to :json, only: [:create,:destroy,:vote]

   def show
     @micropost = current_user.microposts.find_by(params[:id])



   end


  def index
  end

  def create
    content = params[:content]
    @micropost = current_user.microposts.build(content:content)

    if @micropost.save
      track_activity @micropost
      render status: 200,
             json:{
                 success:true,
                 micropost: @micropost
             }
    end
  end

  def destroy
    @micropost.destroy
    redirect_to root_url
  end


 def vote
   value = params[:type] == "up"? 1:0
   @micropost = Micropost.find_by(params[:id])
   @micropost.add_or_update_evaluation(:votes,value,current_user)

   render status: 200,
          json: {
              success:true,
              value:value,
              reputation:@micropost.reputation_for(:votes).to_i
          }

 end


  private

  def micropost_params
    params.require(:micropost).permit(:content)
  end


  def correct_user
    @micropost = current_user.microposts.find_by(id: params[:id])
    redirect_to root_url if @micropost.nil?
  end
end
