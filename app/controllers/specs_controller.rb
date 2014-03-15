class SpecsController < ApplicationController


  def edit
    @user = current_user
    @user.spec ||= Spec.new
    @spec = @user.spec

    if request.post? and params[:spec]
    if @user.spec.update_attributes(spec_params)
      flash[:notice] = "changes applied"
      redirect_to root_url
    end
    end


  end

  private

  def spec_params
    params.require(:spec).permit(:phone,:address,:location)
  end



end
