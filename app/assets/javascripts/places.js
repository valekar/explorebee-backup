$('#place_interest_tokens').tokenInput('/interests.json',
    { preventDuplicates: true},
    {prePopulate: $('#place_interest_tokens').data('load')}
);


$('#trip_place_tokens').tokenInput('/places.json',
    { preventDuplicates: true},
    {prePopulate: $('#trip_place_tokens').data('load')}
);



$('#trip_from_tokens').tokenInput('/places.json',
    { preventDuplicates: true,
    prePopulate: $('#trip_from_tokens').data('load'),
        onAdd: function(item) {
            if ($("#trip_from_tokens").tokenInput("get").length > 1) {
                $("#trip_from_tokens").tokenInput("clear");
            }
            $("#trip_from_tokens").tokenInput("add", item);
        }

    });



$('#user_location_tokens').tokenInput('/locations.json',{token_limit:1,
    hintText: "Locations", preventDuplicates: true,onAdd: function(item) {
        if ($("#user_location_tokens").tokenInput("get").length > 1) {
            $("#user_location_tokens").tokenInput("clear");
        }
        $("#user_location_tokens").tokenInput("add", item);
    }});