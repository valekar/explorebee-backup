json.array!(@trips) do |trip|
  json.extract! trip, :name, :description, :destination, :when, :no_of_days, :budget
  json.url trip_url(trip, format: :json)
end