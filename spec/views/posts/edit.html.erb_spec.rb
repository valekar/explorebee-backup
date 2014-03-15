require 'spec_helper'

describe "posts/edit" do
  before(:each) do
    @post = assign(:post, stub_model(Post,
      :name => "MyString",
      :description => "MyText",
      :postImage => "MyString"
    ))
  end

  it "renders the edit post form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form[action=?][method=?]", post_path(@post), "post" do
      assert_select "input#post_name[name=?]", "post[name]"
      assert_select "textarea#post_description[name=?]", "post[description]"
      assert_select "input#post_postImage[name=?]", "post[postImage]"
    end
  end
end
