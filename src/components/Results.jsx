import { BarChart } from '@mui/x-charts/BarChart';

export const Results = ({ result, image }) => {
    return (
        <div id="results" className="grid grid-cols-1 sm:grid-cols-1 gap-6">
            {result && (
                <div className="col-span-1 border border-gray-200 p-4 rounded-lg shadow-lg">
                    <h4 className="text-2xl font-bold">Result Distribution:</h4>
                    <BarChart
                        barLabel="value"
                        xAxis={[
                            {
                                id: 'barCategories',
                                data: Array.from(result.keys()),
                            },
                        ]}
                        series={[
                            {
                                data: Array.from(result.values()),
                                label: "Count",
                                valueFormatter: (value) => value, // optional, for tooltip
                                showDataLabels: true, // <-- show value labels on bars
                                dataLabelFormatter: (value) => value, // <-- label is the value
                            },
                        ]}
                        height={300}
                    />
                </div>
            )}
            {image && (
                <div className="col-span-1 h-min border border-gray-200 p-4 rounded-lg shadow-lg">
                    <h4 className="text-2xl font-bold">Executed circuit:</h4>
                    <img src={image} alt="Circuit Diagram" />
                </div>
            )}
        </div>
    )
}