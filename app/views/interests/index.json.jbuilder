json.array!(@interests) do |interest|
  json.extract! interest, :name, :description
  json.url interest_url(interest, format: :json)
end