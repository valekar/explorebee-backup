class SearchSuggestionsController < ApplicationController

  def index

    respond_to do |f|
    f.json { render json: SearchSuggestion.terms_for(params[:term]) }
    end

  end




end
