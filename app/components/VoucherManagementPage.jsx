
import React, { useState } from 'react';

const VoucherManagement = () => {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('Select your location');
  const [amountToRedeem, setAmountToRedeem] = useState('');
  const [isGiftCard, setIsGiftCard] = useState(false);

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
    <div style={{ 
      backgroundColor: '#4a4a4a', 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: '#4a4a4a', 
        border: '2px solid #fff',
        borderRadius: '8px',
        padding: '20px',
        margin: '0 auto',
        maxWidth: '1200px'
      }}>
        {/* Sort and Filter Header */}
        <h2 style={{ 
          color: '#fff', 
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: 'normal'
        }}>
          Sort and Filter
        </h2>

        {/* Filter Buttons Row - Aligned with table columns */}
        <div style={{ 
          display: 'flex', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* Empty space for left tabs area */}
          <div style={{ minWidth: '140px' }}></div>
          
          {/* Filter buttons aligned with table columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: activeTab === 'vouchers' ? '1fr 1fr 1fr 2fr' : '1fr 3fr',
            gap: '10px',
            flex: 1
          }}>
            {activeTab === 'vouchers' ? (
              <>
                <button style={{
                  backgroundColor: 'transparent',
                  border: '2px solid #fff',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Purchase Date
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  border: '2px solid #fff',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Location
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  border: '2px solid #fff',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Status
                </button>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #fff',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </>
            ) : (
              <>
                <button style={{
                  backgroundColor: 'transparent',
                  border: '2px solid #fff',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Purchase Date
                </button>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #fff',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div style={{ 
          display: 'flex', 
          gap: '20px'
        }}>
          {/* Left Side Tabs */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '10px',
            minWidth: '120px'
          }}>
            <button
              onClick={() => setActiveTab('vouchers')}
              style={{
                backgroundColor: activeTab === 'vouchers' ? '#4A90E2' : 'transparent',
                border: '2px solid #fff',
                color: '#fff',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '4px',
                textAlign: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              Vouchers
            </button>
            <button
              onClick={() => setActiveTab('giftcards')}
              style={{
                backgroundColor: activeTab === 'giftcards' ? '#4A90E2' : 'transparent',
                border: '2px solid #fff',
                color: '#fff',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '4px',
                textAlign: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              Gift Cards
            </button>
          </div>

          {/* Right Side Content */}
          <div style={{ flex: 1 }}>

        {/* Data Table */}
        <div style={{ 
          border: '2px solid #fff',
          borderRadius: '4px'
        }}>
          {/* Table Header */}
          <div style={{
            padding: '0 140px 0 80px',
            backgroundColor: '#4a4a4a'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: activeTab === 'vouchers' ? '1fr 1fr 1fr 1fr 1fr 100px' : '1fr 1fr 1fr 1fr 1fr 100px',
              backgroundColor: '#4a4a4a',
              borderBottom: '1px solid #fff',
              padding: '12px 0',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
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
                style={{
                  padding: index === voucherData.length - 1 ? '0 140px 12px 80px' : '0 140px 0 80px',
                  backgroundColor: '#4a4a4a'
                }}
              >
                <div
                    style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 100px',
                    backgroundColor: '#4a4a4a',
                    borderBottom: '1px solid #fff',
                    padding: '12px 0',
                    color: '#fff',
                    fontSize: '14px',
                    alignItems: 'center'
                  }}
                >
                  <div>{voucher.orderNumber}</div>
                  <div>{voucher.expiration}</div>
                  <div>{voucher.locationUsed}</div>
                  <div>{voucher.useDate}</div>
                  <div>{voucher.status}</div>
                  <div style={{ position: 'relative', width: '100%', height: 'calc(100% + 24px)', top: '-0px' }}>
                    {voucher.status === 'VALID' && (
                      <button
                        onClick={() => handleUseVoucher(voucher.orderNumber)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: '46px',
                          backgroundColor: '#000',
                          border: '1px solid #fff',
                          color: '#fff',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 0,
                          margin: 0
                        }}
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
                style={{
                  padding: index === giftCardData.length - 1 ? '0 140px 12px 80px' : '0 140px 0 80px',
                  backgroundColor: '#4a4a4a'
                }}
              >
                <div
                    style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 100px',
                    backgroundColor: '#4a4a4a',
                    borderBottom: '1px solid #fff',
                    padding: '12px 0',
                    color: '#fff',
                    fontSize: '14px',
                    alignItems: 'center'
                  }}
                >
                  <div>{giftCard.giftCardCode}</div>
                  <div>{giftCard.value}</div>
                  <div>{giftCard.remainingValue}</div>
                  <div>{giftCard.locationUsed}</div>
                  <div>{giftCard.useDate}</div>
                  <div style={{ position: 'relative', width: '100%', height: 'calc(100% + 24px)', top: '-0px' }}>
                    {giftCard.hasUseButton && (
                      <button
                        onClick={() => handleUseGiftCard(giftCard.giftCardCode)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: '46px',
                          backgroundColor: '#000',
                          border: '1px solid #fff',
                          color: '#fff',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 0,
                          margin: 0
                        }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#4a4a4a',
            border: '3px solid #fff',
            borderRadius: '12px',
            padding: '40px',
            minWidth: '600px',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={closePopup}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            {/* Gift Card ID and Amount to Redeem Section */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#fff', fontSize: '18px', marginRight: '15px' }}>
                  {isGiftCard ? 'Gift Card ID:' : 'Voucher ID:'}
                </span>
                <input
                  type="text"
                  value={selectedVoucher?.orderNumber || selectedVoucher?.giftCardCode}
                  readOnly
                  style={{
                    backgroundColor: '#000',
                    border: '2px solid #fff',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '4px',
                    fontSize: '16px',
                    outline: 'none',
                    width: '120px',
                    textAlign: 'center',
                    marginRight: '15px'
                  }}
                />
                <span style={{
                  color: '#00ff00',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginRight: '15px'
                }}>
                  ● {isGiftCard ? 'Valid Gift Card' : 'Valid voucher'}
                </span>
                {isGiftCard && (
                  <>
                    <span style={{ color: '#fff', fontSize: '18px', marginRight: '15px' }}>
                      Amount to Redeem:
                    </span>
                    <input
                      type="text"
                      value={amountToRedeem}
                      onChange={(e) => setAmountToRedeem(e.target.value)}
                      placeholder="$XX,XX"
                      style={{
                        backgroundColor: '#000',
                        border: '2px solid #fff',
                        color: '#fff',
                        padding: '8px 20px',
                        borderRadius: '4px',
                        fontSize: '16px',
                        outline: 'none',
                        width: '120px'
                      }}
                    />
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#fff', fontSize: '18px', marginRight: '15px' }}>
                  Location:
                </span>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{
                    backgroundColor: '#000',
                    border: '2px solid #fff',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '4px',
                    fontSize: '16px',
                    outline: 'none',
                    width: '200px',
                    cursor: 'pointer',
                    appearance: 'none',
                    marginRight: '100px'
                  }}
                >
                  <option value="Select your location" disabled>Select your location</option>
                  {locations.map(location => (
                    <option key={location} value={location} style={{ backgroundColor: '#000', color: '#fff' }}>
                      {location}
                    </option>
                  ))}
                </select>
                {isGiftCard && (
                  <>
                    <span style={{ color: '#fff', fontSize: '18px', marginRight: '15px' }}>
                      Remaining Balance:
                    </span>
                    <input
                      type="text"
                      value={selectedVoucher?.remainingValue || '$0.00'}
                      readOnly
                      style={{
                        backgroundColor: '#000',
                        border: '2px solid #fff',
                        color: '#fff',
                        padding: '8px 20px',
                        borderRadius: '4px',
                        fontSize: '16px',
                        outline: 'none',
                        width: '120px',
                        textAlign: 'center'
                      }}
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
