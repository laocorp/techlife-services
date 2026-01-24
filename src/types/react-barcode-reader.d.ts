declare module 'react-barcode-reader' {
    import { Component } from 'react';

    interface BarcodeReaderProps {
        onScan: (data: string) => void;
        onError?: (err: any) => void;
        minLength?: number;
    }

    export default class BarcodeReader extends Component<BarcodeReaderProps> { }
}
