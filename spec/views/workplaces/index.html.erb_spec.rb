require 'spec_helper'

describe "workplaces/index" do
  before(:each) do
    assign(:workplaces, [
      stub_model(Workplace,
        :name => "Name",
        :description => "MyText",
        :city => "City",
        :state => "State",
        :country => "Country"
      ),
      stub_model(Workplace,
        :name => "Name",
        :description => "MyText",
        :city => "City",
        :state => "State",
        :country => "Country"
      )
    ])
  end

  it "renders a list of workplaces" do
    render
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "tr>td", :text => "Name".to_s, :count => 2
    assert_select "tr>td", :text => "MyText".to_s, :count => 2
    assert_select "tr>td", :text => "City".to_s, :count => 2
    assert_select "tr>td", :text => "State".to_s, :count => 2
    assert_select "tr>td", :text => "Country".to_s, :count => 2
  end
end
