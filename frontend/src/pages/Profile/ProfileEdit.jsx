import { useGetMeQuery } from '@/features/auth/api/authApi.js';
import UpdateProfilePage from './UpdateProfile.jsx';
import { useNavigate } from 'react-router-dom';
import { useUpdateUserProfileMutation } from '@/features/user/api/userApi.js';
import { Loader2 } from 'lucide-react';

export default function ProfileEditPage() {
  const { data, isLoading: isFetchingUser } = useGetMeQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const navigate = useNavigate();

  const user = data?.data?.user;

  if(isFetchingUser) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <UpdateProfilePage 
      user={user} 
      updateUser={updateUser} 
      isLoading={isUpdating} 
      onCancel={() => navigate('/profile/me')} 
    />
  );
}