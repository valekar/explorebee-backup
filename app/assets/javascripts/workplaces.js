$('#user_workplace_tokens').tokenInput('/workplaces.json', {token_limit:1,
        hintText: "College/company name", preventDuplicates: true,onAdd: function(item) {
    if ($("#user_workplace_tokens").tokenInput("get").length > 1) {
        $("#user_workplace_tokens").tokenInput("clear");
    }
    $("#user_workplace_tokens").tokenInput("add", item);
}}
);




$(function(){
    $('.ui-autocomplete').addClass('f-dropdown');
    $('#query').autocomplete({
        source:"/search_suggestions"
    })
});
