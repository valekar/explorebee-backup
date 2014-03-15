class WorkplacesController < ApplicationController
  before_action :set_workplace, only: [:show, :edit, :update, :destroy]

  # GET /workplaces
  # GET /workplaces.json
  def index
    @workplaces = Workplace.order(:name)

    respond_to do |f|
      f.html
      f.json {render json: @workplaces.where("name like ?", "%#{params[:q]}%")}

    end

  end

  # GET /workplaces/1
  # GET /workplaces/1.json
  def show
  end

  # GET /workplaces/new
  def new
    @workplace = Workplace.new
  end

  # GET /workplaces/1/edit
  def edit
  end

  # POST /workplaces
  # POST /workplaces.json
  def create
    @workplace = Workplace.new(workplace_params)

    respond_to do |format|
      if @workplace.save
        format.html { redirect_to @workplace, notice: 'Workplace was successfully created.' }
        format.json { render action: 'show', status: :created, location: @workplace }
      else
        format.html { render action: 'new' }
        format.json { render json: @workplace.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /workplaces/1
  # PATCH/PUT /workplaces/1.json
  def update
    respond_to do |format|
      if @workplace.update(workplace_params)
        format.html { redirect_to @workplace, notice: 'Workplace was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @workplace.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /workplaces/1
  # DELETE /workplaces/1.json
  def destroy
    @workplace.destroy
    respond_to do |format|
      format.html { redirect_to workplaces_url }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_workplace
      @workplace = Workplace.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def workplace_params
      params.require(:workplace).permit(:name, :description, :city, :state, :country)
    end
end
