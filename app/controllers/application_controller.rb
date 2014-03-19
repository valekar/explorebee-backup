class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  #protect_from_forgery with: :exception
  protect_from_forgery with: :reset_session
  #This one is for activities

  skip_before_filter :verify_authenticity_token, only: [:sign_in]

  #before_filter :miniprofiler


  rescue_from CanCan::AccessDenied do |exception|
     redirect_to root_url, :alert => exception.message
    end


  def track_activity(trackable, action = params[:action])
    current_user.activities.create! action: action, trackable: trackable
  end

  def sign_in(user)
    p ".......#{user.email}................"
    remember_token = User.new_remember_token
    cookies.permanent[:remember_token] = remember_token
    user.update_attribute(:remember_token, User.encrypt(remember_token))
    self.current_user = user
    p "Siging IIIINNNNN"
  end

  def current_user=(user)
    @current_user = user
  end

  def current_user
    remember_token = User.encrypt(cookies[:remember_token])
    @current_user ||= User.where(remember_token: remember_token).first
  end

  def current_user?(user)
    user == current_user
  end

  def signed_in?
    !current_user.nil?
  end

  def sign_out
    self.current_user = nil
    cookies.delete(:remember_token)
  end

  def redirect_back_or(default)
    redirect_to(session[:return_to] || default)
    session.delete(:return_to)
  end

  def store_location
    session[:return_to] = request.url
  end

  def signed_in_user
    unless signed_in?
      store_location
      redirect_to signin_url, notice: "Please sign in."
    end
  end

   def sign_in_for_auth(user)
     #user.update_attribute(:remember_token, User.encrypt(remember_token))
     self.current_user = user
   end



=begin
  def sign_in_with_external(user)
    @current_user ||= user

  end

  def sign_in_with_external?
     true
  end
=end


  def check_search?
     path = Rails.application.routes.recognize_path(request.path)
     url = "#{root_url}#{path[:controller]}/#{path[:action]}"

    defined_url = "#{root_url}#{SearchController.controller_name}/#{SearchController.action_methods.first}"

    if defined_url == url
      return true
    end



  end


  def wrap(content)
    sanitize(raw(content.split.map{ |s| wrap_long_string(s) }.join(' ')))
  end

  helper_method :signed_in?,:current_user,:sign_out,:sign_in,:current_user?,
                :redirect_back_or,:store_location,:signed_in_user,:wrap,:check_search?

  private

  def wrap_long_string(text, max_width = 30)
    zero_width_space = "&#8203;"
    regex = /.{1,#{max_width}}/
    (text.length < max_width) ? text :
        text.scan(regex).join(zero_width_space)
  end


  def miniprofiler
    Rack::MiniProfiler.authorize_request
  end

end
