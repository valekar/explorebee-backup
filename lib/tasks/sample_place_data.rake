namespace :db do
  desc "Fill database with sample data"
  task populate_place: :environment do
    make_places

  end
end



def make_places

  99.times do |n|
    name  = Faker::Name.name

    place = Place.create!(name:     name,
                 description:"Some description",
      )

    place.place_and_interests.create!(interest_id:Interest.all.shuffle.sample.id)
  end
end