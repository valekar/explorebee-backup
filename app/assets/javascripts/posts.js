
$('#post_interest_tokens').tokenInput('/interests.json',
    { preventDuplicates: true},
    {prePopulate: $('#post_interest_tokens').data('load')}


);