'use client'

import AvatarUpload from './AvatarUpload'
import PersonalInfoForm from './PersonalInfoForm'
import SecuritySettings from './SecuritySettings'

interface SalesProfileViewProps {
    profile: any
    user: any
}

export default function SalesProfileView({ profile, user }: SalesProfileViewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Identity */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col items-center">
                    <AvatarUpload
                        currentAvatarUrl={profile.avatar_url}
                        userId={user.id}
                        userName={profile.full_name || user.email}
                    />
                    <div className="mt-4 text-center">
                        <h2 className="text-xl font-bold">{profile.full_name || 'Usuario'}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Right Column: Forms */}
            <div className="lg:col-span-2 space-y-8">
                <PersonalInfoForm profile={profile} />
                <SecuritySettings />
            </div>
        </div>
    )
}
