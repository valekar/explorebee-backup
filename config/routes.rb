  Prototype::Application.routes.draw do

  resources :search_suggestions

  get "search/index"
  resources :locations

  resources :workplaces

  resources :posts

  resources :interests


  resource :messages


  #get "interests/index"
  resources :activities

  get "comments/index"
  get "comments/new"
  get "chats/room"
  get "video/video"
   # get "users/new"

  get "specs/edit"
  post "specs/edit"

  match "/getFollowers",to: "users#getFollowers",via:'get'
    resources :users do
      member do
        get :following, :followers
      end
    end
  resources :sessions,   only: [:new, :create, :destroy]

  resources :microposts, only: [:create, :destroy,:show] do
    resources :comments
    member {post :vote}
  end

  #this is for public activity
  #resources :comments, only: [:show]

  resources :relationships, only: [:create, :destroy]

  get "static_pages/home"
      #get "static_pages/help"
      #get "static_pages/about"
      #get "static_pages/contact"

  resources :sessions, only: [:new, :create, :destroy]
  match '/signup',  to: 'users#new',            via: 'get'
  match '/signin',  to: 'sessions#new',         via: 'get'
  match '/signout', to: 'sessions#destroy',     via: 'delete'

  #these are routes written for angular Js
 match '/user/getphoto', to:'utility#getPhoto', via:'get'
 match '/user/currentuser' ,to:'utility#getCurrentUser',via:'get'


  match '/help',    to: 'static_pages#help',    via: 'get'
  match '/about',   to: 'static_pages#about',   via: 'get'
  match '/contact', to: 'static_pages#contact', via: 'get'



  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
   root 'static_pages#home'

  get  '/chatroom' => 'chats#room', :as => :chat
  post '/new_message' => 'chats#new_message', :as => :new_message

  match '/upload' ,to: "utility#upload_photo",via:'post'
  match '/user/profile_upload',to:"users#profile_upload",via:'post'
  match '/attach_file' ,to: "attachments#attach_file",via:'post'
  match '/attach_video' ,to: "attachments#attach_video",via:'post'
  match "/index_pagination", to:"activities#index_pagination", via:"get"
  match "/show_interests/get_index",to:"show_interests#getIndex",via:"get"
  match "/show_interests",to:"show_interests#index",via:"get"

  match "/interestship", to: "show_interests#add_interest",via:'post'
  match "/get_videos", to: "video#getVideos",via:"get"

  #used in places page
  match "/places/favourite", to: "places#favourite", via:"get"
  get "/places/signed_index"
  match "/places/getPlaces", to:"places#getPlaces",via:"get"
  match "/rating", to: 'ratings#rating', via: "post"
  match "/places/getDetailDescription", to:'places#get_detail_description', via:'get'
  #match "trip/create_trip", to: "trips#create_trip", via:"post"
  post "trips/create_trip"
  post "stories/create_story"
  post "users/create_user_and_work"

  post "trips/acceptance"

  match "/attach_place_video",to: "attachments#attach_place_video",via:'post'

  match "/users/relate", to:"users#relate",via:'post'
  post "/attachments/vote_video_attachment"


  # this is for getting the places in the front page
  match "/static_pages/get_place_photos", to: "static_pages#get_place_photos", via:'get'


=begin
  match '/show_others', to:"users#show_others",via:"get"
  match '/micropost/show_microposts', to:"microposts#show_microposts",via:"get"
=end

  match '/show_others_details', to:"users#show_others_details",via:"get"
  #remove an activity from the userDetail
  post "/activities/remove_activity"
  #this is login through different providers
  match '/auth/:provider/callback', to: 'identities#facebook' , via:[:get,:post]


 match '/utility/getSuggestions', to: 'utility#get_friend_suggestions', via:'get'


  # this iss the common url for all the vote
    post "/utility/commonVote"

    get "utility/get_large_photo"

  #search

    match "/search/getResults", to: 'search#get_results',via:'post'

  resources :attachments do
    resources :comments
    member {post :vote}
  end

  resources :video_attachments do
    resources :comments

end



    resources :places do
      resources :ratings
    end
    resources :stories
    resources :trips
  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller   actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end
  
  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
