OmniAuth.config.logger = Rails.logger

Rails.application.config.middleware.use OmniAuth::Builder do
  #provider :facebook, "1375517702683770", "6fa2c57f12b190123dfc77a1b2bc98f4",:image_size => 'large'
  provider :facebook, "226918290833950", "5354027427901710cffb2788307ac7dc",:image_size => 'large'
  provider :linkedin, "xdfkw8cqyl14","DFlLa5mArIKXLj74"




end