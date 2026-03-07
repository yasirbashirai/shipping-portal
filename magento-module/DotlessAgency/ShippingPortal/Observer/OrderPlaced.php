<?php
/**
 * Observer triggered after Magento order placement
 * Sends order data to the Shipping Portal API via webhook
 */

namespace DotlessAgency\ShippingPortal\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\HTTP\Client\Curl;
use Psr\Log\LoggerInterface;

class OrderPlaced implements ObserverInterface
{
    /** @var ScopeConfigInterface */
    private $scopeConfig;

    /** @var Curl */
    private $curl;

    /** @var LoggerInterface */
    private $logger;

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        Curl $curl,
        LoggerInterface $logger
    ) {
        $this->scopeConfig = $scopeConfig;
        $this->curl = $curl;
        $this->logger = $logger;
    }

    /**
     * Execute observer — sends order webhook to shipping portal
     *
     * @param Observer $observer
     * @return void
     */
    public function execute(Observer $observer)
    {
        $order = $observer->getEvent()->getOrder();

        if (!$this->scopeConfig->getValue('carriers/shippingportal/active')) {
            return;
        }

        $apiUrl = $this->scopeConfig->getValue('carriers/shippingportal/portal_api_url');
        $secretKey = $this->scopeConfig->getValue('carriers/shippingportal/api_secret_key');
        $sourceWebsite = $this->scopeConfig->getValue('carriers/shippingportal/source_website');

        // Map config value to enum
        $sourceMap = [
            'cabinets_deals' => 'CABINETS_DEALS',
            'northville_cabinetry' => 'NORTHVILLE_CABINETRY',
        ];

        $shippingAddress = $order->getShippingAddress();

        $payload = [
            'magentoOrderId' => $order->getIncrementId(),
            'sourceWebsite' => $sourceMap[$sourceWebsite] ?? 'CABINETS_DEALS',
            'customer' => [
                'email' => $order->getCustomerEmail(),
                'firstName' => $order->getCustomerFirstname(),
                'lastName' => $order->getCustomerLastname(),
                'phone' => $shippingAddress ? $shippingAddress->getTelephone() : null,
            ],
            'shipmentDetails' => $this->getShipmentDetailsFromQuote($order),
            'selectedRateSessionId' => $order->getData('shipping_portal_session_id'),
            'totalAmount' => (float) $order->getGrandTotal(),
        ];

        // Generate HMAC signature
        if ($secretKey) {
            $payload['signature'] = hash_hmac('sha256', json_encode($payload), $secretKey);
        }

        try {
            $this->curl->addHeader('Content-Type', 'application/json');
            $this->curl->post($apiUrl . '/api/orders', json_encode($payload));

            $response = $this->curl->getBody();
            $this->logger->info('ShippingPortal webhook sent', [
                'order_id' => $order->getIncrementId(),
                'response' => $response,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('ShippingPortal webhook failed', [
                'order_id' => $order->getIncrementId(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Extract shipment details from the order/quote session
     *
     * @param \Magento\Sales\Model\Order $order
     * @return array
     */
    private function getShipmentDetailsFromQuote($order)
    {
        $shippingAddress = $order->getShippingAddress();
        $originZip = $this->scopeConfig->getValue('carriers/shippingportal/origin_zip') ?: '30301';

        // Default shipment details — actual values populated from checkout widget session
        return [
            'originZip' => $originZip,
            'destinationZip' => $shippingAddress ? $shippingAddress->getPostcode() : '',
            'destinationCity' => $shippingAddress ? $shippingAddress->getCity() : '',
            'destinationState' => $shippingAddress ? $shippingAddress->getRegionCode() : '',
            'cabinetCount' => 1,
            'cabinetType' => 'RTA',
            'hasLazySusan' => false,
            'lazySusanQty' => 0,
            'hasVentHood' => false,
            'ventHoodQty' => 0,
            'hasDrawers' => false,
            'drawerQty' => 0,
            'deliveryLocationType' => 'RESIDENTIAL',
            'deliveryMethod' => 'CURBSIDE',
            'appointmentRequired' => false,
            'estimatedWeight' => 65,
            'freightClass' => '92.5',
            'estimatedPallets' => 1,
        ];
    }
}
