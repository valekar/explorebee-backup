class AttachmentsController < ApplicationController
   respond_to :json

  def attach_file
    @ids = params[:interestIds]
    @attachments = current_user.attachments.build(file:params[:file],description:params[:myObj])

    @slice = @ids.slice(1..-2)
    @interestIds = @slice.split(",")


    if @attachments.save
      track_activity @attachments

      @interestIds.each do |interest_id|
        @file_interest = @attachments.file_and_interests.build(interest_id:interest_id)
        @file_interest.save
      end
      respond_to do |f|
        f.js{
          render status: 200,
               json: {
                   success:true,
                   getFiles:@attachments
               }
        }
      end

    end

  end

  def attach_video
    @ids = params[:interestIds];
    @attachments = current_user.video_attachments.build(file:params[:file],description:params[:myObj])

    @slice = @ids.slice(1..-2)
    @interestIds = @slice.split(",")



    if @attachments.save
       track_activity @attachments
      @interestIds.each do |interest_id|
        @video_interest = @attachments.video_and_interests.build(interest_id:interest_id)
        @video_interest.save
      end


      respond_to do |f|

          f.js {render status: 200,
                 json: {
                     success:true,
                     getFiles:@attachments
                 }
          }
      end and return
    end
  end


  def attach_place_video

    placeId = params[:placeId]
    file = params[:file]

    @place = Place.find(placeId)
    @place.create_video_and_place(file:file)

    respond_to do |f|
      f.json {
        render status: 200,
               json: {
                   success:true
               }
      }
    end
  end



   def vote_video_attachment
     value = params[:type] == "up"? 1:0
     @video = VideoAttachment.find_by(params[:id])
     @video.add_or_update_evaluation(:votes,value,current_user)
     p @video.reputation_for(:votes).to_i


     render status: 200,
            json: {
                success:true,
                value:value,
                reputation:@video.reputation_for(:votes).to_i
            }

   end

   def vote
     value = params[:type] == "up"? 1:0
     @attachment = Attachment.find_by(params[:id])
     @attachment.add_or_update_evaluation(:votes,value,current_user)

     render status: 200,
            json: {
                success:true,
                value:value,
                reputation:@attachment.reputation_for(:votes).to_i
            }

   end



end
