#Testing

As you can see the plugin is bundled with selenium testing on this repository. You can use the tests, if you have some experience with testing it could be helpful. 
*DO NOT USE IN PRODUCTION, THE TESTS MODIFY SETTINGS AND CREATE ORDERS*

## Requirements

* A ubercart installation is required, in which you need to have the default theme installed. 
* You also need to have a test client account with previous purchases and an admin account for which you set the credentials in the .env file
* Lastly you need to have a product available to be added to cart on the homepage of the shop.

## Getting started

1. Follow 1 and 2 from the [Steward readme page](https://github.com/lmc-eu/steward#getting-started)
2. Create an env file in the root folder and add the following:
`
ENVIRONMENT_URL="http://drupal7.local"
ENVIRONMENT_USER="admin_user"
ENVIRONMENT_PASS="admin_pass"
ADMIN_PREFIX = "admin"
ENVIRONMENT_CLIENT_USER = "client_user"
ENVIRONMENT_CLIENT_PASS = "client_pass"
`

3. Start the testing server. See
[Steward readme page](https://github.com/lmc-eu/steward#4-run-your-tests)
4. Run  ./vendor/bin/steward run staging chrome --group="ubercart_quick_test" -vv for the short test
5. Run  ./vendor/bin/steward run staging chrome -vv to go trough all the available tests.

## Problems

Since this is a frontend test, its not always consistent, due to delays or some glitches regarding overlapping elements. If you can't get over an issue please open an issue and I'll take a look. 