import { redirect } from 'next/navigation'

export default async function PortalIndex() {
    redirect('/portal/dashboard')
}
