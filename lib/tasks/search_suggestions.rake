namespace :search_suggestions do
  desc "Generate search suggestions from places"
  task :index => :environment do
    #indexing places
    SearchSuggestion.index_places
    #indexing users
    SearchSuggestion.index_users


  end
end