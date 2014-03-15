#This is used for video/video page

class VideoController < ApplicationController
  def video
      @interests = current_user.interests

      @videos = Array.new
      @interests.each do |interest|
            @videos << interest.video_attachments
      end

      @videosSet = Set.new
      @videos.each do |vid|
        vid.each do |v|
          @videosSet << vid
        end
      end



  end


  def getVideos
    @interests = current_user.interests

    @videos = Set.new
    @interests.each do |interest|
      @videos << interest.video_attachments
    end


    render status: 200,
           json: {
               success:true,
               videos:@videos
           }




  end



end
