require 'spec_helper'

describe "places/new" do
  before(:each) do
    assign(:place, stub_model(Place,
      :name => "MyString",
      :description => "MyText"
    ).as_new_record)
  end

  it "renders new place form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form[action=?][method=?]", places_path, "post" do
      assert_select "input#place_name[name=?]", "place[name]"
      assert_select "textarea#place_description[name=?]", "place[description]"
    end
  end
end
