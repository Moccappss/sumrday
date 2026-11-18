import React from 'react';
import { BarChart, Bar, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardTrafficBarChartProps {
  data: any[];
}

const DashboardTrafficBarChart: React.FC<DashboardTrafficBarChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
    <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
      <Tooltip
        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        contentStyle={{
          background: 'var(--cms-panel-bg)',
          border: '1px solid var(--cms-border)',
          borderRadius: 8,
          color: 'var(--cms-text)',
          fontSize: 9,
          fontWeight: 800,
        }}
        formatter={(value: any) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`}
        labelStyle={{ display: 'none' }}
      />
      <Bar dataKey="revenue" fill="var(--cms-accent)" radius={[4, 4, 0, 0]} maxBarSize={20} />
    </BarChart>
  </ResponsiveContainer>
);

export default DashboardTrafficBarChart;
