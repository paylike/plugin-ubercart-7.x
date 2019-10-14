<?php

/**
 * Configuration form
 */
function uc_paylike_settings_form() {
  $form['uc_paylike_settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('Paylike settings'),
  );
  $form['uc_paylike_settings']['uc_paylike_test_mode'] = array(
    '#type' => 'checkbox',
    '#title' => t('Test mode'),
    '#default_value' => variable_get('uc_paylike_test_mode', true),
  );
  $form['uc_paylike_settings']['uc_paylike_api_key_test_public'] = array(
    '#type' => 'textfield',
    '#title' => t('Test Public Key'),
    '#default_value' => variable_get('uc_paylike_api_key_test_public', ''),
    '#description' => t('Your Development Paylike Public API Key.'),
  );
  $form['uc_paylike_settings']['uc_paylike_api_key_test_private'] = array(
    '#type' => 'textfield',
    '#title' => t('Test Secret Key'),
    '#default_value' => variable_get('uc_paylike_api_key_test_private', ''),
    '#description' => t('Your Development Paylike Private API Key. An API key can be obtained by creating a merchant and adding an app through Paylike <a href="@dashboard" target="_blank">dashboard</a>.', array('@dashboard' => 'https://app.paylike.io/')),
  );

  $form['uc_paylike_settings']['uc_paylike_api_key_live_public'] = array(
    '#type' => 'textfield',
    '#title' => t('Live Public Key'),
    '#default_value' => variable_get('uc_paylike_api_key_live_public', ''),
    '#description' => t('Your Live Paylike Public API Key.'),
  );
  $form['uc_paylike_settings']['uc_paylike_api_key_live_private'] = array(
    '#type' => 'textfield',
    '#title' => t('Live Secret Key'),
    '#default_value' => variable_get('uc_paylike_api_key_live_private', ''),
    '#description' => t('Your Live Paylike Private API Key. An API key can be obtained by creating a merchant and adding an app through Paylike <a href="@dashboard" target="_blank">dashboard</a>.', array('@dashboard' => 'https://app.paylike.io/')),
  );
  $form['uc_paylike_settings']['uc_paylike_method_title'] = array(
    '#type' => 'textarea',
    '#title' => t('Payment method title'),
    '#default_value' => variable_get('uc_paylike_method_title'),
    '#description' => t('The title will appear on checkout page. Leave blank for default "credit card" title.'),
  );
  $form['uc_paylike_settings']['uc_paylike_method_description'] = array(
    '#type' => 'textarea',
    '#title' => t('Payment method description'),
    '#default_value' => variable_get('uc_paylike_method_description', variable_get('uc_credit_policy')),
    '#description' => t('The description will appear on checkout page. Leave blank to show credit card payment policy.'),
  );
  $form['uc_paylike_settings']['uc_paylike_popup_title'] = array(
    '#type' => 'textfield',
    '#title' => t('Payment popup title'),
    '#default_value' => variable_get('uc_paylike_popup_title'),
    '#description' => t('The title will appear on the Paylike payment popup window. Leave blank to show the site name.'),
  );
  return $form;
}

/**
 * Implements hook_form_alter().
 */
function uc_paylike_form_alter(&$form, &$form_state, $form_id) {
  echo '';
}

/**
 * Implements hook_form_FORM_ID_alter().
 */
function uc_paylike_form_uc_payment_method_settings_form_alter(&$form, &$form_state, $form_id) {
  if (isset($form['gateways']['uc_paylike']['uc_pg_uc_paylike_cc_txn_type'])) {
    $form['gateways']['uc_paylike']['uc_pg_uc_paylike_cc_txn_type']['#options'] = array(
      'auth_capture' => t('Instant mode'),
      'authorize' => t('Delayed mode'),
    );
  }
}

/**
 * Validation function and normalize keys (trim spaces)
 *
 * @param $form
 * @param $form_state
 */
function uc_paylike_settings_form_validate($form, &$form_state) {
  $elements = array('uc_paylike_api_key_test_private', 'uc_paylike_api_key_test_public',
    'uc_paylike_api_key_live_private', 'uc_paylike_api_key_live_public');

  if ($form_state['values']['uc_pg_uc_paylike_enabled']) {
    foreach ($elements as $element_name) {
      $form_state['values'][$element_name] = _uc_paylike_sanitize_key($form_state['values'][$element_name]);
      if (!_uc_paylike_validate_key($form_state['values'][$element_name])) {
        form_set_error($element_name, t('@name does not appear to be a valid Paylike key', array('@name' => $element_name)));
      }
    }
  }

  // Make sure they haven't tried to validate credit card numbers, as uc_paylike will not provide a real one.
  if (!empty($form_state['values']['uc_credit_validate_numbers'])) {
    form_set_error('uc_credit_validate_numbers', t('When used with Ubercart Paylike, "Validate credit card number at checkout" must be unchecked.'));
  }

}

