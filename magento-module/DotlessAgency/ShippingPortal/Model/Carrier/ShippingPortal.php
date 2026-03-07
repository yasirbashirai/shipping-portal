<?php
/**
 * Magento 2 carrier model for Shipping Portal
 * Integrates with the portal API to provide LTL freight rates at checkout
 */

namespace DotlessAgency\ShippingPortal\Model\Carrier;

use Magento\Quote\Model\Quote\Address\RateRequest;
use Magento\Shipping\Model\Carrier\AbstractCarrier;
use Magento\Shipping\Model\Carrier\CarrierInterface;

class ShippingPortal extends AbstractCarrier implements CarrierInterface
{
    protected $_code = 'shippingportal';
    protected $_isFixed = false;

    /**
     * Collect shipping rates — delegates to the portal widget
     * Rates are populated by the React checkout widget via JavaScript
     *
     * @param RateRequest $request
     * @return \Magento\Shipping\Model\Rate\Result|bool
     */
    public function collectRates(RateRequest $request)
    {
        if (!$this->getConfigFlag('active')) {
            return false;
        }

        $result = $this->_rateResultFactory->create();
        $method = $this->_rateMethodFactory->create();

        $method->setCarrier($this->_code);
        $method->setCarrierTitle($this->getConfigData('title'));
        $method->setMethod('freight');
        $method->setMethodTitle('LTL Freight — Select carrier below');
        $method->setPrice(0);
        $method->setCost(0);

        $result->append($method);

        return $result;
    }

    /**
     * Get allowed shipping methods
     *
     * @return array
     */
    public function getAllowedMethods()
    {
        return ['freight' => $this->getConfigData('title')];
    }
}
