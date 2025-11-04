import { CButton, CModal, CCard, CCardContent, CCardActions, CCardTitle } from '@cscfi/csc-ui-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect } from 'react'


export const QrModal = ({ showQRModal, setShowQRModal, currentUrl }) => {

    const useWindowSize = () => {
        const [width, setWidth] = useState(
            typeof window !== 'undefined' ? window.innerWidth : 0
        );

        useEffect(() => {
            const onResize = () => setWidth(window.innerWidth);

            window.addEventListener('resize', onResize);
            // In case the window was resized before the listener attached
            onResize();

            return () => {
                window.removeEventListener('resize', onResize);
            };
        }, []);

        return { width };
    }

    const { width } = useWindowSize();
    let size;

    if (width >= 2600) size = 'large';
    else if (width >= 768) size = 'medium';
    else size = 'small';

    const modalWidths = { small: '90vw', medium: '1400px', large: '50vw' }


    return (
        <CModal
            value={showQRModal}
            width={modalWidths[size]}
            dismissable
            onChangeValue={e => setShowQRModal(e.detail)}

        >
            <CCard>
                <CCardContent>
                    <CCardTitle className='font-bold'>QR Code</CCardTitle>
                    <div className="flex justify-center mb-4">
                        <QRCodeSVG
                            className="min-h-[50vh] w-auto"
                            value={currentUrl}
                        />
                    </div>
                    <p className="text-sm text-gray-600 text-center break-all">
                        {currentUrl}
                    </p>
                </CCardContent>
                <CCardActions>
                    <CButton
                        type="button"
                        onClick={() => setShowQRModal(false)}
                        className="ml-auto"
                    >
                        Close
                    </CButton>
                </CCardActions>
            </CCard>
        </CModal>

    )
}