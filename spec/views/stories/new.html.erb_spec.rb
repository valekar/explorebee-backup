require 'spec_helper'

describe "stories/new" do
  before(:each) do
    assign(:story, stub_model(Story,
      :name => "MyString",
      :description => "MyText"
    ).as_new_record)
  end

  it "renders new story form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form[action=?][method=?]", stories_path, "post" do
      assert_select "input#story_name[name=?]", "story[name]"
      assert_select "textarea#story_description[name=?]", "story[description]"
    end
  end
end
