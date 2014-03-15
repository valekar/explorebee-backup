class SearchSuggestion < ActiveRecord::Base


=begin
  def self.terms_for(prefix)
    Rails.cache.fetch(["search-terms", prefix]) do
      suggestions = where("term like ?", "#{prefix}_%")
    suggestions.order("popularity desc").limit(10).pluck(:term)
      end
  end
=end

  def self.terms_for(prefix)
    $redis.zrevrange "search-suggestions:#{prefix.downcase}", 0, 9
  end

  def self.index_places
    Place.find_each do |place|
      index_term(place.name)
      place.name.split.each { |t| index_term(t) }
      #index_term(place.category)
    end
  end



  def self.index_users
    User.find_each do |user|
      index_term(user.name)
      User.name.split.each { |t| index_term(t) }
      #index_term(place.category)
    end
  end


=begin
  def self.index_term(term)
    where(term: term.downcase).first_or_initialize.tap do |suggestion|
      suggestion.increment! :popularity
    end
  end
=end


  def self.index_term(term)
    1.upto(term.length - 1) do |n|
      prefix = term[0, n]
      $redis.zincrby "search-suggestions:#{prefix.downcase}", 1, term.downcase
    end
  end
end