/**
 * Sanitize and strip whitespace from API keys
 *
 * @param $key
 * @return string
 */
function _uc_paylike_sanitize_key($key) {
  $key = trim($key);
  $key = check_plain($key);
  return $key;
}

/**
 * Validate API key
 *
 * @param $key
 * @return boolean
 */
function _uc_paylike_validate_key($key) {
  $valid = preg_match('/^[a-zA-Z0-9_]+$/', $key);
  return $valid;
}


/**
 * Refund form
 * Implements hook_form_FORM_ID_alter().
 */
function uc_paylike_form_uc_credit_terminal_form_alter(&$form, &$form_state, $form_id) {
  if (!_uc_paylike_is_enabled()) return;
  $order = uc_order_load($form['order_id']['#value']);

  $options = array();
  $captured = $refunded = 0;

  if (isset($order->data['cc_txns']['authorizations'])) {
    foreach ($order->data['cc_txns']['authorizations'] as $auth_id => $data) {
      // Show captured and not refunded transactions
      if (!empty($data['captured']) && empty($data['refunded'])) {
        $options[$auth_id] = t('@auth_id - @date - @amount authorized', array(
          '@auth_id' => strtoupper($auth_id),
          '@date' => format_date($data['authorized'], 'short'),
          '@amount' => uc_currency_format($data['amount']),
        ));
      }
      if (!empty($data['captured'])) {
        $captured += $data['captured'];
      }
      // Count refunded amount
      if (!empty($data['refunded'])) {
        $refunded += $data['refunded'];
      }
    }
  }

  $form['paylike_refund'] = array(
    '#type' => 'fieldset',
    '#title' => t('Paylike refund'),
  );

  $form['paylike_refund']['captured'] = array('#markup' => '<div><strong>' . t('Captured: @captured', array('@captured' => uc_currency_format($captured))) . '</strong></div>');
  $form['paylike_refund']['refunded'] = array('#markup' => '<div><strong>' . t('Refunded: @refunded', array('@refunded' => uc_currency_format($refunded))) . '</strong></div>');

  // Show refund form only if money was captured
  if (!empty($options)) {
    $form['paylike_refund']['refund_transaction'] = array(
      '#type' => 'radios',
      '#title' => t('Select authorization to refund'),
      '#options' => $options,
    );

    $form['paylike_refund']['actions'] = array('#type' => 'actions');
    $form['paylike_refund']['actions']['refund'] = array(
      '#type' => 'submit',
      '#value' => t('Refund'),
      '#validate' => array('uc_paylike_refund_form_validate'),
      '#submit' => array('uc_paylike_refund_form_submit'),
    );
  }

  return $form;
}

/**
 * Refund form validation.
 * @param $form
 * @param $form_state
 */
function uc_paylike_refund_form_validate($form, $form_state) {
  $vals = $form_state['values'];

  if (!isset($vals['order_id']) || empty($vals['order_id']) || !($order = uc_order_load($vals['order_id']))) {
    form_set_error('uc-paylike-refund-form', t('Order not found.'));
  }

  if (!isset($vals['refund_transaction']) || empty($vals['refund_transaction'])) {
    form_set_error('uc-paylike-refund-form', t('Select a transaction to refund.'));
  }
}

/**
 * Refund form submit handler.
 * @param $form
 * @param $form_state
 */
function uc_paylike_refund_form_submit($form, $form_state) {
  global $user;
  $vals = $form_state['values'];
  $order = uc_order_load($vals['order_id']);

  try {
    $transaction_id = $vals['refund_transaction'];

    if (isset($order->data['cc_txns']['authorizations'][$transaction_id])) {
      $transaction_data = &$order->data['cc_txns']['authorizations'][$transaction_id];
    } else {
      throw new Exception(t('Paylike transaction not found.'));
    }

    $amount = uc_currency_format($transaction_data['captured'], false, false, false);
    $transaction = _uc_paylike_transaction_refund($transaction_id, $amount);
    if ($transaction['successful']) {
      $result = array(
        'status' => 'status',
        'message' => t('@amount successfully refunded.', array('@amount' => uc_currency_format($transaction['refundedAmount'] / 100))),
      );
      // Update order info
      $transaction_data['refunded'] = $transaction_data['captured'];
      uc_order_save($order);
    } else {
      throw new Exception($transaction['error']);
    }
  } catch (Exception $e) {
    $result = array(
      'status' => 'error',
      'message' => t('Refund failed. @error', array('@error' => $e->getMessage())),
    );
  }

  uc_order_comment_save($order->order_id, $user->uid, $result['message'], 'admin', 'canceled');
  // Show only successful refunds to user
  if ($result['status'] == 'status') {
    uc_order_comment_save($order->order_id, $user->uid, $result['message'], 'order', 'canceled');
  }

  drupal_set_message($result['message'], $result['status']);
}
