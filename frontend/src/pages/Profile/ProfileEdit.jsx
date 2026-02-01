import { useGetMeQuery } from '@/features/auth/api/authApi.js';
import UpdateProfilePage from './UpdateProfile.jsx';
import { useNavigate } from 'react-router-dom';
import { useGetUserProfileQuery, useUpdateUserAvatarMutation, useUpdateUserProfileMutation } from '@/features/user/api/userApi.js';
import { Loader2 } from 'lucide-react';

export default function ProfileEditPage() {
  const { data, isLoading: isFetchingUser } = useGetUserProfileQuery();
  const [updateUserProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();
  const [updateUserAvatar, { isLoading: isUpdatingAvatar }] = useUpdateUserAvatarMutation();
  const navigate = useNavigate();

  const user = data?.data;
  console.log(user);
  
  if(isFetchingUser && !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <UpdateProfilePage 
      user={user} 
      updateProfile={updateUserProfile}
      updateAvatar={updateUserAvatar}
      isLoadingAvatar={isUpdatingAvatar}
      isLoadingProfile={isUpdatingProfile}
      onCancel={() => navigate('/profile/me')} 
    />
  );
}