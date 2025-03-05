'use client';

import UserProfileBar from './ProfileBar';

/**
 * This is a re-export of ProfileBar to maintain backward compatibility
 */
const UserProfileBarWrapper = ({ pathname }: { pathname: string }) => {
    return <UserProfileBar pathname={pathname} />;
};

export default UserProfileBarWrapper;