import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend, Title } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend, Title);

export default function DashboardOrderChart({ paidOrders, unpaidOrders }) {
  const data = {
    labels: ["Paid Orders", "Unpaid Orders"],
    datasets: [
      {
        data: [paidOrders, unpaidOrders],
        backgroundColor: ["#36a2eb", "#ff6384"],
        borderWidth: 2,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: true, position: "bottom" },
      title: { display: true, text: "Order Payment Status" },
    },
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
  };
  return (
    <div style={{ height: 260, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Doughnut data={data} options={options} style={{ maxWidth: 300, maxHeight: 220 }} />
    </div>
  );
}
