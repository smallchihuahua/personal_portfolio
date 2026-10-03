(function ($) {
    'use strict';

    var form = $('.contact__form'),
        message = $('.contact__msg'),
        form_data;

    // Success function
    function done_func() {
        message.fadeIn().removeClass('alert-danger').addClass('alert-success');
        message.text('Thank you! Your message has been sent.');
        setTimeout(function () {
            message.fadeOut();
        }, 2000);
        form.trigger('reset');
    }

    // fail function
    function fail_func(data) {
        message.fadeIn().removeClass('alert-success').addClass('alert-danger');
        message.text(data.responseText);
        setTimeout(function () {
            message.fadeOut();
        }, 2000);
    }
    
    form.submit(function (e) {
        e.preventDefault();
        form_data = $(this).serialize();
        $.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: form_data
        })
        .done(done_func)
        .fail(fail_func);
    });
    
})(jQuery);