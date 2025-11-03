import { CButton } from '@cscfi/csc-ui-react'
import { BarChart } from '@mui/x-charts/BarChart';

export const SelectedResult = ({ selectedRef, selectedResult, setSelectedResult, setSelectedIndex, selectedImage, showQubits }) => {
    return (
        <div ref={selectedRef} className="w-full mt-4 border border-gray-200 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Selected Run - Result Distribution</h3>
                <div>
                    <CButton onClick={() => { setSelectedResult(null); setSelectedIndex(null); }} className="ml-2">Clear</CButton>
                </div>
            </div>
            <div className="mt-4">
                <BarChart
                    barLabel="value"
                    xAxis={[{ id: 'selBarCats', data: Array.from(selectedResult.keys()) }]}
                    series={[{ data: Array.from(selectedResult.values()), label: 'Count', valueFormatter: v => v, showDataLabels: true, dataLabelFormatter: v => v }]}
                    height={260}
                //colors={['#006778ff']}
                />
            </div>
            {(selectedImage && showQubits) && (
                <div className="mt-4">
                    <h4 className="text-xl font-semibold">Selected Run - Executed circuit:</h4>
                    <img src={selectedImage} alt="Circuit Diagram" />
                </div>
            )}
        </div>
    )
}