<?php


namespace Ubercart;

use Facebook\WebDriver\Exception\NoSuchElementException;
use Facebook\WebDriver\Exception\TimeOutException;
use Facebook\WebDriver\Exception\UnexpectedTagNameException;
use Facebook\WebDriver\WebDriverDimension;

class UbercartRunner extends UbercartTestHelper
{

    /**
     * @param $args
     *
     * @throws NoSuchElementException
     * @throws TimeOutException
     * @throws UnexpectedTagNameException
     */
    public function ready($args) {
        $this->set($args);
        $this->go();
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function loginAdmin() {
        $this->goToPage('', '#edit-name', true);

        while ( ! $this->hasValue('#edit-name', $this->user)) {
            $this->typeLogin();
        }
        $this->click('.form-submit');
        $this->waitForElement('.toolbar-menu');
    }

    /**
     *  Insert user and password on the login screen
     */
    private function typeLogin() {
        $this->type('#edit-name', $this->user);
        $this->type('#edit-pass', $this->pass);
    }

    /**
     * @param $args
     */
    private function set($args) {
        foreach ($args as $key => $val) {
            $name = $key;
            if (isset($this->{$name})) {
                $this->{$name} = $val;
            }
        }
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function changeCurrency() {
        $this->goToPage("store/settings/store", ".vertical-tabs-list", true);
        $this->click(".vertical-tabs-list li:nth-child(3)");
        $this->waitForElement(".fieldset-wrapper #edit-uc-currency-code");
        $this->type(".fieldset-wrapper #edit-uc-currency-code", $this->currency);
        $this->type(".fieldset-wrapper #edit-uc-currency-sign", $this->currency);
        $this->click("#edit-submit");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function changeMode() {
        $this->goToPage('store/settings/payment/method/credit', '', true);
        $this->click("//strong[contains(text(), 'Paylike Gateway')]");
        $this->click("//label[contains(text(), '" . $this->capture_mode . "')]");
        $this->captureMode();
    }


    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */

    private function logVersionsRemotely() {
        $this->goToPage('modules', '', true);
        $versions = $this->getVersions();
        $this->wd->get(getenv('REMOTE_LOG_URL') . '&key=' . $this->get_slug($versions['ecommerce']) . '&tag=ubercart7&view=html&' . http_build_query($versions));
        $this->waitForElement('#message');
        $message = $this->getText('#message');
        $this->main_test->assertEquals('Success!', $message, "Remote log failed");
    }

    /**
     * @return array
     */
    private function getVersions() {
        $ubercart = $this->wd->executeScript("
            var paylikeLabel = document.querySelectorAll('label[for=\"edit-modules-ubercart-core-uc-store-enable\"]');
            return paylikeLabel[0].parentNode.nextSibling.innerText;
            "
        ); $paylike = $this->wd->executeScript("
            var paylikeLabel = document.querySelectorAll('label[for=\"edit-modules-ubercart-payment-uc-paylike-enable\"]');
            return paylikeLabel[0].parentNode.nextSibling.innerText;
            "
        );

        return ['ecommerce' => $ubercart, 'plugin' => $paylike];
    }


    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    private function directPayment() {

        $this->changeCurrency();
        $this->goToPage('', '.node-add-to-cart');
        $this->addToCart();
        $this->proceedToCheckout();
        $this->amountVerification();
        $this->finalPaylike();
        $this->selectOrder();
        if ($this->capture_mode == 'Delayed') {
            $this->capture();
        } else {
            $this->refund();
        }

    }


    /**
     * @param $status
     *
     * @throws NoSuchElementException
     * @throws TimeOutException
     */


    public function moveOrderToStatus($status) {

        switch ($status) {
            case "Confirmed":
                $selector = "#edit-auth-capture";
                break;
            case "Refunded":
                $selector = "#edit-refund";
                break;
        }
        $this->click("#edit-submit");
        $this->waitForElement(".form-radio");
        $this->click(".form-radio");
        $this->click($selector);
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function capture() {
        $this->moveOrderToStatus('Confirmed');
        $this->waitForElement(".clearfix #console .messages");
        $this->waitForElement('.content #order-pane-order_comments .uc-order-comments tbody tr:last-child .status');
        $messages = $this->getText('.content #order-pane-order_comments .uc-order-comments tbody tr:last-child .status');
        $this->main_test->assertEquals('Payment received', $messages, "Completed");
    }

    /**
     *
     */

    /**
     */
    public function captureMode() {
        $this->click(".form-submit");
        $this->waitforElementToBeClickeble(".status");
    }


    /**
     *
     */
    public function addToCart() {
        $this->click('.node-add-to-cart');
        $this->waitForElement('.form-actions  #edit-checkout--2 ');
        $this->click('.form-actions  #edit-checkout--2');

    }

    /**
     *
     */
    public function proceedToCheckout() {
        $this->type("#edit-panes-delivery-delivery-first-name", "admin");
        $this->type("#edit-panes-delivery-delivery-last-name", "admin");
        $this->type("#edit-panes-delivery-delivery-street1", "admin");
        $this->type("#edit-panes-delivery-delivery-city", "admin");
        $this->selectValue("#edit-panes-delivery-delivery-zone", "1");
        $this->type("#edit-panes-delivery-delivery-postal-code", "000000");
        $this->checkbox('#edit-panes-billing-copy-address');
        $this->waitForElement('#edit-panes-payment-payment-method-credit--2');
        $this->click("#edit-panes-payment-payment-method-credit--2");


    }

    /**
     *
     */
    public function amountVerification() {

        $amount         = $this->wd->executeScript("return window.Drupal.settings.uc_paylike.config.amount");
        $expectedAmount = $this->getText('.line-item-total .price .uc-price');
        $expectedAmount = preg_replace("/[^0-9.]/", "", $expectedAmount);
        $expectedAmount = trim($expectedAmount, '.');
        $expectedAmount = ceil(round($expectedAmount, 4) * get_paylike_currency_multiplier($this->currency));
        $this->main_test->assertEquals($expectedAmount, $amount, "Checking minor amount for " . $this->currency);

    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function choosePaylike() {
        $this->waitForElement('.paylike-button');
        $this->click('.paylike-button');
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function finalPaylike() {
        $this->choosePaylike();
        $this->popupPaylike();

        $this->waitForElement("#edit-continue");
        $this->click("#edit-continue");
        $this->waitForElement(".ucSubmitOrderThrobber-processed");
        $this->click(".ucSubmitOrderThrobber-processed");
        $completedValue = $this->getText("#page-title");
        // because the title of the page matches the checkout title, we need to use the order received class on body
        $this->main_test->assertEquals('Order complete', $completedValue);
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function popupPaylike() {
        try {
            $this->type('.paylike.overlay .payment form #card-number', 41000000000000);
            $this->type('.paylike.overlay .payment form #card-expiry', '11/22');
            $this->type('.paylike.overlay .payment form #card-code', '122');
            $this->click('.paylike.overlay .payment form button');
        } catch (NoSuchElementException $exception) {
            $this->confirmOrder();
            $this->popupPaylike();
        }

    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function selectOrder() {

        $this->goToPage("store/orders/view", ".views-row-first .uc-order-action", true);
        $this->click(".views-row-first .uc-order-action");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function refund() {
        $this->moveOrderToStatus('Refunded');
        $this->waitForElement(".clearfix #console .messages");
        $this->click('.page-admin #branding a:last-child');
        $this->waitForElement('.content #order-pane-order_comments .uc-order-comments tbody tr:last-child .status');
        $messages = $this->getText('.content #order-pane-order_comments .uc-order-comments tbody tr:last-child .status');
        $this->main_test->assertEquals('Canceled', $messages, "Refunded");
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    public function confirmOrder() {
        $this->waitForElement('#paylike-payment-button');
        $this->click('#paylike-payment-button');
    }

    /**
     * @throws NoSuchElementException
     * @throws TimeOutException
     */
    private function settings() {
        $this->changeMode();
    }

    /**
     * @return UbercartRunner
     * @throws NoSuchElementException
     * @throws TimeOutException
     * @throws UnexpectedTagNameException
     */
    private function go() {
        $this->changeWindow();
        $this->loginAdmin();
        if ($this->log_version) {
            $this->logVersionsRemotely();

            return $this;
        }
        $this->settings();
        $this->directPayment();

    }

    /**
     *
     */
    private function changeWindow() {
        $this->wd->manage()->window()->setSize(new WebDriverDimension(1600, 1024));
    }


}

