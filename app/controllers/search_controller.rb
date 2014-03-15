class SearchController < ApplicationController
  #before_filter :check ,only: :get_results

=begin
  def index

   @query = {}

   if params[:query].blank?
   @query = session[:query]
   session[:query] = {}
     p @query
   else

     @asd = "asdsadasdasd"
     @query[:query] = params[:query]
     p @query
   end


    # search_term = @query[:query]

    #@places = Place.search search_term


    query = params[:query]

    @places = Place.search query, partial: true

  end
=end

=begin
  def get_results
      search_text = params[:search]
      session[:query] = search_text

      respond_to do |f|
        f.json { render json:  search_text }
      end
  end
=end


  #private
=begin

  def check

    session[:query]= "search"
  end
=end




 def index

   # if reindexing is not done then u ll get 400 error
   #Place.reindex
   #User.reindex
   query = params[:query]
   converted_query = query.gsub('%20',' ')
   @places = Place.search converted_query,partial: true,fields: [{name: :word}] ,page: params[:page], :per_page => 3

   @users = User.search converted_query,partial: true,fields: [{name: :word}] ,page: params[:page], :per_page => 3
end

end
