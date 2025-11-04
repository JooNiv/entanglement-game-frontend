import { CProgressBar } from '@cscfi/csc-ui-react'

export const Score = ({ result, resultsRef }) => {
    return (
        <div id="score" ref={resultsRef} className="flex flex-col gap-4 border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg">
            <div className="">
                <h4 className="text-2xl font-bold">Score:</h4>
            </div>
            <div>

                <div>
                    {(() => {
                        const display = result;
                        const val00 = display.get("00") || 0;
                        const val11 = display.get("11") || 0;
                        return (
                            <>
                                <p className="ml-1">{val00 + val11}/1000</p>
                                <CProgressBar hideDetails value={(val00 + val11) / 10} />
                            </>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}