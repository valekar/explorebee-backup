require 'spec_helper'

describe "Static Pages" do
   describe "Home Page" do
     before { visit static_pages_home_path }

     it "should have the content 'Home Page'" do
       expect(page).to have_content('Home Page')
     end

     it "should have title 'Prototype App | Home'" do
        expect(page).to have_title('Prototype App | Home')
     end

     it "should have base title 'Prototype App'" do
       expect(page).to have_title('Prototype App')
     end

     it "should not have a custom title" do
       expect(page).not_to have_title('|   Homee')
     end


     describe "for signed-in users" do
       let(:user) { FactoryGirl.create(:user) }
       before do
         FactoryGirl.create(:micropost, user: user, content: "Lorem")
         FactoryGirl.create(:micropost, user: user, content: "Ipsum")
         sign_in user
         visit root_path
       end

       it "should render the user's feed" do
         user.feed.each do |item|
           expect(page).to have_selector("li##{item.id}", text: item.content)
         end
       end

       describe "follower/following counts" do
         let(:other_user) { FactoryGirl.create(:user) }
         before do
           other_user.follow!(user)
           visit root_path
         end

         it { should have_link("0 following", href: following_user_path(user)) }
         it { should have_link("1 followers", href: followers_user_path(user)) }
       end
     end
   end


  describe "Help Page" do
    before {visit help_path}
    it  "should have content 'Help Page'" do
      expect(page).to have_content('Help Page')
    end

    it "should have title 'Help'" do
      expect(page).to have_title('Help')
    end
  end

  describe "About Us" do
    before {visit about_path}
    it "should have content 'About Us'" do
      expect(page).to have_content('About Us')
    end

    it "should have title 'About'" do
      expect(page).to have_title('About')
    end
  end

   describe "Contact Us" do
     let(:contact) {'Contact'}
     before {visit contact_path}
     it "should have content 'Contact Us'" do
       expect(page).to have_content(contact)
     end

     it "should have title 'Contact'" do
       expect(page).to have_title(contact)
     end
   end

end
