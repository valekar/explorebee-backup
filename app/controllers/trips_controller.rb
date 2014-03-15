class TripsController < ApplicationController
  before_action :set_trip, only: [:show, :edit, :update, :destroy]

  # GET /trips
  # GET /trips.json
  def index
    @trips = Trip.order('created_at DESC').paginate(page:params[:page],:per_page => 10)
    @mod_trips = Array.new
    @mod = Array.new
    @trips.each do |trip|
       @mod = []

       count = 0
       User.all.each do |user|
         @u = user.invitations.where(trip_id:trip.id,acceptance:true).first
         unless @u.blank?
           count = count+1
         end
       end

       #added the trip object
       @mod << trip

       @invitation = current_user.invitations.where(trip_id:trip.id,invitee_id:trip.user.id).order(:updated_at).last

      if @invitation.blank?
          #check if invitation is there
          @mod << false
          #then set invitee id as trip.user.id coz he is the one who has created it
          @mod << trip.user.id
          @mod << count
      else
        @mod << @invitation.acceptance
        @mod << @invitation.invitee_id
        # to get the number of users who joined the trip
        @mod << count
      end
      @mod_trips << @mod
    end

     @mod_trips.each do |mod|
       p mod[0].id
     end




    @now =Time.now

    gon.trips = @trips

  end

  # GET /trips/1
  # GET /trips/1.json
  def show
  end

  # GET /trips/new
  def new
    @trip = Trip.new
  end

  # GET /trips/1/edit
  def edit
  end

  # POST /trips
  # POST /trips.json
  def create
    @trip = Trip.new(trip_params)
    #place_ids =[]
    place_ids = params[:trip][:place_tokens].split(",")
    from_place_ids = params[:trip][:from_tokens].split(",")
    from_place_id = from_place_ids.first
    user_phone = params[:trip][:phone]

    @users = params[:trip][:userIds]

    user_split = @users.slice(1..-2)
    user_ids = user_split.split(",")
    p user_ids
    p "asdasdasdad"
    p from_place_id

    respond_to do |format|
      if @trip.save
       # ActiveRecord::Base.transaction do
          place_ids.each do |place_id|
            #from form we are accepting oly one place so from_place_ids[0]
            #both @trip.places.where(place_id:place_id) or @trip.places.where(to_id:place_id) fetches same places
            @trip.trip_and_places.create(place_id:place_id,from_id:from_place_id,to_id:place_id) if place_id
          end
          #Sending invitations to the people
          user_ids.each do |uid|
            unless uid=current_user.id
              @trip.create_invitation(user_id:uid,invitee_id:current_user.id)
            end
          end

          @trip.update_attributes(from_place:Place.find(from_place_id).name)

=begin
          unless current_user.spec.blank?
            @spec = current_user.build_spec(phone:user_phone)
            @spec.save
          end
=end
        #end
        current_user.update_attribute(:phone,user_phone)
        #used for who created it
        @trip.create_user_and_trip(user_id:current_user.id)
        format.html { redirect_to trips_path, notice: 'Trip was successfully created.' }
        format.json { render action: 'show', status: :created, location: @trip }
      else

        format.html { render action: 'new' }
        format.json { render json: @trip.errors, status: :unprocessable_entity }

      end
    end
  end

  # PATCH/PUT /trips/1
  # PATCH/PUT /trips/1.json
  def update
    respond_to do |format|
      if @trip.update(trip_params)
        format.html { redirect_to @trip, notice: 'Trip was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @trip.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /trips/1
  # DELETE /trips/1.json
  def destroy
    @trip.destroy
    respond_to do |format|
      format.html { redirect_to trips_url }
      format.json { head :no_content }
    end
  end


  #custom created methods
  def create_trip

    trackable_id = params[:trackable_id]
    trackable_type = params[:trackable_type]
    trip_name = params[:trip_name]
    trip_budget = params[:trip_budget]
    trip_days = params[:trip_days]
    trip_description = params[:trip_description]
    trip_date  = params[:trip_date]
    place_ids = params[:trip_destination].split(",")


    p place_ids

    @trip = Trip.create!(name:trip_name,description:trip_description,budget:trip_budget,when_at:trip_date,no_of_days:trip_days)

    #@trip.trip_and_places.create!(place_id:place_ids) if place_ids


    ActiveRecord::Base.transaction do
        place_ids.each do |place_id|
          @trip.trip_and_places.new(place_id:place_id) if place_id
        end


=begin
        #Sending invitations to the people
        user_ids.each do |uid|
          Invitation.create!(user_id:uid,trip_id:@trip.id,invitee_id:current_user.id)
        end
=end
    end

    @trip.user_and_trips.create!(user_id:current_user.id)

    #@trip.save

    render status: 200,
           json: {
               success:true
           }  and return

  end



  def acceptance
    trip_id = params[:trip_id]
    trip_acceptance = params[:trip_acceptance]
    trip_invitee_id = params[:trip_invitee]
    @trip = Trip.find(trip_id)

    p trip_acceptance
   #@u =  @trip.user_and_trip

    #see if logged in user has an invitation
    @invitation = current_user.invitations.where(trip_id:trip_id,invitee_id:trip_invitee_id).order(:updated_at).last

    if @invitation.blank?
      current_user.invitations.create!(trip_id:trip_id,invitee_id:trip_invitee_id,acceptance:trip_acceptance,unread:false)
    else

      @invitation.update_attributes(acceptance:trip_acceptance)
    end

    respond_to do |f|
      f.json {
        render status: 200,
               json: {
                   acceptance:trip_acceptance
               }
      }
    end

  end




  private
    # Use callbacks to share common setup or constraints between actions.
    def set_trip
      @trip = Trip.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def trip_params
      params.require(:trip).permit(:name, :description, :destination, :when_at,
                                   :no_of_days, :budget,:place_tokens,:seats,:phone,:userIds,:from_tokens)
    end
end
