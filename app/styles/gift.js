const styles = {
  wrapper: {
    maxWidth: "600px",
    margin: "20px auto",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "#862633",
    borderRadius: "12px",
    padding: "30px",
    color: "white",
    position: "relative",
    height: "250px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    color: "#862633",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px",
    fontWeight: "bold",
    objectFit: "contain",
  },
  voucherId: {
    fontSize: "28px",
    fontWeight: "600",
    color: "white",
  },
  balanceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: "32px",
    fontWeight: "600",
    color: "white",
  },
  amount: {
    fontSize: "46px",
    fontWeight: "bold",
    color: "white",
  },
};

export default styles;
