class IdentitiesController < ApplicationController

  skip_before_filter :verify_authenticity_token
  skip_before_filter :authenticate_user!
=begin
  def facebook
    auth_hash = request.env["omniauth.auth"]
    uid = auth_hash['uid']
    name = auth_hash['info']['name']
    email = auth_hash['info']['email']

    @authorization = Authorization.find_by_provider_and_uid("facebook", uid)


    if @authorization
      #render :text => "Welcome back #{@authorization.user.name}! You have already signed up."
      user = @authorization.user
      sign_in user
      redirect_to root_url if signed_in?
    else
      user = User.new email:email,remote_image_url:auth_hash.info.image.sub("square","large"),password:"secret@123",
                      password_confirmation:"secret@123"
      user.authorizations.build provider:"facebook",uid:uid,token:auth_hash['credentials']['token'],
          secret:auth_hash['credentials']['token'],
          url:"http:/facebook.com/#{name}"
      user.save

      sign_in user
      redirect_to root_url if signed_in?



    end



  end
=end



  def facebook
    puts "Inside facebookController"
    auth_hash = request.env["omniauth.auth"]
    uid = auth_hash['uid']
    name = auth_hash['info']['name']
    email = auth_hash['info']['email']
    #fetches many so need to get only one.
    @auth = Authorization.find_by_provider_and_uid("facebook", uid)
    @user = nil
    flag = false
    if @auth
      @user = @auth.user
      sign_in_facebook @user
      flag = true
    else
      unless current_user
        unless @user = User.find_by_email(email)
          @user = User.create email:email,
                           password:"password@123" ,
                           password_confirmation:"password@123",
                           remote_image_url:auth_hash.info.image.sub("square","large")



            update_auth @user,auth_hash,@auth
             UserMailer.signup_confirmation(@user).deliver
            sign_in @user

          @user.relationships.create!(followed_id:@user.id)
            respond_to do |f|
              f.html {redirect_to :controller => :show_interests, :action => :index, :id => @user.id, :anchor => "logged_in"}
            end

        end
      else
        @user = current_user
        update_auth @user,auth_hash,@auth
        flag = true
        sign_in_facebook @user

      end
    end

  end


  private

  def sign_in_facebook(user)
    sign_in user
    respond_to do |f|
      f.html {redirect_to root_url}
    end

  end

  def update_auth(user,auth_hash,auth)
    unless auth = user.authorizations.find_by_provider("facebook")
      auth = user.authorizations.build(provider:"facebook",uid:auth_hash['uid'])
      user.authorizations << auth
    end
    auth.update_attributes({
                                uid:auth_hash['uid'],
                                user_id:user.id,
                                token:auth_hash['credentials']['token'],
                                secret:auth_hash['credentials']['token'],
                                url:"http:/facebook.com/#{auth_hash['info']['name']}"
                            })
  end

end
