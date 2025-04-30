import HeatMap from 'react-heatmap-grid';
export const Heatmap = ({ xLabels, yLabels, data }) => (
  <HeatMap xLabels={xLabels} yLabels={yLabels} data={data}
    xLabelWidth={100} square={true} height={30} />
);
