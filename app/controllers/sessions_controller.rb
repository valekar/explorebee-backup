class SessionsController < ApplicationController
  def new
  end

  def create
    auth = request.env['omniauth.auth']
    if auth.nil?
      user = User.find_by(email: params[:session][:email].downcase)
      if user && user.authenticate(params[:session][:password])
        sign_in user

        FriendingWorker.perform_async(user.id)

        #TaskWorker.perform_async



        redirect_back_or root_url
      else
        flash.now[:error] = 'Invalid email/password combination'
        render 'new'
      end
    end
  end

  def destroy
    sign_out
    redirect_to root_url
  end
end
