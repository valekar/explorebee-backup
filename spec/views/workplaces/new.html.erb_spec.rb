require 'spec_helper'

describe "workplaces/new" do
  before(:each) do
    assign(:workplace, stub_model(Workplace,
      :name => "MyString",
      :description => "MyText",
      :city => "MyString",
      :state => "MyString",
      :country => "MyString"
    ).as_new_record)
  end

  it "renders new workplace form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form[action=?][method=?]", workplaces_path, "post" do
      assert_select "input#workplace_name[name=?]", "workplace[name]"
      assert_select "textarea#workplace_description[name=?]", "workplace[description]"
      assert_select "input#workplace_city[name=?]", "workplace[city]"
      assert_select "input#workplace_state[name=?]", "workplace[state]"
      assert_select "input#workplace_country[name=?]", "workplace[country]"
    end
  end
end
