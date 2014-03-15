require 'spec_helper'

describe "posts/index" do
  before(:each) do
    assign(:posts, [
      stub_model(Post,
        :name => "Name",
        :description => "MyText",
        :postImage => "Post Image"
      ),
      stub_model(Post,
        :name => "Name",
        :description => "MyText",
        :postImage => "Post Image"
      )
    ])
  end

  it "renders a list of posts" do
    render
    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "tr>td", :text => "Name".to_s, :count => 2
    assert_select "tr>td", :text => "MyText".to_s, :count => 2
    assert_select "tr>td", :text => "Post Image".to_s, :count => 2
  end
end
