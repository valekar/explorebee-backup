class ChatsController < ApplicationController
  def room
    @user = current_user
    redirect_to signin_path unless current_user
  end


  def new_message

    # Check if the message is private
    if recipient = params[:message].match(/@(.+) (.+)/)

      # It is private, send it to the recipient's private channel
      @channel = "/messages/private/#{recipient.captures.first}"
      @message = { :username => current_user.name, :msg => recipient.captures.second }
     # PrivatePub.publish_to @channel,@message
    else
      # It's public, so send it to the public channel
      @channel = "/messages/public"
      @message = { :username => current_user.name, :msg => params[:message] }
     # PrivatePub.publish_to @channel,@message
    end


    respond_to do |f|
      f.js
    end

=begin
    @message = Message.new(content:params[:message])


    respond_to do |format|
      if @message.save

        format.js


      end
    end
=end
  end


=begin
  def create

    @message = Message.new(content:params[:message])


    respond_to do |format|
      if @message.save
        @messagess = Message.last
        format.html { redirect_to @message, notice: 'Message was successfully created.' }
        format.json { render json: @message, status: :created, location: @message }
        format.js
      else
        format.html { render action: "new" }
        format.json { render json: @message.errors, status: :unprocessable_entity }
      end
    end
  end

=end

  private

  def message_params
    params.require(:message).permit(:message)
  end



end
