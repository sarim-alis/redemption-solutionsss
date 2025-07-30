// VoucherManagementPage Styles - Object-based styling
export const voucherManagementStyles = {
  // Main container styles
  mainContainer: (isMobile) => ({
    backgroundColor: '#4a4a4a',
    minHeight: '100vh',
    padding: isMobile ? '10px' : '20px',
    fontFamily: 'Arial, sans-serif'
  }),

  contentContainer: (isMobile) => ({
    backgroundColor: '#4a4a4a',
    border: '2px solid #fff',
    borderRadius: '8px',
    padding: isMobile ? '10px' : '20px',
    margin: '0 auto',
    maxWidth: isMobile ? '100%' : '1200px'
  }),

  // Header styles
  sortFilterHeader: {
    color: '#fff',
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: 'normal'
  },

  // Filter section styles
  filterButtonsRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },

  filterEmptySpace: (isMobile) => ({
    minWidth: isMobile ? '0px' : '140px',
    '@media (max-width: 768px)': {
      display: 'none'
    }
  }),

  filterButtonsGrid: (activeTab, isMobile) => ({
    display: 'grid',
    gridTemplateColumns: activeTab === 'vouchers' ? 
      (isMobile ? '1fr' : '1fr 1fr 1fr 2fr') : 
      (isMobile ? '1fr' : '1fr 3fr'),
    gap: '10px',
    flex: 1,
    minWidth: 0
  }),

  filterButton: {
    backgroundColor: 'transparent',
    border: '2px solid #fff',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },

  searchInput: {
    backgroundColor: 'transparent',
    border: '2px solid #fff',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none'
  },

  // Mobile tabs styles
  mobileTabsContainer: (isMobile) => ({
    display: isMobile ? 'flex' : 'none',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center'
  }),

  mobileTab: (isActive) => ({
    backgroundColor: isActive ? '#4A90E2' : 'transparent',
    border: '2px solid #fff',
    color: '#fff',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    textAlign: 'center',
    transition: 'background-color 0.2s',
    flex: 1,
    maxWidth: '150px'
  }),

  // Main content layout styles
  mainContentLayout: (isMobile) => ({
    display: 'flex',
    gap: '20px',
    flexDirection: isMobile ? 'column' : 'row'
  }),

  // Left side tabs styles
  leftTabsContainer: (isMobile) => ({
    display: isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '120px'
  }),

  leftTab: (isActive) => ({
    backgroundColor: isActive ? '#4A90E2' : 'transparent',
    border: '2px solid #fff',
    color: '#fff',
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    textAlign: 'center',
    transition: 'background-color 0.2s'
  }),

  // Right side content styles
  rightSideContent: {
    flex: 1
  },

  // Table styles
  tableContainer: {
    border: '2px solid #fff',
    borderRadius: '4px',
    overflowX: 'auto'
  },

  tableHeaderContainer: (isMobile) => ({
    padding: isMobile ? '0 10px' : '0 140px 0 80px',
    backgroundColor: '#4a4a4a'
  }),

  tableHeader: (activeTab, isMobile) => ({
    display: 'grid',
    gridTemplateColumns: activeTab === 'vouchers' ? 
      (isMobile ? '120px 80px 100px 80px 80px 60px' : '1fr 1fr 1fr 1fr 1fr 100px') :
      (isMobile ? '120px 80px 100px 100px 80px 60px' : '1fr 1fr 1fr 1fr 1fr 100px'),
    backgroundColor: '#4a4a4a',
    borderBottom: '1px solid #fff',
    padding: '12px 0',
    color: '#fff',
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 'bold',
    minWidth: isMobile ? '640px' : 'auto'
  }),

  // Table row styles
  tableRowContainer: (index, dataLength, isMobile) => ({
    padding: index === dataLength - 1 ? 
      (isMobile ? '0 10px 12px 10px' : '0 140px 12px 80px') : 
      (isMobile ? '0 10px 0 10px' : '0 140px 0 80px'),
    backgroundColor: '#4a4a4a'
  }),

  tableRow: (activeTab, isMobile) => ({
    display: 'grid',
    gridTemplateColumns: activeTab === 'vouchers' ? 
      (isMobile ? '120px 80px 100px 80px 80px 60px' : '1fr 1fr 1fr 1fr 1fr 100px') :
      (isMobile ? '120px 80px 100px 100px 80px 60px' : '1fr 1fr 1fr 1fr 1fr 100px'),
    backgroundColor: '#4a4a4a',
    borderBottom: '1px solid #fff',
    padding: '12px 0',
    color: '#fff',
    fontSize: isMobile ? '12px' : '14px',
    alignItems: 'center',
    minWidth: isMobile ? '640px' : 'auto'
  }),

  // Button container styles
  buttonContainer: {
    position: 'relative',
    width: '100%',
    height: 'calc(100% + 24px)',
    top: '-0px'
  },

  useButton: (isMobile) => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: isMobile ? '40px' : '46px',
    backgroundColor: '#000',
    border: '1px solid #fff',
    color: '#fff',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: isMobile ? '10px' : '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0
  }),

  // Popup modal styles
  popupOverlay: {
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
  },

  popupModal: (isMobile) => ({
    backgroundColor: '#4a4a4a',
    border: '3px solid #fff',
    borderRadius: '12px',
    padding: isMobile ? '20px' : '40px',
    minWidth: isMobile ? '95vw' : '600px',
    maxWidth: isMobile ? '95vw' : 'none',
    position: 'relative',
    maxHeight: isMobile ? '90vh' : 'none',
    overflowY: isMobile ? 'auto' : 'visible'
  }),

  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer'
  },

  // Popup content styles
  popupContentContainer: {
    marginBottom: '15px'
  },

  popupFlexContainer: (isMobile) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: isMobile ? '10px' : '0'
  }),

  popupLabel: (isMobile) => ({
    color: '#fff',
    fontSize: isMobile ? '16px' : '18px',
    marginRight: '15px',
    minWidth: isMobile ? '100%' : 'auto'
  }),

  popupInput: (isMobile, width = '120px') => ({
    backgroundColor: '#000',
    border: '2px solid #fff',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    width: isMobile ? '100%' : width,
    textAlign: 'center',
    marginRight: isMobile ? '0' : '15px',
    marginBottom: isMobile ? '10px' : '0'
  }),

  popupReadonlyInput: (isMobile, width = '120px') => ({
    backgroundColor: '#000',
    border: '2px solid #fff',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    width: isMobile ? '100%' : width,
    textAlign: 'center'
  }),

  validationText: (isMobile) => ({
    color: '#00ff00',
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: 'bold',
    marginRight: isMobile ? '0' : '15px',
    marginBottom: isMobile ? '10px' : '0',
    minWidth: isMobile ? '100%' : 'auto'
  }),

  popupSelect: (isMobile) => ({
    backgroundColor: '#000',
    border: '2px solid #fff',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    outline: 'none',
    width: isMobile ? '100%' : '200px',
    cursor: 'pointer',
    appearance: 'none',
    marginRight: isMobile ? '0' : '100px',
    marginBottom: isMobile ? '10px' : '0'
  }),

  selectOption: {
    backgroundColor: '#000',
    color: '#fff'
  }
};
