import { CButton } from '@cscfi/csc-ui-react'

export const ScrollToResults = ({ resultsRef }) => {
    return (
        <CButton
            onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="fixed bottom-4 left-6 z-50 sm:hidden text-white shadow-lg"
            aria-label="Scroll to results"
        >
            <p className="">Results</p>
        </CButton>
    )
}