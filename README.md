# Ubercart plugin for Paylike

This plugin is *not* developed or maintained by Paylike but kindly made
available by a user.

Released under the GPL V3 license: https://opensource.org/licenses/GPL-3.0

## Supported Ubercart versions

*The plugin has been tested with most versions of Ubercart at every iteration. We recommend using the latest version of Ubercart, but if that is not possible for some reason, test the plugin with your Ubercart version and it would probably function properly.*

* Ubercart
 version last tested on: *7.x-3.12* on Drupal 7.67


## Installation

1. Once you have installed Ubercart on your Drupal setup, follow these simple steps:
  Signup at (paylike.io) [https://paylike.io] (it’s free)
1. Create a live account
1. Create an app key for your Drupal website
1. Upload the ```paylike.zip``` trough the Drupal Admin
1. Activate the plugin through the 'Modules' screen in Drupal.
1.  Visit your Ubercart Store Administration page, Configuration
       section, and enable the gateway under the Payment Gateways.
       (admin/store/settings/payment/edit/gateways)
1. Select the default credit transaction type. This module supports immediate
       or delayed capture modes. Immediate capture will be done when users confirm
       their orders. In delayed mode administrator should capture the money manually from
       orders administration page (admin/store/orders/view). Select an order and click
       "Process card" button in Payment block on the top. Check "PRIOR AUTHORIZATIONS"
       block to manually capture a needed amount of money.
1. Insert Paylike API keys, from https://app.paylike.io
       (admin/store/settings/payment/method/credit)
1. Download and install the Paylike PHP Library version 1.0.4 or newer
       from https://github.com/paylike/php-api/releases. The recommended technique is
       to use the command:

       `drush ldl paylike`

       If you don't use `drush ldl paylike`, download and install the Paylike library in
       `sites/all/libraries/paylike` such that the path to `composer.json`
       is `sites/all/libraries/paylike/composer.json`. YOU MUST CLEAR THE CACHE AFTER
       CHANGING THE PAYLIKE PHP LIBRARY. The Libraries module caches its memory of
       libraries like the Paylike Library.

 1. The uc_credit setting "Validate credit card numbers at checkout" must be
    disabled on `admin/store/settings/payment/method/credit` - uc_credit never sees
    the credit card number, so cannot properly validate it (and we don't want it to
    ever know the credit card number.)

## Updating settings

Under the Paylike payment method settings, you can:
 * Update the payment method text in the payment gateways list
 * Update the payment method description in the payment gateways list
 * Update the title that shows up in the payment popup 
 * Add test/live keys
 * Set payment mode (test/live)
 * Change the capture type (Instant/Delayed)
 
 ## How to
 
 1. Capture
 * In Instant mode, the orders are captured automatically
 * In delayed mode you can capture an order by using the Payment box in the View Tab
 2. Refund
   * To refund an order move you can use the Payment box in the View Tab. Click process card and then refund.
 3. Void
   * To void an order move you can use the Payment box in the View Tab. Click process card and then void.