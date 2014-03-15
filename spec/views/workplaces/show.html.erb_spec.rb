require 'spec_helper'

describe "workplaces/show" do
  before(:each) do
    @workplace = assign(:workplace, stub_model(Workplace,
      :name => "Name",
      :description => "MyText",
      :city => "City",
      :state => "State",
      :country => "Country"
    ))
  end

  it "renders attributes in <p>" do
    render
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    rendered.should match(/Name/)
    rendered.should match(/MyText/)
    rendered.should match(/City/)
    rendered.should match(/State/)
    rendered.should match(/Country/)
  end
end
