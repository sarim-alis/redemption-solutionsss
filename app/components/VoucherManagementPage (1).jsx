
import React, { useState, useEffect } from 'react';
import { voucherManagementStyles } from './VoucherManagementPageStyles';

const VoucherManagement = () => {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('Select your location');
  const [amountToRedeem, setAmountToRedeem] = useState('');
  const [isGiftCard, setIsGiftCard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const voucherData = [
    { orderNumber: '39A3-292A', expiration: '12-29-25', locationUsed: 'Woodland Hills', useDate: '6-13-25', status: 'USED' },
    { orderNumber: '39A3-292B', expiration: '6-29-24', locationUsed: '--', useDate: '--', status: 'EXPIRED' },
    { orderNumber: '39A3-292C', expiration: '5-20-24', locationUsed: '--', useDate: '--', status: 'EXPIRED' },
    { orderNumber: '39A3-292D', expiration: '12-29-25', locationUsed: '--', useDate: '--', status: 'VALID' },
    { orderNumber: '39A3-292E', expiration: '12-29-25', locationUsed: 'Pomona', useDate: '6-12-25', status: 'USED' },
    { orderNumber: '39A3-292F', expiration: '12-29-25', locationUsed: '--', useDate: '--', status: 'VALID' },
    { orderNumber: '39A3-292G', expiration: '12-29-25', locationUsed: 'Ventura', useDate: '7-13-25', status: 'USED' },
    { orderNumber: '39A3-292H', expiration: '12-29-25', locationUsed: '--', useDate: '--', status: 'VALID' },
    { orderNumber: '39A3-292I', expiration: '01-29-25', locationUsed: '--', useDate: '--', status: 'EXPIRED' },
    { orderNumber: '39A3-292J', expiration: '12-29-25', locationUsed: '--', useDate: '--', status: 'VALID' },
    { orderNumber: '39A3-292K', expiration: '12-29-25', locationUsed: 'Century City', useDate: '8-10-25', status: 'USED' },
    { orderNumber: '39A3-292L', expiration: '12-29-25', locationUsed: '--', useDate: '--', status: 'VALID' }
  ];

  const giftCardData = [
    { giftCardCode: '39A3-292A', value: '$100.00', remainingValue: '$50.00', locationUsed: 'Santa Monica', useDate: '6-13-25', hasUseButton: true },
    { giftCardCode: '39A3-292B', value: '$200.00', remainingValue: '$50.00', locationUsed: 'Ventura', useDate: '7-02-25', hasUseButton: true },
    { giftCardCode: '39A3-292C', value: '$250.00', remainingValue: '$0.00', locationUsed: 'Century City', useDate: '5-02-25', hasUseButton: true },
    { giftCardCode: '39A3-292D', value: '--', remainingValue: '$0.00', locationUsed: '--', useDate: '--', hasUseButton: false },
    { giftCardCode: '39A3-292E', value: '--', remainingValue: '$0.00', locationUsed: '--', useDate: '--', hasUseButton: false },
    { giftCardCode: '39A3-292F', value: '--', remainingValue: '$0.00', locationUsed: '--', useDate: '--', hasUseButton: false },
    { giftCardCode: '39A3-292G', value: '--', remainingValue: '$0.00', locationUsed: '--', useDate: '--', hasUseButton: false },
    { giftCardCode: '39A3-292H', value: '--', remainingValue: '$0.00', locationUsed: '--', useDate: '--', hasUseButton: false },
    { giftCardCode: '39A3-292I', value: '--', remainingValue: '$0.00', locationUsed: '--', useDate: '--', hasUseButton: false },
    { giftCardCode: '39A3-292J', value: '$300.00', remainingValue: '$250.00', locationUsed: 'Santa Monica', useDate: '6-13-25', hasUseButton: true },
    { giftCardCode: '39A3-292K', value: '$250.00', remainingValue: '$100.00', locationUsed: 'Pomona', useDate: '7-02-25', hasUseButton: true },
    { giftCardCode: '39A3-292L', value: '$350.00', remainingValue: '$100.00', locationUsed: 'Ventura', useDate: '5-02-25', hasUseButton: true },
    { giftCardCode: '39A3-292M', value: '--', remainingValue: '$0.00', locationUsed: '--', useDate: '--', hasUseButton: false }
  ];

  const handleUseVoucher = (orderNumber) => {
    const voucher = voucherData.find(v => v.orderNumber === orderNumber);
    setSelectedVoucher(voucher);
    setIsGiftCard(false);
    setShowPopup(true);
  };

  const handleUseGiftCard = (giftCardCode) => {
    const giftCard = giftCardData.find(g => g.giftCardCode === giftCardCode);
    setSelectedVoucher({orderNumber: giftCardCode, ...giftCard});
    setIsGiftCard(true);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedVoucher(null);
    setSelectedLocation('Select your location');
    setAmountToRedeem('');
    setIsGiftCard(false);
  };

  const locations = ['Woodland Hills', 'Pomona', 'Ventura', 'Santa Monica', 'Century City'];

  return (
    <div style={voucherManagementStyles.mainContainer(isMobile)}>
      <div style={voucherManagementStyles.contentContainer(isMobile)}>
        {/* Sort and Filter Header */}
        <h2 style={voucherManagementStyles.sortFilterHeader}>
          Sort and Filter
        </h2>

        {/* Filter Buttons Row - Aligned with table columns */}
        <div style={voucherManagementStyles.filterButtonsRow}>
          {/* Empty space for left tabs area - hide on mobile */}
          <div style={voucherManagementStyles.filterEmptySpace(isMobile)}></div>
          
          {/* Filter buttons aligned with table columns */}
          <div style={voucherManagementStyles.filterButtonsGrid(activeTab, isMobile)}>
            {activeTab === 'vouchers' ? (
              <>
                <button style={voucherManagementStyles.filterButton}>
                  Purchase Date
                </button>
                <button style={voucherManagementStyles.filterButton}>
                  Location
                </button>
                <button style={voucherManagementStyles.filterButton}>
                  Status
                </button>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={voucherManagementStyles.searchInput}
                />
              </>
            ) : (
              <>
                <button style={voucherManagementStyles.filterButton}>
                  Purchase Date
                </button>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={voucherManagementStyles.searchInput}
                />
              </>
            )}
          </div>
        </div>

        {/* Mobile Tabs - Show above content on mobile */}
        <div style={voucherManagementStyles.mobileTabsContainer(isMobile)}>
          <button
            onClick={() => setActiveTab('vouchers')}
            style={voucherManagementStyles.mobileTab(activeTab === 'vouchers')}
          >
            Vouchers
          </button>
          <button
            onClick={() => setActiveTab('giftcards')}
            style={voucherManagementStyles.mobileTab(activeTab === 'giftcards')}
          >
            Gift Cards
          </button>
        </div>

        {/* Main Content Layout */}
        <div style={voucherManagementStyles.mainContentLayout(isMobile)}>
          {/* Left Side Tabs - Hide on mobile */}
          <div style={voucherManagementStyles.leftTabsContainer(isMobile)}>
            <button
              onClick={() => setActiveTab('vouchers')}
              style={voucherManagementStyles.leftTab(activeTab === 'vouchers')}
            >
              Vouchers
            </button>
            <button
              onClick={() => setActiveTab('giftcards')}
              style={voucherManagementStyles.leftTab(activeTab === 'giftcards')}
            >
              Gift Cards
            </button>
          </div>

          {/* Right Side Content */}
          <div style={voucherManagementStyles.rightSideContent}>

        {/* Data Table */}
        <div style={voucherManagementStyles.tableContainer}>
          {/* Table Header */}
          <div style={voucherManagementStyles.tableHeaderContainer(isMobile)}>
            <div style={voucherManagementStyles.tableHeader(activeTab, isMobile)}>
              {activeTab === 'vouchers' ? (
                <>
                  <div>Order Number</div>
                  <div>Expiration</div>
                  <div>Location Used</div>
                  <div>Use Date</div>
                  <div>Status</div>
                  <div></div>
                </>
              ) : (
                <>
                  <div>Gift Card Code</div>
                  <div>Value</div>
                  <div>Remaining Value</div>
                  <div>Location Used</div>
                  <div>Use Date</div>
                  <div></div>
                </>
              )}
            </div>
          </div>

          {/* Table Rows */}
          {activeTab === 'vouchers' ? (
            voucherData.map((voucher, index) => (
              <div
                key={voucher.orderNumber}
                style={voucherManagementStyles.tableRowContainer(index, voucherData.length, isMobile)}
              >
                <div style={voucherManagementStyles.tableRow(activeTab, isMobile)}>
                  <div>{voucher.orderNumber}</div>
                  <div>{voucher.expiration}</div>
                  <div>{voucher.locationUsed}</div>
                  <div>{voucher.useDate}</div>
                  <div>{voucher.status}</div>
                  <div style={voucherManagementStyles.buttonContainer}>
                    {voucher.status === 'VALID' && (
                      <button
                        onClick={() => handleUseVoucher(voucher.orderNumber)}
                        style={voucherManagementStyles.useButton(isMobile)}
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            giftCardData.map((giftCard, index) => (
              <div
                key={giftCard.giftCardCode}
                style={voucherManagementStyles.tableRowContainer(index, giftCardData.length, isMobile)}
              >
                <div style={voucherManagementStyles.tableRow(activeTab, isMobile)}>
                  <div>{giftCard.giftCardCode}</div>
                  <div>{giftCard.value}</div>
                  <div>{giftCard.remainingValue}</div>
                  <div>{giftCard.locationUsed}</div>
                  <div>{giftCard.useDate}</div>
                  <div style={voucherManagementStyles.buttonContainer}>
                    {giftCard.hasUseButton && (
                      <button
                        onClick={() => handleUseGiftCard(giftCard.giftCardCode)}
                        style={voucherManagementStyles.useButton(isMobile)}
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div style={voucherManagementStyles.popupOverlay}>
          <div style={voucherManagementStyles.popupModal(isMobile)}>
            {/* Close button */}
            <button
              onClick={closePopup}
              style={voucherManagementStyles.closeButton}
            >
              ×
            </button>

            {/* Gift Card ID and Amount to Redeem Section */}
            <div style={voucherManagementStyles.popupContentContainer}>
              <div style={voucherManagementStyles.popupFlexContainer(isMobile)}>
                <span style={voucherManagementStyles.popupLabel(isMobile)}>
                  {isGiftCard ? 'Gift Card ID:' : 'Voucher ID:'}
                </span>
                <input
                  type="text"
                  value={selectedVoucher?.orderNumber || selectedVoucher?.giftCardCode}
                  readOnly
                  style={voucherManagementStyles.popupInput(isMobile)}
                />
                <span style={voucherManagementStyles.validationText(isMobile)}>
                  ● {isGiftCard ? 'Valid Gift Card' : 'Valid voucher'}
                </span>
                {isGiftCard && (
                  <>
                    <span style={voucherManagementStyles.popupLabel(isMobile)}>
                      Amount to Redeem:
                    </span>
                    <input
                      type="text"
                      value={amountToRedeem}
                      onChange={(e) => setAmountToRedeem(e.target.value)}
                      placeholder="$XX,XX"
                      style={voucherManagementStyles.popupInput(isMobile)}
                    />
                  </>
                )}
              </div>

              <div style={voucherManagementStyles.popupFlexContainer(isMobile)}>
                <span style={voucherManagementStyles.popupLabel(isMobile)}>
                  Location:
                </span>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={voucherManagementStyles.popupSelect(isMobile)}
                >
                  <option value="Select your location" disabled>Select your location</option>
                  {locations.map(location => (
                    <option key={location} value={location} style={voucherManagementStyles.selectOption}>
                      {location}
                    </option>
                  ))}
                </select>
                {isGiftCard && (
                  <>
                    <span style={voucherManagementStyles.popupLabel(isMobile)}>
                      Remaining Balance:
                    </span>
                    <input
                      type="text"
                      value={selectedVoucher?.remainingValue || '$0.00'}
                      readOnly
                      style={voucherManagementStyles.popupReadonlyInput(isMobile)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
