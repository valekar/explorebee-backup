# encoding: utf-8

###################################################################

# remember to install ffmpegthumbnailer (apt-get install ffmpegthumbnailer)

####################################################################
class VideoUploader < CarrierWave::Uploader::Base
  include CarrierWave::Video
  include CarrierWave::Video::Thumbnailer




=begin

  DEFAULTS = {
      watermark: {
          path: Rails.root.join('/app/assets/images/EX1.png')
      }
  }
=end
   #**************************You have to go through the ffmpeg documentaion*******************************************
   #'-crf 35.0 -vcodec libx264 -acodec libfaac -ar 48000 -ab 128k -coder 1 -flags +loop -cmp +chroma -partitions +parti4x4+partp8x8+partb8x8 -me_method hex -subq 6 -me_range 16 -g 250 -keyint_min 25 -sc_threshold 40 -i_qfactor 0.71 -b_strategy 1 -threads 0'

=begin
  process :encode



  def encode
    encode_video(:mp4,resolution:"200x200", audio_codec: "aac", custom: "-strict experimental -ar 44100 -ab 128k -y -qscale 0.1") do |movie, params|
      if movie.height < 720
        params[:watermark][:path] = Rails.root.join('app/assets/images/EX1.png')

      end

    end
  end
=end






  version :thumb do
    process thumbnail: [{format: 'png', quality: 30, size: 500, strip: true, logger: Rails.logger}]
    def full_filename(for_file)
      png_name for_file, version_name
    end
  end

  def png_name (for_file, version_name )
    %Q{#{version_name}_#{for_file.chomp(File.extname(for_file))}.png}
  end

  #process encode_video: [:mp4 ]
  #version :mp4 do
  #process encode_video: [:mp4, resolution: "200x200"]
  #end
  # Include RMagick or MiniMagick support:
  # include CarrierWave::RMagick
  # include CarrierWave::MiniMagick

  # Choose what kind of storage to use for this uploader:
  storage :file
  # storage :fog

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    "uploads/#{model.class.to_s.underscore}/#{mounted_as}/#{model.id}"
  end

  # Provide a default URL as a default if there hasn't been a file uploaded:
  # def default_url
  #   # For Rails 3.1+ asset pipeline compatibility:
  #   # ActionController::Base.helpers.asset_path("fallback/" + [version_name, "default.png"].compact.join('_'))
  #
  #   "/images/fallback/" + [version_name, "default.png"].compact.join('_')
  # end

  # Process files as they are uploaded:
  # process :scale => [200, 300]
  #
  # def scale(width, height)
  #   # do something
  # end

  # Create different versions of your uploaded files:
  # version :thumb do
  #   process :scale => [50, 50]
  # end

  # Add a white list of extensions which are allowed to be uploaded.
  # For images you might use something like this:
  # def extension_white_list
  #   %w(jpg jpeg gif png)
  # end

  # Override the filename of the uploaded files:
  # Avoid using model.id or version_name here, see uploader/store.rb for details.
  # def filename
  #   "something.jpg" if original_filename
  # end

end
