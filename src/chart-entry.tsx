import React from 'react';
import ReactDOM from 'react-dom/client';
import { SeriesWinsChart } from './SeriesWinsChart';

function mountChart() {
  const container = document.getElementById('series-trend-chart-root');
  if (container) {
    // Avoid double mounting
    if ((container as any).__reactRoot) {
      return;
    }
    const root = ReactDOM.createRoot(container);
    (container as any).__reactRoot = root;
    root.render(
      <React.StrictMode>
        <SeriesWinsChart />
      </React.StrictMode>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountChart);
} else {
  mountChart();
}

// Global hook to trigger update from vanilla JS
(window as any).refreshSeriesChart = () => {
  window.dispatchEvent(new Event('nim_series_updated'));
};
