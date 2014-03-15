json.array!(@stories) do |story|
  json.extract! story, :name, :description
  json.url story_url(story, format: :json)
end