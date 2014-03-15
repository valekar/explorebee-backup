require 'spec_helper'

describe ChatsController do

  describe "GET 'room'" do
    it "returns http success" do
      get 'room'
      response.should be_success
    end
  end

end
