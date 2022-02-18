/// <reference types="cypress" />

'use strict';

import { PaylikeTestHelper } from './test_helper.js';

export var TestMethods = {

    /** Admin & frontend user credentials. */
    StoreUrl: (Cypress.env('ENV_ADMIN_URL').match(/^(?:http(?:s?):\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im))[0],
    AdminUrl: Cypress.env('ENV_ADMIN_URL'),
    RemoteVersionLogUrl: Cypress.env('REMOTE_LOG_URL'),
    CaptureMode: 'Delayed',

    /** Construct some variables to be used bellow. */
    ShopName: 'ubercart',
    PaylikeName: 'paylike',
    ShopAdminUrl: '/store/settings/store', // used for change currency
    PaymentMethodsAdminUrl: '/store/settings/payment/method/credit',
    OrdersPageAdminUrl: '/store/orders/view',

    /**
     * Login to admin backend account
     */
    loginIntoAdminBackend() {
        cy.loginIntoAccount('input[name=name]', 'input[name=pass]', 'admin');
    },

    /**
     * Modify Paylike settings
     */
    changePaylikeCaptureMode() {
        /** Go to payments page, and select Paylike. */
        cy.goToPage(this.PaymentMethodsAdminUrl);

        /** Select paylike & config its settings. */
        cy.get('a strong').contains(this.PaylikeName, {matchCase: false}).click();

        /** Change capture mode to delayed & save. */
        cy.get('#edit-uc-pg-uc-paylike-cc-txn-type-authorize').click();
        cy.get('#edit-submit').click();
    },

    /**
     * Make an instant payment
     * @param {String} currency
     */
    makePaymentFromFrontend(currency) {
        /** Go to store frontend. */
        cy.goToPage(this.StoreUrl);

        /** Add to cart random product. */
        var randomInt = PaylikeTestHelper.getRandomInt(/*max*/ 1);
        cy.get('.node-add-to-cart').eq(randomInt).click();
        cy.wait(1000);

        /** Proceed to checkout. */
        cy.get('#edit-checkout--2').click();

        /** Select saved address. */
        cy.get('#edit-panes-delivery-select-address').select('0');

        /** Fill in shipping address fields. */
        /** We do not need to fill in address if have previous orders. */
        // cy.get('#edit-panes-delivery-delivery-first-name').clear().type('firstName');
        // cy.get('#edit-panes-delivery-delivery-last-name').clear().type('lastName');
        // cy.get('#edit-panes-delivery-delivery-street1').clear().type('street');
        // cy.get('#edit-panes-delivery-delivery-city').clear().type('city');
        // cy.get('#edit-panes-delivery-delivery-zone').select('1');
        // cy.get('#edit-panes-delivery-delivery-postal-code').clear().type('000000');

        cy.wait(2000);

        /** Select that billing address to be the sam as shipping. */
        cy.get('#edit-panes-billing-copy-address').click();

        /** Choose Paylike. */
        // cy.get('#edit-panes-payment-payment-method-credit--2').click();

        /** Wait for window paylike amount to be available. */
        cy.wait(500);

        /** Get & Verify amount. */
        cy.get('.line-item-total .price .uc-price').then(($totalAmount) => {
            cy.window().then(win => {
                var expectedAmount = PaylikeTestHelper.filterAndGetAmountInMinor($totalAmount, currency);
                var orderTotalAmount = Number(win.Drupal.settings.uc_paylike.config.amount);
                expect(expectedAmount).to.eq(orderTotalAmount);
            });
        });

        cy.wait(1000);

        /** Show paylike popup. */
        cy.get('#edit-panes-payment-details-paylike-button--2').click();

        /**
         * Fill in Paylike popup.
         */
         PaylikeTestHelper.fillAndSubmitPaylikePopup();

        cy.wait(1000);

        /** Go to order confirmation. */
        cy.get('#edit-continue').click();

        /** Check if order was paid (edit-submit button be visible) and submit it. */
        cy.get('.ucSubmitOrderThrobber-processed').should('be.visible').click();

        cy.get('h1#page-title').should('be.visible').contains('Order complete');
    },

    /**
     * Make payment with specified currency and process order
     *
     * @param {String} currency
     * @param {String} paylikeAction
     * @param {Boolean} partialAmount
     */
     payWithSelectedCurrency(currency, paylikeAction, partialAmount = false) {
        /** Make an instant payment. */
        it(`makes a Paylike payment with "${currency}"`, () => {
            this.makePaymentFromFrontend(currency);
        });

        /** Process last order from admin panel. */
        it(`process (${paylikeAction}) an order from admin panel`, () => {
            this.processOrderFromAdmin(paylikeAction, partialAmount);
        });
    },

    /**
     * Process last order from admin panel
     * @param {String} paylikeAction
     * @param {Boolean} partialAmount
     */
    processOrderFromAdmin(paylikeAction, partialAmount = false) {
        /** Go to admin orders page. */
        cy.goToPage(this.OrdersPageAdminUrl);

        // /** Click on first (latest in time) order from orders table. */
        cy.get('td.views-field.views-field-order-id a').first().click();

        /**
         * Take specific action on order
         */
        this.paylikeActionOnOrderAmount(paylikeAction, partialAmount);
    },

    /**
     * Capture an order amount
     * @param {String} paylikeAction
     * @param {Boolean} partialAmount
     */
     paylikeActionOnOrderAmount(paylikeAction, partialAmount = false) {
        cy.get('#edit-submit').click();

        if ('capture' === paylikeAction && partialAmount) {
            cy.get('input[id=edit-amount]').then($editAmountInput => {
                var totalAmount = $editAmountInput.val();
                /** Subtract 10 major units from amount. */
                $editAmountInput.val(Math.round(totalAmount - 10));
            });
            /** Submit partial capture. */
            cy.get('#edit-charge-card').click();

            /** Check if success message. */
            cy.get('#console div.messages.status').should('contain', 'successfully');

            /** Jump to next function call. We do not need any action after this. */
            return;
        } else if ('refund' === paylikeAction && partialAmount) {
            cy.get('input[id=edit-amount]').then($editAmountInput => {
                /**
                 * Put 15 major units to be refunded.
                 * Premise: any product must have price >= 15.
                 */
                $editAmountInput.val(15);
            });
            /** Submit partial refund. */
            cy.get('#edit-refund').click();

            /** Check if success message. */
            cy.get('#console div.messages.status').should('contain', 'successfully');

            /** Jump to next function call. We do not need any action after this. */
            return;
        } else if ('void' === paylikeAction && partialAmount) {
            cy.get('input[id=edit-amount]').then($editAmountInput => {
                /**
                 * Put 15 major units to be voided.
                 * Premise: any product must have price >= 15.
                 */
                $editAmountInput.val(15);
            });
            /** Submit partial void. */
            cy.get('#edit-auth-void').click();

            /** Check if success message. */
            cy.get('#console div.messages.status').should('contain', 'successfully');

            /** Jump to next function call. We do not need any action after this. */
            return;
        }

        /** Select authorized/captured transaction. */
        cy.get('input[name=select_auth]').click();

        switch (paylikeAction) {
            case 'capture':
                cy.get('#edit-auth-capture').click();
                break;
            case 'refund':
                cy.get('#edit-refund').click();
                break;
            case 'void':
                cy.get('#edit-auth-void').click();
                break;
        }

        /** Check if success message. */
        cy.get('#console div.messages.status').should('contain', 'successfully');
    },

    /**
     * Change shop currency from admin
     */
    changeShopCurrencyFromAdmin(currency) {
        /** Go to edit shop page. */
        cy.goToPage(this.ShopAdminUrl);

        /** Select currency & save. */
        cy.get('.vertical-tabs-list li:nth-child(3)').click();

        cy.get('#edit-uc-currency-code').clear().type(currency);
        cy.get('#edit-uc-currency-sign').clear().type(currency);
        cy.get('#edit-submit').click();
    },

    /**
     * Get Shop & Paylike versions and send log data.
     */
    logVersions() {
        // /** Go to Virtuemart config page. */
        // cy.goToPage(this.VirtuemartConfigAdminUrl);

        // /** Get Framework version. */
        // cy.get('#status.navbar').then(($frameworkVersionFromPage) => {
        //     var versionText = $frameworkVersionFromPage.text();
        //     var frameworkVersion = versionText.match(/\d*\.\d*((\.\d*)?)*/g);
        //     cy.wrap(frameworkVersion[0]).as('frameworkVersion');
        // });

        // /** Get shop version. */
        // cy.get('.vm-installed-version').first().then(($shopVersionFromPage) => {
        //     var versionText = $shopVersionFromPage.text();
        //     var shopVersion = versionText.replace('VirtueMart ', '');
        //     cy.wrap(shopVersion).as('shopVersion');
        // });

        // /** Go to extensions admin page. */
        // cy.goToPage(this.ModulesAdminUrl);

        // /** Search for paylike. */
        // cy.get('#filter_search').clear().type(`${this.PaylikeName}{enter}`);

        // cy.get('#manageList tbody tr:nth-child(1) td:nth-child(6)').then($paylikeVersionFromPage => {
        //     var paylikeVersion = ($paylikeVersionFromPage.text()).replace(/[^0-9.]/g, '');
        //     /** Make global variable to be accessible bellow. */
        //     cy.wrap(paylikeVersion).as('paylikeVersion');
        // });

        // /** Get global variables and make log data request to remote url. */
        // cy.get('@frameworkVersion').then(frameworkVersion => {
        //     cy.get('@shopVersion').then(shopVersion => {
        //         cy.get('@paylikeVersion').then(paylikeVersion => {

        //             cy.request('GET', this.RemoteVersionLogUrl, {
        //                 key: shopVersion,
        //                 tag: this.ShopName,
        //                 view: 'html',
        //                 framework: frameworkVersion,
        //                 ecommerce: shopVersion,
        //                 plugin: paylikeVersion
        //             }).then((resp) => {
        //                 expect(resp.status).to.eq(200);
        //             });
        //         });
        //     });
        // });
    },
}