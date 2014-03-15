require 'spec_helper'

describe "trips/show" do
  before(:each) do
    @trip = assign(:trip, stub_model(Trip,
      :name => "Name",
      :description => "MyText",
      :destination => "Destination",
      :no_of_days => 1,
      :budget => 2
    ))
  end

  it "renders attributes in <p>" do
    render
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    rendered.should match(/Name/)
    rendered.should match(/MyText/)
    rendered.should match(/Destination/)
    rendered.should match(/1/)
    rendered.should match(/2/)
  end
end
