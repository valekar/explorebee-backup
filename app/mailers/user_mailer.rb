class UserMailer < ActionMailer::Base
  default from: "srinivas.valekar@explorebee.com"


  def signup_confirmation(user)
   @user = user

    mail to: user.email,subject: "Sign Up Confirmation"
  end
end
