/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Functions to support product extraction.
 * @module
 */

import config from 'commerce/config';
import {updateProductWithExtracted} from 'commerce/background/price_updates';
import {extractedProductShape} from 'commerce/state/products';
import {validatePropType} from 'commerce/utils';

/**
 * Triggers background tasks when a product is extracted from a webpage. Along
 * with normal page navigation, this is also run when the prices are being
 * updated in the background.
 *
 * @param {ExtractedProduct} extracted
 * @param {MessageSender} sender
 *  The sender for the content script that extracted this product
 */
export async function handleExtractedProductData(extractedProduct, sender) {
  // Do nothing if the extracted product is missing fields.
  const result = validatePropType(extractedProduct, extractedProductShape);
  if (result !== undefined) {
    return;
  }

  if (sender.tab) {
    const tabId = sender.tab.id;

    // Update the toolbar icon's URL with the current page's product if we can
    const url = new URL(await config.get('browserActionUrl'));
    url.searchParams.set('extractedProduct', JSON.stringify(extractedProduct));

    // Update the toolbar popup while it is open with the current page's product
    if (sender.tab.active) {
      browser.runtime.sendMessage({
        subject: 'extracted-product',
        extractedProduct,
      });
    }

    browser.browserAction.setPopup({popup: url.href, tabId});
    browser.browserAction.setBadgeBackgroundColor({
      color: await config.get('badgeDetectBackground'),
      tabId,
    });
    browser.browserAction.setBadgeText({text: '✚', tabId});
  }

  // Update saved product data if it exists
  updateProductWithExtracted(extractedProduct);
}