<?php

namespace Ubercart;


use Facebook\WebDriver\Exception\NoSuchElementException;
use Facebook\WebDriver\WebDriver;
use Facebook\WebDriver\WebDriverBy;
use Facebook\WebDriver\WebDriverExpectedCondition;
use Lmc\Steward\Test\AbstractTestCase;

/**
 * @group ubercart_quick_test
 */
class UbercartQuickTest extends AbstractTestCase
{

    public $runner;

    /**
     * @throws NoSuchElementException
     * @throws \Facebook\WebDriver\Exception\TimeOutException
     * @throws \Facebook\WebDriver\Exception\UnexpectedTagNameException
     */
    public function testUsdPaymentBeforeOrderInstant() {
        $this->runner = new UbercartRunner($this);
        $this->runner->ready(array(
                'capture_mode'           => 'Instant',
            )
        );
    }
}