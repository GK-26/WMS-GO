import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';

export const DashboardOverviewPage: React.FC = () => {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: '#4bc0c0',
        tension: 0.4
      },
      {
        label: 'Revenue',
        data: [28, 48, 40, 19, 86, 27],
        fill: false,
        borderColor: '#ff6384',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: '#495057'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#ebedef'
        }
      },
      y: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#ebedef'
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">1,234</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">$45,678</div>
          <div className="text-sm text-gray-600">Revenue</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">567</div>
          <div className="text-sm text-gray-600">Pending Shipments</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">89%</div>
          <div className="text-sm text-gray-600">Order Accuracy</div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Performance Trends</h3>
          <Button label="Export Data" icon="pi pi-download" size="small" />
        </div>
        <Chart type="line" data={chartData} options={chartOptions} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Laptop Computer</span>
              <span className="font-semibold">234 units</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Wireless Mouse</span>
              <span className="font-semibold">189 units</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Office Chair</span>
              <span className="font-semibold">156 units</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-semibold">Order ORD-001 shipped</div>
              <div className="text-gray-600">2 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">New shipment received</div>
              <div className="text-gray-600">15 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">Inventory count completed</div>
              <div className="text-gray-600">1 hour ago</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 