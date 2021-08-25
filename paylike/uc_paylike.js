(function ($) {
  Drupal.behaviors.uc_paylike = {
    attach: function (context, settings) {

      // Attach the code only once
      $('.paylike-button', context).once('uc_paylike', function() {

        function handleResponse(error, response) {
          if (error) {
            return console.log(error);
          }
          console.log(response);
          $('.paylike-button').val(Drupal.t('Change credit card details'));
          $('#paylike_transaction').val(response.transaction.id);
          $('#edit-continue')
            .removeClass('form-disabled')
            .enable();
        }

        $(this).click(function (event) {
          event.preventDefault();
          if (settings.uc_paylike.public_key === "") {
            $('#payment-details').prepend('<div class="messages error">' + Drupal.t('Configure Paylike settings please') + '</div>');
            return;
          }

          var paylike = Paylike({key: settings.uc_paylike.public_key});
          
          config = settings.uc_paylike.config;

          /** Create/place amount object in config object. */
          config.amount = settings.uc_paylike.amount;

          // Get customer information from delivery or billing pane
          var customer = {
            first_name: $('.uc-cart-checkout-form [name*="first_name"]').val(),
            last_name: $('.uc-cart-checkout-form [name*="last_name"]').val(),
            phone: $('.uc-cart-checkout-form [name*="phone"]').val(),
            address1: $('.uc-cart-checkout-form [name*="street1"]').val(),
            address2: $('.uc-cart-checkout-form [name*="street2"]').val(),
          };
          // Email for anonymous users
          if (config.custom.email === '') {
            config.custom.email = config.custom.customer.email = $('.uc-cart-checkout-form [name="panes[customer][primary_email]"]').val();
          }

          config.custom.customer.name = customer.last_name + ' ' + customer.first_name;
          config.custom.customer.phoneNo = customer.phone;
          config.custom.customer.address = customer.address1 + ' ' + customer.address2;

          paylike.pay(config, handleResponse);
        });
      });

    }
  }
})(jQuery);
