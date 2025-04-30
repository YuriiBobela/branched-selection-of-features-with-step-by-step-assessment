import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip } from 'recharts';

export const PCAChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <ScatterChart>
      <XAxis dataKey="x" name="PC1" />
      <YAxis dataKey="y" name="PC2" />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Scatter data={data} fill="#06b6d4" />
    </ScatterChart>
  </ResponsiveContainer>
);
