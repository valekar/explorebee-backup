require 'spec_helper'

describe "trips/edit" do
  before(:each) do
    @trip = assign(:trip, stub_model(Trip,
      :name => "MyString",
      :description => "MyText",
      :destination => "MyString",
      :no_of_days => 1,
      :budget => 1
    ))
  end

  it "renders the edit trip form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form[action=?][method=?]", trip_path(@trip), "post" do
      assert_select "input#trip_name[name=?]", "trip[name]"
      assert_select "textarea#trip_description[name=?]", "trip[description]"
      assert_select "input#trip_destination[name=?]", "trip[destination]"
      assert_select "input#trip_no_of_days[name=?]", "trip[no_of_days]"
      assert_select "input#trip_budget[name=?]", "trip[budget]"
    end
  end
end
