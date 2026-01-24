'use client'

import QRCode from 'react-qr-code'

export default function OrderQRCode({ url }: { url: string }) {
    return (
        <div className="bg-white p-2 inline-block">
            <QRCode value={url} size={120} />
        </div>
    )
}
