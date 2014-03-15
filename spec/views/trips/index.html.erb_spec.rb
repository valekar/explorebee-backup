require 'spec_helper'

describe "trips/index" do
  before(:each) do
    assign(:trips, [
      stub_model(Trip,
        :name => "Name",
        :description => "MyText",
        :destination => "Destination",
        :no_of_days => 1,
        :budget => 2
      ),
      stub_model(Trip,
        :name => "Name",
        :description => "MyText",
        :destination => "Destination",
        :no_of_days => 1,
        :budget => 2
      )
    ])
  end

  it "renders a list of trips" do
    render
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "tr>td", :text => "Name".to_s, :count => 2
    assert_select "tr>td", :text => "MyText".to_s, :count => 2
    assert_select "tr>td", :text => "Destination".to_s, :count => 2
    assert_select "tr>td", :text => 1.to_s, :count => 2
    assert_select "tr>td", :text => 2.to_s, :count => 2
  end
end
