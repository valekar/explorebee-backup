class FriendingWorker
  include Sidekiq::Worker

  # tomo write the friending model finish this up by this weekend tats it!!


  def perform(user_id)
    #just another variable for storing the affinity measure
    affinity_measure = 1

    @user = User.find(user_id)
     #get the user interests
    @interests = @user.interests
     # get the random interest
    @interest = @interests.sample
     #select all the users who are having the selected interest
    @all_users = @interest.users

    #randomly select 5 users
    @sample_users = @all_users.sample(5)
    @sample_users.each do |user|
        unless user.id == @user.id
          unless @user.following? user
            #1 find the location 5%
            if @user.spec.location_id == user.spec.location_id
               affinity_measure = affinity_measure*5
            end

            #2 find the office  20%
            if @user.workplaces.first.id == user.workplaces.first.id
               affinity_measure = affinity_measure + 20
            end


            #3 get the number of interests no x 5%
            @first_user_interests_objects = @user.interests
            first_user_interests = Array.new

            @first_user_interests_objects.each do |i|
              first_user_interests << i.id
            end

            @second_user_interests_objects = @user.interests
            second_user_interests = Array.new

            @second_user_interests_objects.each do |i|
              second_user_interests << i.id
            end

            @common = first_user_interests & second_user_interests

            @size = @common.size

            affinity_measure = affinity_measure + @size*5
            #4 get the places rated if there are similar place rated then get the sq of the rating then multiply with the .1%
            #@first_user_ratings_objects =  Rating.where(user_id:@user.id)
            #@second_user_ratings_objects = Rating.where(user_id:user.id)

            #5 following 5% get if other user is following this user i.e other_user.following?(@user) 5%

            if user.following?(@user)
              affinity_measure = affinity_measure + 5
            end

            #insert the value into the affinity table for later suggestions
            if @user.affinities.where(other_user_id:user.id).first.blank?
              @user.affinities.create!(other_user_id:user.id, affinity_measure:affinity_measure)
            end

          end
        end
      end

  end




end