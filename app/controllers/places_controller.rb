class PlacesController < ApplicationController
  before_action :set_place, only: [:show, :edit, :update, :destroy]

  #load_and_authorize_resource
  #skip_authorize_resource only: [:show, :get_detail_description ,:signed_index ,:getPlaces ,:favourite]


  # GET /places
  # GET /places.json
  def index

    @places = Place.all

    respond_to do |format|
      format.html
      format.json { render json: @places.where("name like ?", "%#{params[:q]}%") }
    end

  end

  # GET /places/1
  # GET /places/1.json
  def show
    @place = Place.find(params[:id])

    expires_in 5.minutes
    fresh_when @place ,public:true
    @rating = @place.rating
    gon.type = @place.class.name

    p @place.id
    p "asdasdasdasdadsaaaaaaaaaaaaaaaaaaaaaaaa"

    gon.id = @place.id
    @@place_id = @place.id
    gon.user_id = current_user.id  if signed_in?

     #make a thought process to send the objec itself so that u ll not find the object in ratings_controller
    #gon.object = @place

    if !@rating.blank?
      gon.rating = @rating
    end
    #for showing the trips related to this place
    #@trips_for_week = @place.trips.where(when_at: Time.now..7.days.from_now).order(:when_at)






  end


  def get_detail_description
     place_id = params[:place_id]
     p place_id
     p "place IDD"
    @place = Place.find(place_id.to_i)

    respond_to do |f|
      f.json { render json: @place.detail_description }
    end
  end

  # GET /places/new
  def new
    @place = Place.new
  end

  # GET /places/1/edit
  def edit
  end

  # POST /places
  # POST /places.json
  def create
    @place = Place.new(name:params[:place][:name],description:params[:place][:description],detail_description:params[:place][:detail_description])

    interest_ids =params[:place][:interest_tokens].split(",")

   # p interest_ids

    respond_to do |format|
      if @place.save



        ActiveRecord::Base.transaction do
          interest_ids.each do |interest_id|
            @place.place_and_interests.create!(interest_id:interest_id) if interest_id
          end
        end

        @place.place_albums.create(image:params[:place][:image])

        format.html { redirect_to @place, notice: 'Place was successfully created.' }
        format.json { render action: 'show', status: :created, location: @place }
      else
        format.html { render action: 'new' }
        format.json { render json: @place.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /places/1
  # PATCH/PUT /places/1.json
  def update
    respond_to do |format|
      if @place.update(place_params)


        @place.place_albums.create(image:params[:place][:image],caption:params[:place][:caption])


        format.html { redirect_to @place, notice: 'Place was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @place.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /places/1
  # DELETE /places/1.json
  def destroy
    @place.destroy
    respond_to do |format|
      format.html { redirect_to places_url }
      format.json { head :no_content }
    end
  end

  #this is used only for the left part of the /places/signed_index i.e used this for showing the interests
  def signed_index
    #interest_id = params[:interest_id]
   # @modifiedPlaces = []
    @interests = Interest.order(:name)
    @user_interests = current_user.interests.order(:name)
    @otherInterests = @interests-@user_interests

    end


   # urls that are pointing to this method are
   # 1) /places/getPlaces?interest_id=x
   # 2) /places/getPlaces?page=x

  # both these urls are defined in PlaceService.js file called as PlaceService service
  def getPlaces
    @modifiedPlaces = []
    @interests = Interest.order(:name)
    @user_interests = current_user.interests.order(:name)
    @otherInterests = @interests-@user_interests


    interest_id = params[:interest_id]

    if !interest_id.blank?
      @userInterest = Interest.where(id:interest_id).first
    else
      # this is used for default view on the page /places/signed_index
      @userInterest = @user_interests.first
    end



    @places = @userInterest.places.page(params[:page]).per_page(3)
     flag = true

    @places.each do |p|
      @mod = {}
      @mod["place"]=p
      @mod["images"]=p.place_albums

      @modifiedPlaces << @mod
      #respond_to do |f|
    end
    #this flag is used to stop the front end calling the call to the server
    if @modifiedPlaces.empty?
      flag = false
    end

    respond_to do |f|
      f.js {
        render json: {
                   modifiedData:@modifiedPlaces,
                   success:flag
               }
      }
    end and return
  end



  def favourite
    place_id = params[:place]

    Place.increment_counter :favourite,place_id

    render status: 200,
           json: {
               success:true
           }


  end






  private
    # Use callbacks to share common setup or constraints between actions.
    def set_place
      p "asdaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      #@place = Place.friendly.find(params[:id])
      p params[:id]
      p "asdfasdasdd"
      @place = Place.includes(:place_albums).find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def place_params
      params.require(:place).permit(:name, :description,:interest_tokens,:detail_description)
    end

  def interest_param
    params.permit(:interest_tokens)
  end

  def image_param
    params.require(:place).permit(places_albums: [:image])
  end

end
