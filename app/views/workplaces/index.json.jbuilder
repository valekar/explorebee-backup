json.array!(@workplaces) do |workplace|
  json.extract! workplace, :name, :description, :city, :state, :country
  json.url workplace_url(workplace, format: :json)
end