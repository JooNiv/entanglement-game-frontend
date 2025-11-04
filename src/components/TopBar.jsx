import { CButton } from '@cscfi/csc-ui-react'

export const TopBar = ({ setShowAdminModal, setShowQRModal }) => {
    return (
        <div className='pl-2 pt-6 gap-2 sm:gap-0 sm:pt-0 sm:pl-0 flex flex-col sm:flex-row border-b-4 border-[#006778ff] items-start sm:items-center'>

            <h1 className="pl-2 sm:m-6 w-fit sm:w-full text-3xl sm:text-4xl font-bold">Entanglement Game</h1>
            <div className='flex flex-row flex-wrap w-full justify-start sm:justify-end md:flex-nowrap items-center'>
                <CButton
                    type="button"
                    className='flex items-center m-2 sm:mx-6'
                    onClick={() => setShowAdminModal(true)}
                >
                    Admin
                </CButton>
                <CButton
                    type="button"
                    className='flex items-center m-2 sm:mr-6'
                    onClick={() => setShowQRModal(true)}
                >
                    QR Code
                </CButton>
                <CButton
                    type="button"
                    className='flex items-center m-2 sm:mr-6'
                    onClick={() => window.open('https://fiqci.fi/status', '_blank')}
                >
                    Calibration Data
                </CButton>
            </div>
        </div>
    );
};
