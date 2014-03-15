json.array!(@places) do |place|
  json.extract! place, :name, :description
  json.url place_url(place, format: :json)
end