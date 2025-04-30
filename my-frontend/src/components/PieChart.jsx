import { Pie } from 'react-chartjs-2';
export const PieChart = ({ labels, values }) => {
  const data = { labels, datasets: [{ data: values, backgroundColor: ['#4f46e5','#06b6d4','#10b981'] }] };
  return <Pie data={data} />;
};
