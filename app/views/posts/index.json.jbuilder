json.array!(@posts) do |post|
  json.extract! post, :name, :description, :postImage
  json.url post_url(post, format: :json)
end